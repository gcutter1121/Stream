import { Router } from "express";
import { db, hustlesTable, entriesTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import { startOfWeek, endOfWeek, subWeeks, format } from "date-fns";

const router = Router();

router.get("/summary", async (req, res) => {
  try {
    const now = new Date();
    const thisWeekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const thisWeekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const lastWeekStart = format(startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const lastWeekEnd = format(endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }), "yyyy-MM-dd");

    // Total earned across all hustles
    const [totals] = await db
      .select({
        totalEarned: sql<number>`coalesce(sum(${entriesTable.amount}), 0)`.mapWith(Number),
        entryCount: sql<number>`count(${entriesTable.id})`.mapWith(Number),
      })
      .from(entriesTable);

    // This week and last week
    const [thisWeekRow] = await db
      .select({ earned: sql<number>`coalesce(sum(${entriesTable.amount}), 0)`.mapWith(Number) })
      .from(entriesTable)
      .where(sql`${entriesTable.date} >= ${thisWeekStart} AND ${entriesTable.date} <= ${thisWeekEnd}`);

    const [lastWeekRow] = await db
      .select({ earned: sql<number>`coalesce(sum(${entriesTable.amount}), 0)`.mapWith(Number) })
      .from(entriesTable)
      .where(sql`${entriesTable.date} >= ${lastWeekStart} AND ${entriesTable.date} <= ${lastWeekEnd}`);

    // Per-hustle breakdown
    const hustleRows = await db
      .select({
        hustleId: hustlesTable.id,
        hustleName: hustlesTable.name,
        totalEarned: sql<number>`coalesce(sum(${entriesTable.amount}), 0)`.mapWith(Number),
        entryCount: sql<number>`count(${entriesTable.id})`.mapWith(Number),
      })
      .from(hustlesTable)
      .leftJoin(entriesTable, eq(hustlesTable.id, entriesTable.hustleId))
      .groupBy(hustlesTable.id, hustlesTable.name)
      .orderBy(sql`coalesce(sum(${entriesTable.amount}), 0) desc`);

    const hustleCount = hustleRows.length;
    const total = totals?.totalEarned ?? 0;

    const hustleBreakdown = hustleRows.map((h) => ({
      hustleId: h.hustleId,
      hustleName: h.hustleName,
      totalEarned: h.totalEarned,
      entryCount: h.entryCount,
      percentage: total > 0 ? Math.round((h.totalEarned / total) * 100) : 0,
    }));

    // Recent 10 entries
    const recentEntries = await db
      .select({
        id: entriesTable.id,
        hustleId: entriesTable.hustleId,
        hustleName: hustlesTable.name,
        amount: sql<number>`${entriesTable.amount}`.mapWith(Number),
        date: entriesTable.date,
        note: entriesTable.note,
        createdAt: entriesTable.createdAt,
      })
      .from(entriesTable)
      .innerJoin(hustlesTable, eq(entriesTable.hustleId, hustlesTable.id))
      .orderBy(desc(entriesTable.date), desc(entriesTable.createdAt))
      .limit(10);

    res.json({
      totalEarned: total,
      hustleCount,
      entryCount: totals?.entryCount ?? 0,
      hustleBreakdown,
      recentEntries,
      thisWeekEarned: thisWeekRow?.earned ?? 0,
      lastWeekEarned: lastWeekRow?.earned ?? 0,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get summary");
    res.status(500).json({ error: "Failed to get summary" });
  }
});

export default router;
