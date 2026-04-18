import { Router, type IRouter } from "express";
import { eq, ilike, or } from "drizzle-orm";
import { db, policiesTable } from "@workspace/db";
import {
  ListPoliciesQueryParams,
  ListPoliciesResponse,
  GetPolicyParams,
  GetPolicyResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/policies", async (req, res): Promise<void> => {
  const params = ListPoliciesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let query = db.select().from(policiesTable).$dynamic();

  if (params.data.category) {
    query = query.where(eq(policiesTable.category, params.data.category));
  } else if (params.data.affectedGroup) {
    query = query.where(eq(policiesTable.affectedGroup, params.data.affectedGroup));
  } else if (params.data.search) {
    query = query.where(
      or(
        ilike(policiesTable.title, `%${params.data.search}%`),
        ilike(policiesTable.summary, `%${params.data.search}%`)
      )
    );
  }

  const policies = await query.orderBy(policiesTable.date);
  res.json(ListPoliciesResponse.parse(policies.map(p => ({
    ...p,
    circularNumber: p.circularNumber ?? undefined,
    impactLevel: p.impactLevel as "low" | "medium" | "high",
  }))));
});

router.get("/policies/:id", async (req, res): Promise<void> => {
  const params = GetPolicyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [policy] = await db
    .select()
    .from(policiesTable)
    .where(eq(policiesTable.id, params.data.id));

  if (!policy) {
    res.status(404).json({ error: "Policy not found" });
    return;
  }

  res.json(GetPolicyResponse.parse({
    ...policy,
    circularNumber: policy.circularNumber ?? undefined,
    impactLevel: policy.impactLevel as "low" | "medium" | "high",
  }));
});

export default router;
