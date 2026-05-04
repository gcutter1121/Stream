import { Router } from "express";
import { db, entriesTable, hustlesTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import {
  format,
  startOfWeek,
  subWeeks,
  differenceInCalendarDays,
  parseISO,
} from "date-fns";

const router = Router();

router.get("/stats", async (req, res) => {
  try {
    // All entries sorted by date desc
    const allEntries = await db
      .select({
        id: entriesTable.id,
        hustleId: entriesTable.hustleId,
        hustleName: hustlesTable.name,
        amount: sql<number>`${entriesTable.amount}`.mapWith(Number),
        date: entriesTable.date,
        createdAt: entriesTable.createdAt,
      })
      .from(entriesTable)
      .innerJoin(hustlesTable, eq(entriesTable.hustleId, hustlesTable.id))
      .orderBy(desc(entriesTable.date));

    if (allEntries.length === 0) {
      res.json({
        streak: 0,
        longestStreak: 0,
        bestDay: 0,
        bestDayDate: null,
        bestWeek: 0,
        milestones: buildMilestones(0),
        insights: [],
        weeklyEarnings: [],
        avgPerEntry: 0,
        avgPerDay: 0,
        topHustle: null,
      });
      return;
    }

    // Group by date
    const byDate: Record<string, number> = {};
    for (const e of allEntries) {
      byDate[e.date] = (byDate[e.date] ?? 0) + e.amount;
    }

    const sortedDates = Object.keys(byDate).sort().reverse();

    // Streak calculation
    let streak = 0;
    let longestStreak = 0;
    let currentStreak = 0;
    const today = format(new Date(), "yyyy-MM-dd");

    const allSortedDates = Object.keys(byDate).sort().reverse();
    let prevDate: string | null = null;

    // Build streak from most recent date backwards
    for (let i = 0; i < allSortedDates.length; i++) {
      const d = allSortedDates[i];
      if (i === 0) {
        const diff = differenceInCalendarDays(parseISO(today), parseISO(d));
        if (diff > 1) {
          currentStreak = 0;
        } else {
          currentStreak = 1;
        }
      } else {
        const diff = differenceInCalendarDays(parseISO(prevDate!), parseISO(d));
        if (diff === 1) {
          currentStreak++;
        } else {
          if (currentStreak > longestStreak) longestStreak = currentStreak;
          currentStreak = 1;
        }
      }
      prevDate = d;
      if (currentStreak > longestStreak) longestStreak = currentStreak;
    }
    streak = currentStreak;

    // Best day
    let bestDay = 0;
    let bestDayDate: string | null = null;
    for (const [date, amount] of Object.entries(byDate)) {
      if (amount > bestDay) {
        bestDay = amount;
        bestDayDate = date;
      }
    }

    // Weekly earnings (last 8 weeks)
    const weeklyEarnings: { week: string; earned: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
      const weekKey = format(weekStart, "MMM d");
      const weekStartStr = format(weekStart, "yyyy-MM-dd");
      const weekEndStr = format(
        new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
        "yyyy-MM-dd"
      );
      const earned = allEntries
        .filter((e) => e.date >= weekStartStr && e.date <= weekEndStr)
        .reduce((sum, e) => sum + e.amount, 0);
      weeklyEarnings.push({ week: weekKey, earned });
    }

    // Best week
    const bestWeek = weeklyEarnings.reduce((max, w) => Math.max(max, w.earned), 0);

    // Per-hustle totals for insights
    const byHustle: Record<string, { name: string; total: number; count: number }> = {};
    for (const e of allEntries) {
      if (!byHustle[e.hustleId]) {
        byHustle[e.hustleId] = { name: e.hustleName, total: 0, count: 0 };
      }
      byHustle[e.hustleId].total += e.amount;
      byHustle[e.hustleId].count++;
    }

    const hustleList = Object.values(byHustle).sort((a, b) => b.total - a.total);
    const topHustle = hustleList[0]?.name ?? null;

    // Avg per entry and per day
    const totalEarned = allEntries.reduce((s, e) => s + e.amount, 0);
    const avgPerEntry = allEntries.length > 0 ? totalEarned / allEntries.length : 0;
    const uniqueDays = Object.keys(byDate).length;
    const avgPerDay = uniqueDays > 0 ? totalEarned / uniqueDays : 0;

    // Weekend vs weekday analysis
    const weekendEarned = allEntries
      .filter((e) => {
        const d = parseISO(e.date).getDay();
        return d === 0 || d === 6;
      })
      .reduce((s, e) => s + e.amount, 0);
    const weekdayEarned = totalEarned - weekendEarned;
    const weekendDays = allEntries.filter((e) => {
      const d = parseISO(e.date).getDay();
      return d === 0 || d === 6;
    }).length;
    const weekdayDays = allEntries.length - weekendDays;
    const avgWeekend = weekendDays > 0 ? weekendEarned / weekendDays : 0;
    const avgWeekday = weekdayDays > 0 ? weekdayEarned / weekdayDays : 0;

    // Build insights
    const insights: { text: string; type: "positive" | "neutral" | "tip" }[] = [];

    if (topHustle) {
      insights.push({
        text: `${topHustle} is your highest earning hustle.`,
        type: "positive",
      });
    }

    if (weekendDays >= 2 && weekdayDays >= 2) {
      if (avgWeekend > avgWeekday * 1.2) {
        insights.push({
          text: `You earn ${Math.round(((avgWeekend - avgWeekday) / avgWeekday) * 100)}% more per entry on weekends.`,
          type: "positive",
        });
      } else if (avgWeekday > avgWeekend * 1.2) {
        insights.push({
          text: `Weekdays are your most productive days — keep that up.`,
          type: "neutral",
        });
      }
    }

    if (avgPerEntry > 0) {
      insights.push({
        text: `Your average income per entry is $${avgPerEntry.toFixed(2)}.`,
        type: "neutral",
      });
    }

    if (streak >= 3) {
      insights.push({
        text: `${streak}-day logging streak! Consistency builds income.`,
        type: "positive",
      });
    } else if (streak === 0 && allEntries.length > 0) {
      insights.push({
        text: `Log income today to start (or continue) your streak.`,
        type: "tip",
      });
    }

    // Milestones
    const milestones = buildMilestones(totalEarned);

    res.json({
      streak,
      longestStreak,
      bestDay,
      bestDayDate,
      bestWeek,
      milestones,
      insights,
      weeklyEarnings,
      avgPerEntry: Math.round(avgPerEntry * 100) / 100,
      avgPerDay: Math.round(avgPerDay * 100) / 100,
      topHustle,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Failed to get stats" });
  }
});

function buildMilestones(totalEarned: number) {
  const milestoneValues = [100, 500, 1000, 2500, 5000, 10000];
  return milestoneValues.map((val) => ({
    label: `First $${val.toLocaleString()} earned`,
    achieved: totalEarned >= val,
    achievedAt: totalEarned >= val ? new Date().toISOString() : undefined,
  }));
}

export default router;
