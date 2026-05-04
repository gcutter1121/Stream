import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, Loader2, Lock, CheckCircle2, TrendingUp, Lightbulb, Target, Layers, Sparkles } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import {
  useListHustles,
  useCreateHustle,
  useDeleteHustle,
  useGetStats,
  useGetGoal,
  useSetGoal,
  getListHustlesQueryKey,
  getGetSummaryQueryKey,
  getListEntriesQueryKey,
  getGetStatsQueryKey,
  getGetGoalQueryKey
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatCurrency } from "@/lib/utils";

export default function Hustles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newHustleName, setNewHustleName] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [goalType, setGoalType] = useState<"weekly" | "monthly">("monthly");

  const { data: hustles, isLoading: isHustlesLoading } = useListHustles({
    query: { queryKey: getListHustlesQueryKey() }
  });
  const { data: stats, isLoading: isStatsLoading } = useGetStats({
    query: { queryKey: getGetStatsQueryKey() }
  });
  const { data: goalData, isLoading: isGoalLoading } = useGetGoal({
    query: { queryKey: getGetGoalQueryKey() }
  });

  const createHustle = useCreateHustle();
  const deleteHustle = useDeleteHustle();
  const setGoal = useSetGoal();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHustleName.trim()) return;
    createHustle.mutate({ data: { name: newHustleName.trim() } }, {
      onSuccess: () => {
        setNewHustleName("");
        queryClient.invalidateQueries({ queryKey: getListHustlesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
        toast({ title: "Income stream added" });
      },
      onError: () => toast({ title: "Failed to add income stream", variant: "destructive" })
    });
  };

  const handleDelete = (id: number) => {
    deleteHustle.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListHustlesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        toast({ title: "Income stream deleted" });
      },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" })
    });
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(goalAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    setGoal.mutate({ data: { type: goalType, amount } }, {
      onSuccess: () => {
        setGoalAmount("");
        queryClient.invalidateQueries({ queryKey: getGetGoalQueryKey() });
        toast({ title: "Goal saved" });
      },
      onError: () => toast({ title: "Failed to save goal", variant: "destructive" })
    });
  };

  if (isHustlesLoading || isStatsLoading || isGoalLoading) {
    return (
      <div className="px-6 pt-12 space-y-7 animate-in fade-in">
        <Skeleton className="h-8 w-44 bg-white/5" />
        <Skeleton className="h-12 w-full rounded-xl bg-white/5" />
        <Skeleton className="h-36 w-full rounded-2xl bg-white/5" />
        <Skeleton className="h-36 w-full rounded-2xl bg-white/5" />
      </div>
    );
  }

  return (
    <div className="px-6 pt-12 pb-12 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
      <header>
        <h1 className="text-2xl font-bold font-display tracking-tight">Income Streams</h1>
      </header>

      {/* SECTION 1: MANAGE INCOME STREAMS */}
      <section className="space-y-3">
        <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-white/40 flex items-center gap-1.5">
          <Layers className="w-3 h-3" /> Manage Streams
        </p>

        <form onSubmit={handleCreate} className="flex gap-2">
          <Input
            placeholder="e.g. Freelance Design"
            value={newHustleName}
            onChange={(e) => setNewHustleName(e.target.value)}
            className="h-12 rounded-xl flex-1 bg-white/5 border-white/8 text-sm font-medium placeholder:text-white/25 focus-visible:ring-primary"
            disabled={createHustle.isPending}
          />
          <Button
            type="submit"
            className="h-12 w-12 rounded-xl bg-primary text-white hover:bg-primary/90 flex-shrink-0"
            disabled={!newHustleName.trim() || createHustle.isPending}
          >
            {createHustle.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </form>

        {!hustles || hustles.length === 0 ? (
          <div className="text-center p-8 rounded-2xl border border-dashed border-white/10 text-white/25 text-sm">
            No income streams yet. Add one above.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {hustles.map((hustle) => (
              <div key={hustle.id} className="bg-white/4 border border-white/6 rounded-2xl p-4 relative">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="absolute top-3.5 right-3.5 text-white/20 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl max-w-[85vw] bg-card border-white/10">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete income stream?</AlertDialogTitle>
                      <AlertDialogDescription className="text-white/40">
                        This will permanently delete "{hustle.name}" and all its entries.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl bg-white/5 border-white/10 hover:bg-white/8">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(hustle.id)} className="rounded-xl bg-red-500 hover:bg-red-600 text-white">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <h3 className="font-semibold text-sm leading-tight truncate pr-5 mb-2.5">{hustle.name}</h3>
                <div className="text-lg font-bold font-display text-primary">
                  {formatCurrency(hustle.totalEarned)}
                </div>
                <div className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5 font-semibold">
                  {hustle.entryCount} {hustle.entryCount === 1 ? 'entry' : 'entries'}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 2: INCOME GOAL */}
      <section className="space-y-3">
        <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-white/40 flex items-center gap-1.5">
          <Target className="w-3 h-3" /> Income Goal
        </p>

        <div className="bg-white/4 border border-white/6 rounded-2xl p-5 space-y-4">
          {goalData?.goal && (
            <div className="flex items-center justify-between p-3 bg-primary/8 rounded-xl">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/60 mb-0.5">
                  {goalData.goal.type === "weekly" ? "Weekly" : "Monthly"} Goal
                </p>
                <p className="text-lg font-bold font-display text-primary">{formatCurrency(goalData.goal.amount)}</p>
              </div>
              <Target className="w-6 h-6 text-primary/25" />
            </div>
          )}

          <form onSubmit={handleSaveGoal} className="space-y-3">
            <Tabs value={goalType} onValueChange={(v) => setGoalType(v as "weekly" | "monthly")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-10 rounded-xl bg-white/5">
                <TabsTrigger value="weekly" className="rounded-lg text-sm font-semibold data-[state=active]:bg-white/10">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="rounded-lg text-sm font-semibold data-[state=active]:bg-white/10">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35 text-sm font-semibold">$</span>
                <Input
                  type="number"
                  placeholder="Set amount"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  className="pl-8 h-12 rounded-xl bg-white/5 border-white/8 font-bold placeholder:text-white/20 focus-visible:ring-primary"
                />
              </div>
              <Button
                type="submit"
                disabled={setGoal.isPending}
                className="h-12 rounded-xl px-5 font-semibold bg-primary text-white hover:bg-primary/90"
              >
                {setGoal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* SECTION 3: INSIGHTS */}
      {stats?.insights && stats.insights.length > 0 && (
        <section className="space-y-3">
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-white/40 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> Insights
          </p>
          <div className="space-y-2">
            {stats.insights.map((insight, idx) => {
              const isPositive = insight.type === "positive";
              const isTip = insight.type === "tip";
              return (
                <div key={idx} className="flex gap-3 p-3.5 rounded-xl bg-white/4 border border-white/5">
                  <div className={cn(
                    "p-2 rounded-lg h-fit flex-shrink-0",
                    isPositive ? "bg-primary/10 text-primary" : isTip ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
                  )}>
                    {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : isTip ? <Target className="w-3.5 h-3.5" /> : <Lightbulb className="w-3.5 h-3.5" />}
                  </div>
                  <p className="text-sm text-white/75 font-medium py-0.5 leading-snug">{insight.text}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 4: MILESTONES */}
      {stats?.milestones && stats.milestones.length > 0 && (
        <section className="space-y-3">
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-white/40">Milestones</p>
          <div className="bg-white/4 border border-white/6 rounded-2xl overflow-hidden divide-y divide-white/5">
            {stats.milestones.map((m, i) => (
              <div key={i} className={cn(
                "px-4 py-3.5 flex items-center justify-between",
                m.achieved ? "bg-gold-subtle" : ""
              )}>
                <span className={cn(
                  "font-medium text-sm",
                  m.achieved ? "text-gold" : "text-white/25"
                )}>
                  {m.label}
                </span>
                {m.achieved
                  ? <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
                  : <Lock className="w-3.5 h-3.5 text-white/15 flex-shrink-0" />
                }
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 5: WEEKLY CHART */}
      {stats?.weeklyEarnings && stats.weeklyEarnings.length > 0 && (
        <section className="space-y-3">
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-white/40">Weekly Earnings</p>
          <div className="bg-white/4 border border-white/5 rounded-2xl p-4">
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyEarnings} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <XAxis
                    dataKey="week"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: 600 }}
                    dy={6}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Earned']}
                    cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 6 }}
                    contentStyle={{
                      background: 'hsl(220, 12%, 16%)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  />
                  <Bar
                    dataKey="earned"
                    fill="hsl(152, 60%, 42%)"
                    radius={[5, 5, 5, 5]}
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
