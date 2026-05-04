import {
  useGetSummary,
  getGetSummaryQueryKey,
  useGetGoal,
  getGetGoalQueryKey,
  useGetStats,
  getGetStatsQueryKey,
  useListHustles,
  getListHustlesQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { addDays, addMonths, differenceInDays, format } from "date-fns";
import { Link } from "wouter";
import { ArrowUpRight, ArrowDownRight, Flame, Trophy, Layers, Target, PlusCircle, Wallet, Repeat2, CalendarClock } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

function computeNextDate(lastDateStr: string, recurring: string): Date {
  const last = new Date(lastDateStr + "T00:00:00");
  if (recurring === "weekly") return addDays(last, 7);
  if (recurring === "biweekly") return addDays(last, 14);
  return addMonths(last, 1);
}

function daysLabel(days: number): string {
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

export default function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetSummary({
    query: { queryKey: getGetSummaryQueryKey() }
  });

  const { data: goalData, isLoading: isGoalLoading } = useGetGoal({
    query: { queryKey: getGetGoalQueryKey() }
  });

  const { data: stats, isLoading: isStatsLoading } = useGetStats({
    query: { queryKey: getGetStatsQueryKey() }
  });

  const { data: hustles } = useListHustles({
    query: { queryKey: getListHustlesQueryKey() }
  });

  const isLoading = isSummaryLoading || isGoalLoading || isStatsLoading;

  // Compute upcoming recurring income based on last known entry per hustle
  const upcomingItems = (() => {
    if (!hustles || !summary) return [];
    const recurringHustles = hustles.filter(h => h.recurring);
    if (!recurringHustles.length) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return recurringHustles.map(hustle => {
      const lastEntry = summary.recentEntries.find(e => e.hustleName === hustle.name);
      if (!lastEntry) return { hustle, nextDate: null, daysUntil: null };
      const nextDate = computeNextDate(lastEntry.date, hustle.recurring!);
      const daysUntil = differenceInDays(nextDate, today);
      return { hustle, nextDate, daysUntil };
    }).sort((a, b) => {
      if (a.daysUntil === null) return 1;
      if (b.daysUntil === null) return -1;
      return a.daysUntil - b.daysUntil;
    });
  })();

  if (isLoading) {
    return (
      <div className="px-6 pt-14 space-y-8 animate-in fade-in">
        <div className="space-y-3">
          <Skeleton className="h-4 w-28 bg-foreground/5" />
          <Skeleton className="h-20 w-52 bg-foreground/5" />
          <Skeleton className="h-5 w-36 bg-foreground/5" />
        </div>
        <Skeleton className="h-28 rounded-2xl bg-foreground/5" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-22 rounded-2xl bg-foreground/5" />
          <Skeleton className="h-22 rounded-2xl bg-foreground/5" />
          <Skeleton className="h-22 rounded-2xl bg-foreground/5" />
        </div>
        <Skeleton className="h-48 rounded-2xl bg-foreground/5" />
        <Skeleton className="h-40 rounded-2xl bg-foreground/5" />
      </div>
    );
  }

  if (!summary || !stats) return null;

  const diff = summary.thisWeekEarned - summary.lastWeekEarned;
  const isUp = diff >= 0;

  if (summary.hustleCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center space-y-6 animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Wallet className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">No income streams yet</h2>
          <p className="text-foreground/40 text-sm max-w-[220px] mx-auto leading-relaxed">
            Add your first income stream to start tracking your earnings.
          </p>
        </div>
        <Link
          href="/transactions"
          className="bg-primary text-white font-semibold px-8 py-3 rounded-xl text-sm hover:bg-primary/90 hover:scale-[1.02] shadow-sm hover:shadow-md transition-all"
        >
          Add Income Stream
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
      {/* TOTAL INCOME HERO */}
      <div className="px-6 pt-12 pb-6">
        <p className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground/40 mb-2">Total Income</p>
        <div className="text-[3.75rem] leading-none font-bold font-display tracking-tight text-foreground">
          {formatCurrency(summary.totalEarned)}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold",
            isUp ? "bg-primary/12 text-primary" : "bg-destructive/12 text-red-400"
          )}>
            {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {formatCurrency(Math.abs(diff))}
          </span>
          <span className="text-xs text-foreground/35 font-medium">vs last week</span>
        </div>
      </div>

      {summary.entryCount === 0 ? (
        <div className="px-6 pb-10">
          <div className="rounded-2xl border border-border/40 bg-foreground/3 p-10 flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <PlusCircle className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-semibold text-base">No income logged yet</h3>
              <p className="text-foreground/35 text-sm max-w-[200px] mx-auto">Log your first entry to see your dashboard come alive.</p>
            </div>
            <Link
              href="/add"
              className="bg-primary text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-primary/90 hover:scale-[1.02] shadow-sm hover:shadow-md transition-all mt-2 inline-block"
            >
              Log Income
            </Link>
          </div>
        </div>
      ) : (
        <div className="px-6 space-y-6 pb-10">

          {/* GOAL PROGRESS */}
          {goalData?.goal && (
            <div className="rounded-2xl bg-foreground/4 border border-border/40 p-5 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-foreground/40 mb-1">
                    {goalData.goal.type === "weekly" ? "Weekly" : "Monthly"} Goal
                  </p>
                  <div className="text-lg font-bold font-display">
                    {formatCurrency(goalData.currentProgress)}
                    <span className="text-foreground/30 text-sm font-normal"> / {formatCurrency(goalData.goal.amount)}</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-primary tabular-nums">
                  {Math.round(goalData.percentComplete)}%
                </span>
              </div>
              <div className="h-2 w-full bg-foreground/8 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, goalData.percentComplete)}%` }}
                />
              </div>
              {goalData.motivationMessage && (
                <p className="text-xs text-foreground/45 font-medium">{goalData.motivationMessage}</p>
              )}
            </div>
          )}

          {/* STAT CHIPS */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-foreground/4 border border-border/40 rounded-2xl p-4 flex flex-col items-center text-center space-y-1.5">
              <Flame className="w-4 h-4 text-orange-400" />
              <div className="text-2xl font-bold font-display">{stats.streak}</div>
              <div className="text-[9px] font-bold tracking-widest uppercase text-foreground/35">Streak</div>
            </div>
            <div className="bg-foreground/4 border border-border/40 rounded-2xl p-4 flex flex-col items-center text-center space-y-1.5">
              <Trophy className="w-4 h-4 text-gold" />
              <div className="text-xl font-bold font-display">${stats.bestDay.toFixed(0)}</div>
              <div className="text-[9px] font-bold tracking-widest uppercase text-foreground/35">Best Day</div>
            </div>
            <div className="bg-foreground/4 border border-border/40 rounded-2xl p-4 flex flex-col items-center text-center space-y-1.5">
              <Layers className="w-4 h-4 text-foreground/50" />
              <div className="text-xs font-bold font-display truncate w-full text-center">{stats.topHustle || '—'}</div>
              <div className="text-[9px] font-bold tracking-widest uppercase text-foreground/35">Top Stream</div>
            </div>
          </div>

          {/* INCOME STREAM BREAKDOWN */}
          <section className="space-y-3">
            <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-foreground/40">Income Stream Breakdown</p>
            <div className="rounded-2xl bg-foreground/4 border border-border/40 overflow-hidden divide-y divide-border/30">
              {summary.hustleBreakdown.map((hustle) => (
                <div key={hustle.hustleId} className="px-5 py-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[14px] text-foreground/90">{hustle.hustleName}</span>
                    <span className="font-bold font-display text-sm text-foreground">{formatCurrency(hustle.totalEarned)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1 bg-foreground/8 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-700"
                        style={{ width: `${hustle.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-foreground/30 font-semibold w-8 text-right">
                      {Math.round(hustle.percentage)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* UPCOMING INCOME */}
          {upcomingItems.length > 0 && (
            <section className="space-y-3">
              <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-foreground/40 flex items-center gap-1.5">
                <CalendarClock className="w-3 h-3" /> Upcoming Income
              </p>
              <div className="rounded-2xl bg-foreground/4 border border-border/40 overflow-hidden divide-y divide-border/25">
                {upcomingItems.map(({ hustle, nextDate, daysUntil }) => (
                  <div key={hustle.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Repeat2 className="w-3.5 h-3.5 text-primary/40 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground/90 truncate">{hustle.name}</p>
                        <p className="text-[10px] text-foreground/35 font-semibold uppercase tracking-wider mt-0.5">{hustle.recurring}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {nextDate ? (
                        <>
                          <p className={cn(
                            "text-xs font-bold",
                            daysUntil !== null && daysUntil <= 0 ? "text-orange-400" :
                            daysUntil !== null && daysUntil <= 2 ? "text-primary" : "text-foreground/50"
                          )}>
                            {daysUntil !== null ? daysLabel(daysUntil) : ""}
                          </p>
                          <p className="text-[10px] text-foreground/30 mt-0.5">{format(nextDate, "MMM d")}</p>
                        </>
                      ) : (
                        <p className="text-xs text-foreground/25 font-medium">No entries yet</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* RECENT TRANSACTIONS */}
          {summary.recentEntries.length > 0 && (
            <section className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-foreground/40">Recent Transactions</p>
                <Link href="/transactions" className="text-[10px] font-semibold text-primary uppercase tracking-wider hover:text-primary/80 transition-colors">
                  View All
                </Link>
              </div>
              <div className="space-y-2">
                {summary.recentEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between px-4 py-3.5 bg-foreground/3 rounded-xl border border-border/35 hover:bg-foreground/5 transition-all">
                    <div>
                      <p className="font-medium text-sm text-foreground">{entry.hustleName}</p>
                      <p className="text-xs text-foreground/35 mt-0.5">
                        {format(new Date(entry.date), 'MMM d, yyyy')}
                        {entry.note && <span> · {entry.note}</span>}
                      </p>
                    </div>
                    <div className="font-bold text-primary font-display text-base">
                      +{formatCurrency(entry.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
