import { Router, type IRouter } from "express";
import { db, policiesTable } from "@workspace/db";
import { sql, count } from "drizzle-orm";
import {
  GetDashboardSummaryResponse,
  GetPoliciesByCategoryResponse,
  GetPoliciesTimelineResponse,
  GetSectorImpactResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const allPolicies = await db.select().from(policiesTable).orderBy(policiesTable.date);

  const now = new Date();
  const thisMonth = allPolicies.filter(p => {
    const d = new Date(p.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const categories = new Set(allPolicies.map(p => p.category));
  const groups = new Set(allPolicies.map(p => p.affectedGroup));

  const recentPolicies = [...allPolicies].reverse().slice(0, 5).map(p => ({
    ...p,
    circularNumber: p.circularNumber ?? undefined,
    impactLevel: p.impactLevel as "low" | "medium" | "high",
  }));

  res.json(GetDashboardSummaryResponse.parse({
    totalPolicies: allPolicies.length,
    thisMonthPolicies: thisMonth.length,
    categoriesCount: categories.size,
    affectedGroupsCount: groups.size,
    recentPolicies,
  }));
});

router.get("/dashboard/policies-by-category", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      category: policiesTable.category,
      count: count(),
    })
    .from(policiesTable)
    .groupBy(policiesTable.category);

  res.json(GetPoliciesByCategoryResponse.parse(rows.map(r => ({
    category: r.category,
    count: Number(r.count),
  }))));
});

router.get("/dashboard/policies-timeline", async (_req, res): Promise<void> => {
  const policies = await db.select({ date: policiesTable.date }).from(policiesTable);

  const counts: Record<string, number> = {};
  for (const p of policies) {
    const d = new Date(p.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    counts[key] = (counts[key] || 0) + 1;
  }

  const timeline = Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, count]) => ({ period, count }));

  res.json(GetPoliciesTimelineResponse.parse(timeline));
});

router.get("/dashboard/sector-impact", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      sector: policiesTable.affectedGroup,
      count: count(),
    })
    .from(policiesTable)
    .groupBy(policiesTable.affectedGroup);

  const total = rows.reduce((sum, r) => sum + Number(r.count), 0);

  const result = rows.map(r => ({
    sector: r.sector,
    count: Number(r.count),
    percentage: total > 0 ? Math.round((Number(r.count) / total) * 100 * 10) / 10 : 0,
  }));

  res.json(GetSectorImpactResponse.parse(result));
});

export default router;
