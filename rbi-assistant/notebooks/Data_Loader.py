# Databricks notebook source
# import requests
# from bs4 import BeautifulSoup
# from urllib.parse import urljoin
# import os
# import time

# BASE_URL = "https://rbi.org.in"
# TARGET_PAGES = [
#     "https://rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx",
#     "https://rbi.org.in/Scripts/BS_ViewMasterDirections.aspx",
#     "https://rbi.org.in/Scripts/BS_ViewMasterCirculardetails.aspx"
# ]

# SAVE_DIR = "/Volumes/bharatbricks_hackathon/default/bbhackathon/data/"
# os.makedirs(SAVE_DIR, exist_ok=True)

# HEADERS = {
#     "User-Agent": "Mozilla/5.0"
# }

# def get_pdf_links(page_url):
#     resp = requests.get(page_url, headers=HEADERS, timeout=20)
#     soup = BeautifulSoup(resp.text, "html.parser")

#     pdf_links = set()

#     for a in soup.find_all("a", href=True):
#         href = a["href"]
#         if ".pdf" in href.lower():
#             full_url = urljoin(BASE_URL, href)
#             pdf_links.add(full_url)

#     return list(pdf_links)


# def download_pdf(url):
#     try:
#         filename = url.split("/")[-1].split("?")[0]
#         filepath = os.path.join(SAVE_DIR, filename)

#         if os.path.exists(filepath):
#             print(f"Already exists: {filename}")
#             return

#         resp = requests.get(url, headers=HEADERS, timeout=30)
#         resp.raise_for_status()

#         with open(filepath, "wb") as f:
#             f.write(resp.content)

#         print(f"Downloaded: {filename}")

#     except Exception as e:
#         print(f"Failed: {url} | {e}")


# def main():
#     all_links = set()

#     print("🔍 Collecting PDF links...")
#     for page in TARGET_PAGES:
#         links = get_pdf_links(page)
#         print(f"{page} → {len(links)} PDFs")
#         all_links.update(links)

#     print(f"\n📊 Total PDFs found: {len(all_links)}")

#     print("\n⬇️ Downloading PDFs...")
#     for link in all_links:
#         download_pdf(link)
#         time.sleep(1)  # polite delay

#     print("\n✅ All PDFs saved to Volume!")


# if __name__ == "__main__":
#     main()

# COMMAND ----------

# MAGIC %pip install lxml

# COMMAND ----------

# MAGIC %restart_python

# COMMAND ----------

# MAGIC %md
# MAGIC ##Final (for minutes etc..)

# COMMAND ----------

# import os
# import re
# import time
# import random
# import requests
# from datetime import date
# from bs4 import BeautifulSoup
# from urllib.parse import urljoin

# # ─── CONFIG ─────────────────────────────────────────
# BASE_URL  = "https://www.rbi.org.in"
# PRESS_URL = "https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx"
# SAVE_BASE = "/Volumes/bharatbricks_hackathon/default/bbhackathon/data/statements/"

# HEADERS = {
#     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
#                   "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
# }

# # MPC started October 2016 — no point going earlier
# START_YEAR  = 2016
# START_MONTH = 10


# # ─── SETUP ──────────────────────────────────────────
# def setup():
#     minutes_dir    = os.path.join(SAVE_BASE, "minutes")
#     statements_dir = os.path.join(SAVE_BASE, "governor_statements")
#     os.makedirs(minutes_dir, exist_ok=True)
#     os.makedirs(statements_dir, exist_ok=True)
#     return minutes_dir, statements_dir


# # ─── FETCH ──────────────────────────────────────────
# def fetch(url, post_data=None):
#     try:
#         if post_data:
#             resp = requests.post(url, data=post_data, headers=HEADERS, timeout=30)
#         else:
#             resp = requests.get(url, headers=HEADERS, timeout=30)
#         resp.raise_for_status()
#         return BeautifulSoup(resp.content, "lxml")
#     except Exception as e:
#         print(f"  ❌ {e}")
#         return None


# def get_form_fields(soup):
#     return {
#         tag["name"]: tag.get("value", "")
#         for tag in soup.find_all("input", type="hidden")
#         if tag.get("name")
#     }


# # ─── CLASSIFY LINK ──────────────────────────────────
# def classify_link(text):
#     lower = text.lower()
#     if "minutes of the monetary policy committee" in lower:
#         return "minutes"
#     if ("governor" in lower and "statement" in lower) \
#             or "resolution of the monetary policy committee" in lower:
#         return "statement"
#     return None


# # ─── EXTRACT MPC LINKS FROM PAGE ────────────────────
# def extract_mpc_links(soup):
#     minutes, statements = [], []
#     for a in soup.find_all("a", class_="link2"):
#         text = a.get_text(strip=True)
#         href = a.get("href", "").strip()
#         if not text or not href or href == "#":
#             continue
#         kind = classify_link(text)
#         if not kind:
#             continue
#         full_url = urljoin(BASE_URL, href)
#         entry = {"title": text, "url": full_url}
#         if kind == "minutes":
#             minutes.append(entry)
#         else:
#             statements.append(entry)
#     return minutes, statements


# # ─── GENERATE ALL YEAR/MONTH COMBOS ─────────────────
# def all_year_months():
#     """Yield (year, month) tuples from START to today, newest first."""
#     today = date.today()
#     pairs = []
#     for year in range(START_YEAR, today.year + 1):
#         for month in range(1, 13):
#             if year == START_YEAR and month < START_MONTH:
#                 continue
#             if year == today.year and month > today.month:
#                 break
#             pairs.append((year, month))
#     return list(reversed(pairs))  # newest first


# # ─── COLLECT ALL MPC LINKS ──────────────────────────
# def collect_all_mpc_links():
#     all_minutes, all_statements = [], []
#     seen = set()

#     # Get base page once to capture fresh VIEWSTATE/EVENTVALIDATION
#     print("🌐 Loading base page for form fields...")
#     base_soup = fetch(PRESS_URL)
#     if not base_soup:
#         return {"minutes": [], "statements": []}
#     base_fields = get_form_fields(base_soup)

#     months = all_year_months()
#     print(f"📅 Scraping {len(months)} months ({months[-1][0]}/{months[-1][1]:02d} → {months[0][0]}/{months[0][1]:02d})\n")

#     for year, month in months:
#         label = f"{year}-{month:02d}"
#         print(f"  {label}...", end=" ", flush=True)

#         fields = dict(base_fields)  # fresh copy each time
#         fields["__EVENTTARGET"]   = ""
#         fields["__EVENTARGUMENT"] = ""
#         fields["hdnYear"]         = str(year)
#         fields["hdnMonth"]        = str(month)

#         soup = fetch(PRESS_URL, post_data=fields)
#         if not soup:
#             print("❌ skipped")
#             continue

#         m, s = extract_mpc_links(soup)

#         new_m = [x for x in m if x["url"] not in seen]
#         new_s = [x for x in s if x["url"] not in seen]
#         for x in new_m + new_s:
#             seen.add(x["url"])
#         all_minutes.extend(new_m)
#         all_statements.extend(new_s)

#         if new_m or new_s:
#             print(f"✅ {len(new_m)} minutes, {len(new_s)} statements")
#         else:
#             print("—")

#         # Refresh VIEWSTATE every 10 requests to avoid stale tokens
#         if (months.index((year, month)) + 1) % 10 == 0:
#             base_soup = fetch(PRESS_URL)
#             if base_soup:
#                 base_fields = get_form_fields(base_soup)

#         time.sleep(random.uniform(0.5, 1.0))

#     return {
#         "minutes":    list({x["url"]: x for x in all_minutes}.values()),
#         "statements": list({x["url"]: x for x in all_statements}.values()),
#     }


# # ─── SAFE FILENAME ──────────────────────────────────
# def safe_name(text):
#     text = re.sub(r"[^\w\s-]", "", text)
#     text = re.sub(r"\s+", "_", text.strip())
#     return text[:100] or f"untitled_{int(time.time())}"


# # ─── EXTRACT HTML CONTENT ───────────────────────────
# def extract_clean_html(soup, title, source_url):
#     content = (
#         soup.find("td", {"class": "tableContent"})
#         or soup.find("td", {"class": "tablebodyfont"})
#         or soup.find("div", {"id": "sectionContent"})
#     )
#     if not content:
#         tds = soup.find_all("td")
#         if tds:
#             content = max(tds, key=lambda x: len(x.get_text()))
#     if content:
#         for tag in content(["script", "style", "noscript"]):
#             tag.decompose()
#         html_body = content.decode_contents()
#     else:
#         html_body = "<p>Content not found.</p>"
#     return f"""<!DOCTYPE html>
# <html>
# <head>
#   <meta charset="utf-8"><title>{title}</title>
#   <style>body{{font-family:Arial,sans-serif;line-height:1.6;padding:20px;max-width:900px}}</style>
# </head>
# <body>
#   <h2>{title}</h2>
#   <p><b>Source:</b> <a href="{source_url}">{source_url}</a></p>
#   <hr>{html_body}
# </body>
# </html>"""


# # ─── DOWNLOAD PDFs ──────────────────────────────────
# def download_pdfs(soup, folder):
#     for a in soup.find_all("a", href=True):
#         href = a["href"]
#         if ".pdf" not in href.lower():
#             continue
#         pdf_url  = urljoin(BASE_URL, href)
#         filename = pdf_url.split("/")[-1].split("?")[0]
#         if not filename.endswith(".pdf"):
#             filename += ".pdf"
#         path = os.path.join(folder, filename)
#         if os.path.exists(path):
#             continue
#         try:
#             r = requests.get(pdf_url, headers=HEADERS, stream=True, timeout=30)
#             r.raise_for_status()
#             with open(path, "wb") as f:
#                 for chunk in r.iter_content(8192):
#                     f.write(chunk)
#             print(f"    📄 {filename}")
#         except Exception as e:
#             print(f"    ❌ PDF failed: {e}")


# # ─── SCRAPE + SAVE ──────────────────────────────────
# def run_scrape(items, folder):
#     for i, item in enumerate(items, 1):
#         title, url = item["title"], item["url"]
#         print(f"  [{i}/{len(items)}] {title}")
#         soup = fetch(url)
#         if not soup:
#             continue
#         path = os.path.join(folder, safe_name(title) + ".html")
#         if not os.path.exists(path):
#             with open(path, "w", encoding="utf-8") as f:
#                 f.write(extract_clean_html(soup, title, url))
#             print("    ✅ saved")
#         else:
#             print("    ⏭️  exists")
#         download_pdfs(soup, folder)
#         time.sleep(random.uniform(1.0, 1.8))


# # ─── MAIN ───────────────────────────────────────────
# if __name__ == "__main__":
#     print("\n🚀 RBI MPC Scraper — Full Historical Run")
#     minutes_dir, statements_dir = setup()

#     collected = collect_all_mpc_links()

#     print(f"\n📊 Total:")
#     print(f"   Minutes:    {len(collected['minutes'])}")
#     print(f"   Statements: {len(collected['statements'])}")

#     if collected["minutes"]:
#         print("\n📥 Downloading MPC Minutes...")
#         run_scrape(collected["minutes"], minutes_dir)

#     if collected["statements"]:
#         print("\n📥 Downloading Governor Statements...")
#         run_scrape(collected["statements"], statements_dir)

#     print(f"\n🎉 Done → {SAVE_BASE}")

# COMMAND ----------

# MAGIC %pip install pdfplumber

# COMMAND ----------

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import os
import time
import pdfplumber
import io

BASE_URL = "https://rbi.org.in"
TARGET_PAGES = [
    "https://rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx",
    "https://rbi.org.in/Scripts/BS_ViewMasterDirections.aspx",
    "https://rbi.org.in/Scripts/BS_ViewMasterCirculardetails.aspx"
]

TEXT_OUTPUT_DIR = "/Volumes/bharatbricks_hackathon/default/bbhackathon/rbi_text"
os.makedirs(TEXT_OUTPUT_DIR, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
}


# ─── COLLECT PDF LINKS ───────────────────────────────────────────────────────
def get_pdf_links(page_url):
    try:
        resp = requests.get(page_url, headers=HEADERS, timeout=20)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        pdf_links = set()
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if ".pdf" in href.lower():
                pdf_links.add(urljoin(BASE_URL, href))
        return list(pdf_links)
    except Exception as e:
        print(f"  ❌ Failed to fetch page {page_url}: {e}")
        return []


# ─── EXTRACT TEXT FROM PDF BYTES (in-memory, no disk PDF) ────────────────────
def extract_text_from_bytes(pdf_bytes: bytes) -> str:
    all_text = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        total_pages = len(pdf.pages)
        for i, page in enumerate(pdf.pages, start=1):
            page_text = page.extract_text() or ""
            all_text.append(
                f"\n{'='*60}\n"
                f"  PAGE {i} / {total_pages}\n"
                f"{'='*60}\n"
                f"{page_text.strip()}\n"
            )
    return "\n".join(all_text)


# ─── DOWNLOAD PDF → EXTRACT → SAVE TXT ───────────────────────────────────────
def download_and_extract(url):
    filename = url.split("/")[-1].split("?")[0]
    if not filename.endswith(".pdf"):
        filename += ".pdf"

    stem     = filename.replace(".pdf", "")
    txt_path = os.path.join(TEXT_OUTPUT_DIR, f"{stem}.txt")

    # ✅ Skip if already extracted
    if os.path.exists(txt_path):
        print(f"  ⏭️  Skipping (already exists): {stem}.txt")
        return

    try:
        print(f"  ⏳ Downloading : {filename}")
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        pdf_bytes = resp.content

        print(f"  📄 Extracting  : {filename}")
        text = extract_text_from_bytes(pdf_bytes)

        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(f"SOURCE URL  : {url}\n")
            f.write(f"SOURCE FILE : {filename}\n")
            f.write(f"OUTPUT FILE : {stem}.txt\n")
            f.write("=" * 60 + "\n")
            f.write(text)

        size_kb = os.path.getsize(txt_path) / 1024
        print(f"  ✅ Saved       : {stem}.txt  ({size_kb:.1f} KB)\n")

    except Exception as e:
        print(f"  ❌ FAILED      : {filename} — {e}\n")


# ─── MAIN ────────────────────────────────────────────────────────────────────
def main():
    all_links = set()

    print("🔍 Collecting PDF links...\n")
    for page in TARGET_PAGES:
        links = get_pdf_links(page)
        print(f"  {page}\n  → {len(links)} PDF(s) found\n")
        all_links.update(links)

    print(f"📊 Total unique PDFs found : {len(all_links)}")
    print(f"📂 Text output directory   : {TEXT_OUTPUT_DIR}\n")
    print("=" * 60)

    success, failed = 0, 0
    for i, link in enumerate(sorted(all_links), 1):
        print(f"[{i}/{len(all_links)}]")
        try:
            download_and_extract(link)
            success += 1
        except Exception as e:
            print(f"  ❌ Unexpected error: {e}\n")
            failed += 1
        time.sleep(1)  # polite delay

    print("=" * 60)
    print(f"  ✅ Extracted successfully : {success} file(s)")
    print(f"  ❌ Failed                 : {failed} file(s)")
    print(f"\n🎉 Done → {TEXT_OUTPUT_DIR}")


if __name__ == "__main__":
    main()

# COMMAND ----------

import os
import re
import time
import random
import requests
from datetime import date
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# ─── CONFIG ─────────────────────────────────────────
BASE_URL  = "https://www.rbi.org.in"
PRESS_URL = "https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx"
SAVE_BASE = "/Volumes/bharatbricks_hackathon/default/bbhackathon/data/statements/"

TEXT_OUTPUT_DIR = "/Volumes/bharatbricks_hackathon/default/bbhackathon/rbi_text"
os.makedirs(TEXT_OUTPUT_DIR, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
}

START_YEAR  = 2016
START_MONTH = 10


# ─── SETUP ──────────────────────────────────────────
def setup():
    minutes_dir    = os.path.join(SAVE_BASE, "minutes")
    statements_dir = os.path.join(SAVE_BASE, "governor_statements")
    os.makedirs(minutes_dir, exist_ok=True)
    os.makedirs(statements_dir, exist_ok=True)
    return minutes_dir, statements_dir


# ─── FETCH ──────────────────────────────────────────
def fetch(url, post_data=None):
    try:
        if post_data:
            resp = requests.post(url, data=post_data, headers=HEADERS, timeout=30)
        else:
            resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        return BeautifulSoup(resp.content, "html.parser")
    except Exception as e:
        print(f"  ❌ {e}")
        return None


def get_form_fields(soup):
    return {
        tag["name"]: tag.get("value", "")
        for tag in soup.find_all("input", type="hidden")
        if tag.get("name")
    }


# ─── CLASSIFY LINK ──────────────────────────────────
def classify_link(text):
    lower = text.lower()
    if "minutes of the monetary policy committee" in lower:
        return "minutes"
    if ("governor" in lower and "statement" in lower) \
            or "resolution of the monetary policy committee" in lower:
        return "statement"
    return None


# ─── EXTRACT MPC LINKS FROM PAGE ────────────────────
def extract_mpc_links(soup):
    minutes, statements = [], []
    for a in soup.find_all("a", class_="link2"):
        text = a.get_text(strip=True)
        href = a.get("href", "").strip()
        if not text or not href or href == "#":
            continue
        kind = classify_link(text)
        if not kind:
            continue
        full_url = urljoin(BASE_URL, href)
        entry = {"title": text, "url": full_url}
        if kind == "minutes":
            minutes.append(entry)
        else:
            statements.append(entry)
    return minutes, statements


# ─── GENERATE ALL YEAR/MONTH COMBOS ─────────────────
def all_year_months():
    today = date.today()
    pairs = []
    for year in range(START_YEAR, today.year + 1):
        for month in range(1, 13):
            if year == START_YEAR and month < START_MONTH:
                continue
            if year == today.year and month > today.month:
                break
            pairs.append((year, month))
    return list(reversed(pairs))


# ─── COLLECT ALL MPC LINKS ──────────────────────────
def collect_all_mpc_links():
    all_minutes, all_statements = [], []
    seen = set()

    print("🌐 Loading base page for form fields...")
    base_soup = fetch(PRESS_URL)
    if not base_soup:
        return {"minutes": [], "statements": []}
    base_fields = get_form_fields(base_soup)

    months = all_year_months()
    print(f"📅 Scraping {len(months)} months ({months[-1][0]}/{months[-1][1]:02d} → {months[0][0]}/{months[0][1]:02d})\n")

    for year, month in months:
        label = f"{year}-{month:02d}"
        print(f"  {label}...", end=" ", flush=True)

        fields = dict(base_fields)
        fields["__EVENTTARGET"]   = ""
        fields["__EVENTARGUMENT"] = ""
        fields["hdnYear"]         = str(year)
        fields["hdnMonth"]        = str(month)

        soup = fetch(PRESS_URL, post_data=fields)
        if not soup:
            print("❌ skipped")
            continue

        m, s = extract_mpc_links(soup)
        new_m = [x for x in m if x["url"] not in seen]
        new_s = [x for x in s if x["url"] not in seen]
        for x in new_m + new_s:
            seen.add(x["url"])
        all_minutes.extend(new_m)
        all_statements.extend(new_s)

        if new_m or new_s:
            print(f"✅ {len(new_m)} minutes, {len(new_s)} statements")
        else:
            print("—")

        if (months.index((year, month)) + 1) % 10 == 0:
            base_soup = fetch(PRESS_URL)
            if base_soup:
                base_fields = get_form_fields(base_soup)

        time.sleep(random.uniform(0.5, 1.0))

    return {
        "minutes":    list({x["url"]: x for x in all_minutes}.values()),
        "statements": list({x["url"]: x for x in all_statements}.values()),
    }


# ─── SAFE FILENAME ──────────────────────────────────
def safe_name(text):
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"\s+", "_", text.strip())
    return text[:100] or f"untitled_{int(time.time())}"


# ─── EXTRACT TEXT FROM HTML PAGE ────────────────────
def extract_text_from_html(soup, title, source_url):
    content = (
        soup.find("td", {"class": "tableContent"})
        or soup.find("td", {"class": "tablebodyfont"})
        or soup.find("div", {"id": "sectionContent"})
    )
    if not content:
        tds = soup.find_all("td")
        if tds:
            content = max(tds, key=lambda x: len(x.get_text()))

    if content:
        for tag in content(["script", "style", "noscript"]):
            tag.decompose()
        text = content.get_text(separator="\n").strip()
    else:
        text = "[Content not found]"

    return (
        f"SOURCE URL  : {source_url}\n"
        f"TITLE       : {title}\n"
        f"{'='*60}\n"
        f"{text}\n"
    )


# ─── SCRAPE + SAVE AS TXT ───────────────────────────
def run_scrape(items, label):
    for i, item in enumerate(items, 1):
        title, url = item["title"], item["url"]
        print(f"  [{i}/{len(items)}] {title}")

        stem     = safe_name(title)
        txt_path = os.path.join(TEXT_OUTPUT_DIR, f"{stem}.txt")

        if os.path.exists(txt_path):
            print(f"    ⏭️  exists")
            continue

        soup = fetch(url)
        if not soup:
            continue

        try:
            text = extract_text_from_html(soup, title, url)
            with open(txt_path, "w", encoding="utf-8") as f:
                f.write(text)
            size_kb = os.path.getsize(txt_path) / 1024
            print(f"    ✅ Saved: {stem}.txt  ({size_kb:.1f} KB)")
        except Exception as e:
            print(f"    ❌ Failed: {e}")

        time.sleep(random.uniform(1.0, 1.8))


# ─── MAIN ───────────────────────────────────────────
if __name__ == "__main__":
    print("\n🚀 RBI MPC Scraper — Full Historical Run")
    setup()

    collected = collect_all_mpc_links()

    print(f"\n📊 Total:")
    print(f"   Minutes:    {len(collected['minutes'])}")
    print(f"   Statements: {len(collected['statements'])}")

    if collected["minutes"]:
        print("\n📥 Saving MPC Minutes...")
        run_scrape(collected["minutes"], "minutes")

    if collected["statements"]:
        print("\n📥 Saving Governor Statements...")
        run_scrape(collected["statements"], "statements")

    print(f"\n🎉 Done → {TEXT_OUTPUT_DIR}")