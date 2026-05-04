import { Router } from "express";
import { db, goalsTable, entriesTable } from "@workspace/db";
import { sql, desc } from "drizzle-orm";
import { SetGoalBody } from "@workspace/api-zod";
import { startOfWeek, startOfMonth, format } from "date-fns";

const router = Router();

function getMotivationMessage(percent: number, remaining: number, type: string): string {
  const period = type === "weekly" ? "week" : "month";
  if (percent >= 100) return `Goal crushed! You hit your ${period}ly target.`;
  if (percent >= 90) return `Almost there — just $${remaining.toFixed(0)} to go!`;
  if (percent >= 75) return `On fire! You're 75%+ toward your goal.`;
  if (percent >= 50) return `Past the halfway mark. Keep it up!`;
  if (percent >= 25) return `Good progress — stay consistent and you'll get there.`;
  return `Every dollar counts. Log your first income to get started!`;
}

router.get("/goals", async (req, res) => {
  try {
    const goals = await db.select().from(goalsTable).orderBy(desc(goalsTable.updatedAt)).limit(1);
    const goal = goals[0] ?? null;

    if (!goal) {
      res.json({ currentProgress: 0, percentComplete: 0, remaining: 0 });
      return;
    }

    const now = new Date();
    let periodStart: Date;
    if (goal.type === "weekly") {
      periodStart = startOfWeek(now, { weekStartsOn: 1 });
    } else {
      periodStart = startOfMonth(now);
    }

    const [progress] = await db
      .select({
        total: sql<number>`coalesce(sum(${entriesTable.amount}), 0)`.mapWith(Number),
      })
      .from(entriesTable)
      .where(sql`${entriesTable.date} >= ${format(periodStart, "yyyy-MM-dd")}`);

    const currentProgress = progress?.total ?? 0;
    const goalAmount = Number(goal.amount);
    const percentComplete = Math.min(100, Math.round((currentProgress / goalAmount) * 100));
    const remaining = Math.max(0, goalAmount - currentProgress);

    res.json({
      goal: {
        ...goal,
        amount: Number(goal.amount),
      },
      currentProgress,
      percentComplete,
      remaining,
      motivationMessage: getMotivationMessage(percentComplete, remaining, goal.type),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get goal");
    res.status(500).json({ error: "Failed to get goal" });
  }
});

router.put("/goals", async (req, res) => {
  try {
    const parsed = SetGoalBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const existing = await db.select().from(goalsTable).limit(1);

    let goal;
    if (existing.length > 0) {
      const [updated] = await db
        .update(goalsTable)
        .set({
          type: parsed.data.type,
          amount: String(parsed.data.amount),
          updatedAt: new Date(),
        })
        .returning();
      goal = updated;
    } else {
      const [created] = await db
        .insert(goalsTable)
        .values({
          type: parsed.data.type,
          amount: String(parsed.data.amount),
        })
        .returning();
      goal = created;
    }

    res.json({ ...goal, amount: Number(goal.amount) });
  } catch (err) {
    req.log.error({ err }, "Failed to set goal");
    res.status(500).json({ error: "Failed to set goal" });
  }
});

export default router;
