# Databricks notebook source
# MAGIC %pip install pdfplumber

# COMMAND ----------

# MAGIC %restart_python

# COMMAND ----------


#  IMPORTS

import os
import json
import pdfplumber
import re
from datetime import datetime
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, TimestampType
from pyspark.sql.functions import current_timestamp, col, lag, round
from pyspark.sql.window import Window
from mlflow.deployments import get_deploy_client

# COMMAND ----------


#  CONFIG

VOLUME_PATH = "/Volumes/bharatbricks_hackathon/default/bbhackathon_depricated/MPC Statements/"
LLM_MODEL = "databricks-meta-llama-3-3-70b-instruct"
client = get_deploy_client("databricks")

# Clean Schema for Repo Analytics
REPO_SCHEMA = StructType([
    StructField("file_name", StringType(), True),
    StructField("repo_rate", DoubleType(), True),
    StructField("policy_date", StringType(), True)
])


# COMMAND ----------

#  HELPER FUNCTIONS

def llm_extract(prompt):
    response = client.predict(
        endpoint=LLM_MODEL,
        inputs={"messages": [{"role": "system", "content": "Extract Repo Rate data into valid JSON."},
                             {"role": "user", "content": prompt}]}
    )
    return response["choices"][0]["message"]["content"]

def get_repo_context(pdf_path):
    full_text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                full_text += (page.extract_text() or "") + "\n"
        
        # Target the 'Resolution' section around 'repo rate'
        match = re.search(r"(?i)repo rate", full_text)
        if match:
            start = max(0, match.start() - 2000)
            return full_text[start : start + 10000]
        return full_text[:12000]
    except: return None


# COMMAND ----------

# BRONZE: Raw Text Ingestion

print("Step 1: Bronze Ingestion...") 
files = [f for f in os.listdir(VOLUME_PATH) if f.lower().endswith(".pdf")]
bronze_data = []

for f in files:
    path = os.path.join(VOLUME_PATH, f)
    text = get_repo_context(path)
    if text:
        bronze_data.append((f, path, text, datetime.now()))

df_bronze = spark.createDataFrame(bronze_data, ["file_name", "file_path", "raw_context", "ingestion_time"])
df_bronze.write.mode("overwrite").option("overwriteSchema", "true").saveAsTable("rbi_bronze_docs")

# COMMAND ----------

#  SILVER: Key-Agnostic Extraction 

print(" Step 2: Silver Extraction...") 
silver_results = []
bronze_rows = spark.table("rbi_bronze_docs").collect()

for row in bronze_rows:
    prompt = f"""
    Analyze the RBI Monetary Policy text.
    
    RULES:
    1. REPO_RATE: Extract the NEW or UNCHANGED policy repo rate as a number.
    2. POLICY_DATE: Use the LAST day of the meeting range (e.g., Feb 6 to 8, 2024 -> 2024-02-08).
    
    Return ONLY JSON with keys: "repo_rate", "policy_date".
    
    TEXT:
    {row['raw_context']}
    """
    try:
        raw_output = llm_extract(prompt)
        clean_json = raw_output.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_json)
        
        # Key-Agnostic Normalization (handles "Repo Rate", "repo_rate", etc.)
        norm = {k.lower().replace(" ", "_"): v for k, v in data.items()}
        repo = norm.get("repo_rate") or norm.get("policy_repo_rate")
        date = norm.get("policy_date") or norm.get("meeting_date")

        # Cleanup percentage strings
        if isinstance(repo, str): repo = repo.replace("%", "").strip()
        
        if repo and date:
            silver_results.append((row['file_name'], float(repo), str(date)))
    except: continue

df_silver = spark.createDataFrame(silver_results, schema=REPO_SCHEMA)
df_silver = df_silver.withColumn("processed_at", current_timestamp())
df_silver.write.mode("overwrite").option("overwriteSchema", "true").saveAsTable("rbi_silver_policy")

# COMMAND ----------


#  GOLD: Final Analytics Table 

print(" Step 3: Gold Analytics...") 
spark.sql("""
CREATE OR REPLACE TABLE rbi_gold_repo_rates AS
SELECT 
    CAST(policy_date AS DATE) as policy_date,
    repo_rate,
    file_name
FROM rbi_silver_policy
WHERE repo_rate IS NOT NULL AND policy_date IS NOT NULL
""")

# COMMAND ----------

# Define window specification ordered by policy date
window_spec = Window.orderBy("policy_date")

# Use ROUND to fix the floating-point artifacts
repo_trend_df = spark.table("rbi_gold_repo_rates").withColumn(
    "previous_rate", lag("repo_rate").over(window_spec)
).withColumn(
    # Round to 0 decimal places to get clean integers like 60, 100, 25
    "bp_change", (col("repo_rate") - col("previous_rate")) * 100
)

# Apply round when selecting
display(repo_trend_df.select(
    "policy_date", 
    "repo_rate", 
    round(col("bp_change"), 0).alias("bp_change")
))

# COMMAND ----------

# Cell 10 Alternative: With Databricks Widgets for better UX

from pyspark.sql.functions import col, year, month
import calendar

# Create widgets for month-year selection
dbutils.widgets.text("start_month_year", "01-2024", "Start Month-Year (MM-YYYY)")
dbutils.widgets.text("end_month_year", "12-2024", "End Month-Year (MM-YYYY)")

def analyze_repo_trends_with_widgets():
    """
    Analyze RBI repo rate trends using Databricks widgets.
    Interactive UI for selecting date range.
    """
    
    # Get widget values
    start_input = dbutils.widgets.get("start_month_year")
    end_input = dbutils.widgets.get("end_month_year")
    
    # Parse dates
    try:
        start_month, start_year = map(int, start_input.split("-"))
        end_month, end_year = map(int, end_input.split("-"))
        
        start_date = f"{start_year}-{start_month:02d}-01"
        last_day = calendar.monthrange(end_year, end_month)[1]
        end_date = f"{end_year}-{end_month:02d}-{last_day}"
        
        print(f"Analysis Period: {start_date} to {end_date}\n")
        
    except ValueError:
        print("Invalid format! Use MM-YYYY (e.g., 01-2024)")
        return
    
    # Query with month/year filter
    query = f"""
    SELECT 
        policy_date,
        repo_rate,
        ROUND((repo_rate - LAG(repo_rate) OVER (ORDER BY policy_date)) * 100, 0) AS bp_change
    FROM rbi_gold_repo_rates 
    WHERE policy_date >= '{start_date}' AND policy_date <= '{end_date}'
    ORDER BY policy_date
    """
    
    trend_df = spark.sql(query)
    
    if trend_df.count() == 0:
        print(f"No data found for {start_input} to {end_input}")
        # Show available range
        spark.sql("""
            SELECT 
                DATE_FORMAT(MIN(policy_date), 'MM-yyyy') as earliest,
                DATE_FORMAT(MAX(policy_date), 'MM-yyyy') as latest,
                COUNT(*) as total_records
            FROM rbi_gold_repo_rates
        """).show()
        return
    
    trend_data = trend_df.collect()
    print(f"Found {len(trend_data)} policy decisions\n")
    
    # === DATABRICKS NATIVE VISUALIZATIONS ===
    print("=" * 80)
    print("REPO RATE TREND")
    print("=" * 80)
    display(trend_df.select("policy_date", "repo_rate"))
    
    print("\n" + "=" * 80)
    print("RATE CHANGES (BASIS POINTS)")
    print("=" * 80)
    display(trend_df.select("policy_date", "bp_change").filter("bp_change IS NOT NULL"))
    
    print("\n" + "=" * 80)
    print("DETAILED DATA TABLE")
    print("=" * 80)
    display(trend_df)
    
    # === LLM INSIGHTS ===
    print("\n" + "=" * 80)
    print("AI-POWERED INSIGHTS")
    print("=" * 80 + "\n")
    
    data_summary = []
    for row in trend_data:
        bp = f"{row.bp_change:.0f}" if row.bp_change else "N/A"
        data_summary.append(f"Date: {row.policy_date}, Rate: {row.repo_rate}%, Change: {bp} bps")
    
    analysis_prompt = f"""
    Analyze RBI repo rate trends from {start_input} to {end_input}:
    
    DATA:
    {chr(10).join(data_summary)}
    
    Provide:
    1. Overall trend (hawkish/dovish/neutral) with reasoning
    2. Significant rate changes (dates, magnitudes, context)
    3. Monetary policy stance interpretation
    4. Impact on borrowers (housing, personal, rural loans)
    5. Forward-looking implications
    
    Be specific, data-driven, and accessible.
    """
    
    print(" Generating AI analysis...\n")
    
    try:
        response = client.predict(
            endpoint=LLM_MODEL,
            inputs={"messages": [
                {"role": "system", "content": "You are an expert RBI monetary policy analyst."},
                {"role": "user", "content": analysis_prompt}
            ]}
        )
        
        analysis = response["choices"][0]["message"]["content"]
        print(analysis)
        print("\n" + "=" * 80)
        
        return analysis
        
    except Exception as e:
        print(f"Analysis failed: {str(e)}")
        return None


# Run analysis
analyze_repo_trends_with_widgets()

# COMMAND ----------

# cell 9: Rural Safety Meter Function

def get_rural_safety_meter(monthly_income, current_emi):
    """
    Calculates a visual safety score based on RBI Gold Table data.
    Designed for rural users to understand loan affordability.
    """
    import json
    
    # 1. Fetch the absolute latest repo rate from your Gold Table
    try:
        latest_row = spark.table("rbi_gold_repo_rates") \
            .orderBy(col("policy_date").desc()) \
            .limit(1) \
            .collect()[0]
        
        current_repo = float(latest_row['repo_rate'])
    except Exception as e:
        # Fallback if table is empty or not found
        current_repo = 6.50 
    
    # 2. Safety Logic (Using Python math to avoid Spark Column errors)
    # Debt-to-Income (DTI) is the biggest factor for rural stability
    dti_ratio = float(current_emi) / float(monthly_income)
    
    # We calculate stress: 
    # High DTI (>40%) and high Repo rates decrease the safety score
    repo_stress = (current_repo / 10.0) 
    
    # Formula: Start at 100, subtract points for high debt and high interest rates
    raw_score = 100 - (dti_ratio * 160) - (repo_stress * 15)
    
    # Ensure score stays between 0 and 100
    # Note: We use __builtins__.round to ensure we don't trigger the Spark version
    safety_score = max(0, min(100, raw_score))
    final_score = __builtins__.round(safety_score, 1)
    
    # 3. Define Status and Rural-Friendly Multi-lingual Labels
    if final_score >= 70:
        state = "SAFE"
        label_en = "Safe to borrow / Low Risk"
        label_hi = "ऋण लेना सुरक्षित है / कम जोखिम"
    elif final_score >= 40:
        state = "CAUTION"
        label_en = "Borrow with care / Moderate Risk"
        label_hi = "सावधानी से ऋण लें / मध्यम जोखिम"
    else:
        state = "DANGER"
        label_en = "High Risk / Avoid new debt"
        label_hi = "अधिक जोखिम / नए ऋण से बचें"
    
    # 4. Construct JSON for Front-End integration
    result = {
        "safety_score": final_score,
        "current_repo_rate": f"{current_repo}%",
        "status": state,
        "display_text": {
            "en": label_en,
            "hi": label_hi
        },
        "recommendation": "Calculated based on current RBI guidelines."
    }
    
    return json.dumps(result, indent=2, ensure_ascii=False)

# --- TEST THE FUNCTION ---
# Example: A rural user earning ₹20,000 with an EMI of ₹6,000
print("Sample Output for Web Front-End:")
print(get_rural_safety_meter(monthly_income=20000, current_emi=6000))