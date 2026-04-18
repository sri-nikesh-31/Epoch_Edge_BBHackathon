import { Router, type IRouter } from "express";
import { db, chatMessagesTable, policiesTable, conversations } from "@workspace/db";
import { eq, desc, ilike, or } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  SendChatMessageBody,
  SendChatMessageResponse,
  GetChatHistoryQueryParams,
  GetChatHistoryResponse,
} from "@workspace/api-zod";
import { translateToEnglish, translateFromEnglish } from "../translate";

const router: IRouter = Router();

const USER_TYPE_CONTEXT: Record<string, string> = {
  farmer: "The user is a farmer. Explain how policies affect agricultural loans, Kisan Credit Card, crop insurance, and rural banking.",
  student: "The user is a student. Explain how policies affect education loans, student banking, and financial literacy.",
  msme: "The user is an MSME (Micro, Small, Medium Enterprise) owner. Focus on business loans, MUDRA scheme, MSME credit policies.",
  salaried: "The user is a salaried employee. Explain impact on home loans, personal loans, savings rates, and banking services.",
  general: "The user is a general member of the public. Provide a comprehensive, easy-to-understand explanation.",
};

function firstWords(text: string, n = 5): string {
  return text.split(/\s+/).slice(0, n).join(" ");
}

/* ── POST /chat/message ── */
router.post("/chat/message", async (req, res): Promise<void> => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { message, language = "english", userType = "general", sessionId } = parsed.data;
  const sid = sessionId || `session-${Date.now()}`;

  /* Auto-create a session record if it doesn't exist */
  const existingSession = await db.select().from(conversations).where(eq(conversations.sessionId, sid)).limit(1);
  if (existingSession.length === 0) {
    const autoTitle = `Chat — ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}`;
    await db.insert(conversations).values({ sessionId: sid, title: autoTitle });
  }

  /* Save user message */
  await db.insert(chatMessagesTable).values({ sessionId: sid, role: "user", content: message, language });

  /* Translate user message to English for GPT (if not already English) */
  const englishMessage = await translateToEnglish(message, language);

  /* Fetch policies for context */
  const allPolicies = await db.select({ id: policiesTable.id, title: policiesTable.title, summary: policiesTable.summary, category: policiesTable.category })
    .from(policiesTable).limit(20);
  const policyContext = allPolicies.map(p => `[Policy ID: ${p.id}] ${p.title}: ${p.summary}`).join("\n");
  const userTypeContext = USER_TYPE_CONTEXT[userType] || USER_TYPE_CONTEXT.general;

  const systemPrompt = `You are JanMitra, an AI assistant that helps Indian citizens understand Reserve Bank of India (RBI) policies in simple language.

${userTypeContext}

Always respond in clear, simple English. Your response will be automatically translated to the user's preferred language.

When answering, format your response:
1. A simple explanation (2-3 sentences)
2. Key bullet points
3. What this means for the user personally

Available RBI policies:
${policyContext}

Keep responses helpful and concise. Avoid jargon. For fraud questions, provide safety tips.`;

  /* Build chat history */
  const chatHistory = await db.select().from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, sid))
    .orderBy(chatMessagesTable.timestamp).limit(10);

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
    ...chatHistory.slice(0, -1).map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: englishMessage },
  ];

  /* Call GPT — always returns English */
  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8192,
    messages,
  });
  const englishResponse = completion.choices[0]?.message?.content || "I could not process your request. Please try again.";

  /* Translate response back to user's language using NLLB-200 */
  const finalResponse = await translateFromEnglish(englishResponse, language);

  /* Update session title from first message if it's a new session */
  if (existingSession.length === 0 && englishMessage.trim()) {
    const autoTitle = firstWords(message, 6);
    await db.update(conversations).set({ title: autoTitle }).where(eq(conversations.sessionId, sid));
  }

  /* Save assistant message */
  const [savedMsg] = await db.insert(chatMessagesTable).values({
    sessionId: sid, role: "assistant", content: finalResponse, language,
  }).returning();

  /* Related policies */
  const msgLower = englishMessage.toLowerCase();
  const relatedPolicies = await db.select().from(policiesTable).where(
    or(
      ilike(policiesTable.title, `%${msgLower.split(" ").slice(0, 3).join("%")}%`),
      ilike(policiesTable.summary, `%${msgLower.split(" ").slice(0, 3).join("%")}%`)
    )
  ).limit(3);

  res.json(SendChatMessageResponse.parse({
    id: savedMsg.id,
    sessionId: sid,
    response: finalResponse,
    language,
    relatedPolicies: relatedPolicies.map(p => ({
      ...p,
      circularNumber: p.circularNumber ?? undefined,
      impactLevel: p.impactLevel as "low" | "medium" | "high",
    })),
    timestamp: savedMsg.timestamp.toISOString(),
  }));
});

/* ── GET /chat/history ── */
router.get("/chat/history", async (req, res): Promise<void> => {
  const params = GetChatHistoryQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  let query = db.select().from(chatMessagesTable).$dynamic();
  if (params.data.sessionId) {
    query = query.where(eq(chatMessagesTable.sessionId, params.data.sessionId));
  }

  const msgs = await query.orderBy(desc(chatMessagesTable.timestamp)).limit(50);
  res.json(GetChatHistoryResponse.parse(msgs.reverse().map(m => ({ ...m, timestamp: m.timestamp.toISOString() }))));
});

/* ── GET /chat/sessions ── */
router.get("/chat/sessions", async (_req, res): Promise<void> => {
  const sessions = await db.select().from(conversations).orderBy(desc(conversations.createdAt)).limit(50);
  res.json(sessions.map(s => ({ ...s, createdAt: s.createdAt.toISOString() })));
});

/* ── POST /chat/sessions ── */
router.post("/chat/sessions", async (req, res): Promise<void> => {
  const title = req.body?.title || `New Chat — ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const [created] = await db.insert(conversations).values({ sessionId, title }).returning();
  res.status(201).json({ ...created, createdAt: created.createdAt.toISOString() });
});

/* ── DELETE /chat/sessions/:sessionId ── */
router.delete("/chat/sessions/:sessionId", async (req, res): Promise<void> => {
  const { sessionId } = req.params;
  await db.delete(chatMessagesTable).where(eq(chatMessagesTable.sessionId, sessionId));
  await db.delete(conversations).where(eq(conversations.sessionId, sessionId));
  res.json({ ok: true });
});

/* ── PATCH /chat/sessions/:sessionId ── */
router.patch("/chat/sessions/:sessionId", async (req, res): Promise<void> => {
  const { sessionId } = req.params;
  const { title } = req.body;
  if (!title) { res.status(400).json({ error: "title required" }); return; }
  const [updated] = await db.update(conversations).set({ title }).where(eq(conversations.sessionId, sessionId)).returning();
  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

export default router;
