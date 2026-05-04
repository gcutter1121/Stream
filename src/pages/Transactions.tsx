import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpDown, ArrowUp, ArrowDown, Trash2, Pencil, Plus, Loader2,
  Lock, CheckCircle2, TrendingUp, Lightbulb, Target, Layers, Sparkles, Filter, Repeat2
} from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import {
  useListEntries,
  useListHustles,
  useUpdateEntry,
  useUpdateHustle,
  useDeleteEntry,
  useCreateHustle,
  useDeleteHustle,
  useGetStats,
  useGetGoal,
  useSetGoal,
  getListEntriesQueryKey,
  getListHustlesQueryKey,
  getGetSummaryQueryKey,
  getGetStatsQueryKey,
  getGetGoalQueryKey,
} from "@workspace/api-client-react";
import type { Entry } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrency } from "@/lib/utils";

type SortField = "date" | "amount" | "hustleName";
type SortDir = "asc" | "desc";
type TimeRange = "all" | "week" | "month";

function getWeekStart() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}
function getMonthStart() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function Transactions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterHustleId, setFilterHustleId] = useState<string>("all");
  const [filterTime, setFilterTime] = useState<TimeRange>("all");

  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editHustleId, setEditHustleId] = useState("");

  const [newHustleName, setNewHustleName] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [goalType, setGoalType] = useState<"weekly" | "monthly">("monthly");

  const { data: entries, isLoading: isEntriesLoading } = useListEntries(
    undefined,
    { query: { queryKey: getListEntriesQueryKey() } }
  );
  const { data: hustles, isLoading: isHustlesLoading } = useListHustles({
    query: { queryKey: getListHustlesQueryKey() }
  });
  const { data: stats, isLoading: isStatsLoading } = useGetStats({
    query: { queryKey: getGetStatsQueryKey() }
  });
  const { data: goalData, isLoading: isGoalLoading } = useGetGoal({
    query: { queryKey: getGetGoalQueryKey() }
  });

  const updateEntry = useUpdateEntry();
  const updateHustle = useUpdateHustle();
  const deleteEntry = useDeleteEntry();
  const createHustle = useCreateHustle();
  const deleteHustle = useDeleteHustle();
  const setGoalMut = useSetGoal();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListHustlesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
  };

  const filteredAndSorted = useMemo(() => {
    if (!entries) return [];
    let list = [...entries];

    if (filterHustleId !== "all") {
      list = list.filter((e) => String(e.hustleId) === filterHustleId);
    }
    if (filterTime === "week") {
      const start = getWeekStart();
      list = list.filter((e) => new Date(e.date) >= start);
    } else if (filterTime === "month") {
      const start = getMonthStart();
      list = list.filter((e) => new Date(e.date) >= start);
    }

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") cmp = a.date.localeCompare(b.date);
      else if (sortField === "amount") cmp = a.amount - b.amount;
      else if (sortField === "hustleName") cmp = a.hustleName.localeCompare(b.hustleName);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [entries, filterHustleId, filterTime, sortField, sortDir]);

  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const openEdit = (entry: Entry) => {
    setEditEntry(entry);
    setEditAmount(String(entry.amount));
    setEditDate(entry.date);
    setEditNote(entry.note ?? "");
    setEditHustleId(String(entry.hustleId));
  };

  const handleUpdate = () => {
    if (!editEntry) return;
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    updateEntry.mutate(
      {
        id: editEntry.id,
        data: {
          amount,
          date: editDate,
          note: editNote || undefined,
          hustleId: parseInt(editHustleId),
        },
      },
      {
        onSuccess: () => {
          invalidateAll();
          setEditEntry(null);
          toast({ title: "Entry updated" });
        },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteEntry.mutate({ id }, {
      onSuccess: () => {
        invalidateAll();
        toast({ title: "Entry deleted" });
      },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  };

  const handleCreateHustle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHustleName.trim()) return;
    createHustle.mutate({ data: { name: newHustleName.trim() } }, {
      onSuccess: () => {
        setNewHustleName("");
        queryClient.invalidateQueries({ queryKey: getListHustlesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
        toast({ title: "Income stream added" });
      },
      onError: () => toast({ title: "Failed to add stream", variant: "destructive" }),
    });
  };

  const handleDeleteHustle = (id: number) => {
    deleteHustle.mutate({ id }, {
      onSuccess: () => {
        invalidateAll();
        toast({ title: "Income stream deleted" });
      },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  };

  const handleUpdateRecurring = (id: number, value: string) => {
    const recurring = value === "none" ? null : value as "weekly" | "biweekly" | "monthly";
    updateHustle.mutate({ id, data: { recurring } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListHustlesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
        toast({ title: recurring ? `Set to ${recurring}` : "Recurring removed" });
      },
      onError: () => toast({ title: "Failed to update", variant: "destructive" }),
    });
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(goalAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    setGoalMut.mutate({ data: { type: goalType, amount } }, {
      onSuccess: () => {
        setGoalAmount("");
        queryClient.invalidateQueries({ queryKey: getGetGoalQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
        toast({ title: "Goal saved" });
      },
      onError: () => toast({ title: "Failed to save goal", variant: "destructive" }),
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === "asc"
      ? <ArrowUp className="w-3 h-3 text-primary" />
      : <ArrowDown className="w-3 h-3 text-primary" />;
  };

  const isLoading = isEntriesLoading || isHustlesLoading;

  if (isLoading) {
    return (
      <div className="px-6 pt-12 space-y-7 animate-in fade-in">
        <Skeleton className="h-8 w-44 bg-foreground/5" />
        <Skeleton className="h-10 w-full rounded-xl bg-foreground/5" />
        <Skeleton className="h-48 w-full rounded-2xl bg-foreground/5" />
        <Skeleton className="h-36 w-full rounded-2xl bg-foreground/5" />
      </div>
    );
  }

  return (
    <div className="px-6 pt-12 pb-12 animate-in fade-in slide-in-from-bottom-2 duration-400">
      <Tabs defaultValue="entries">
        <header className="mb-5">
          <h1 className="text-2xl font-bold font-display tracking-tight mb-4">Transactions</h1>
          <TabsList className="grid w-full grid-cols-2 h-10 rounded-xl bg-foreground/5">
            <TabsTrigger value="entries" className="rounded-lg text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-white">
              Entries
            </TabsTrigger>
            <TabsTrigger value="manage" className="rounded-lg text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-white">
              Manage
            </TabsTrigger>
          </TabsList>
        </header>

        {/* ─── ENTRIES TAB ────────────────────────────────────── */}
        <TabsContent value="entries" className="space-y-4 mt-0">
          {/* Filter controls */}
          <div className="flex gap-2">
            <Select value={filterHustleId} onValueChange={setFilterHustleId}>
              <SelectTrigger className="flex-1 h-10 rounded-xl bg-foreground/5 border-border/50 text-sm font-medium focus:ring-primary">
                <SelectValue placeholder="All Streams" />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-card border-border">
                <SelectItem value="all" className="rounded-lg text-sm">All Streams</SelectItem>
                {hustles?.map((h) => (
                  <SelectItem key={h.id} value={String(h.id)} className="rounded-lg text-sm">
                    {h.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterTime} onValueChange={(v) => setFilterTime(v as TimeRange)}>
              <SelectTrigger className="flex-1 h-10 rounded-xl bg-foreground/5 border-border/50 text-sm font-medium focus:ring-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-card border-border">
                <SelectItem value="all" className="rounded-lg text-sm">All Time</SelectItem>
                <SelectItem value="week" className="rounded-lg text-sm">This Week</SelectItem>
                <SelectItem value="month" className="rounded-lg text-sm">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort header */}
          <div className="flex items-center px-1">
            <button
              onClick={() => handleSortToggle("date")}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-foreground/35 hover:text-foreground/60 transition-colors w-[88px]"
            >
              Date <SortIcon field="date" />
            </button>
            <button
              onClick={() => handleSortToggle("hustleName")}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-foreground/35 hover:text-foreground/60 transition-colors flex-1"
            >
              Stream <SortIcon field="hustleName" />
            </button>
            <button
              onClick={() => handleSortToggle("amount")}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-foreground/35 hover:text-foreground/60 transition-colors justify-end"
            >
              Amount <SortIcon field="amount" />
            </button>
            <div className="w-14" />
          </div>

          {/* Entries list */}
          {filteredAndSorted.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <Filter className="w-8 h-8 text-foreground/15 mx-auto" />
              <p className="text-sm text-foreground/30 font-medium">No entries found</p>
              <p className="text-xs text-foreground/20">Try changing your filters</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredAndSorted.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-4 py-3 bg-foreground/3 hover:bg-foreground/5 border border-border/40 rounded-xl transition-all duration-150 group cursor-pointer"
                  onClick={() => openEdit(entry)}
                >
                  <div className="w-[72px] shrink-0">
                    <p className="text-xs font-semibold text-foreground/55 tabular-nums">
                      {format(new Date(entry.date), "MMM d")}
                    </p>
                    <p className="text-[10px] text-foreground/30 font-medium">
                      {format(new Date(entry.date), "yyyy")}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{entry.hustleName}</p>
                    {entry.note && (
                      <p className="text-[11px] text-foreground/35 truncate">{entry.note}</p>
                    )}
                  </div>
                  <div className="font-bold text-primary font-display text-sm tabular-nums shrink-0">
                    +{formatCurrency(entry.amount)}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(ev) => { ev.stopPropagation(); openEdit(entry); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-foreground/30 hover:text-primary hover:bg-primary/10 transition-all"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(ev) => { ev.stopPropagation(); handleDelete(entry.id); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-foreground/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary footer */}
          {filteredAndSorted.length > 0 && (
            <div className="flex justify-between items-center px-4 py-3 bg-primary/6 border border-primary/12 rounded-xl mt-2">
              <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                {filteredAndSorted.length} {filteredAndSorted.length === 1 ? "entry" : "entries"}
              </span>
              <span className="font-bold text-primary font-display text-sm tabular-nums">
                {formatCurrency(filteredAndSorted.reduce((s, e) => s + e.amount, 0))}
              </span>
            </div>
          )}
        </TabsContent>

        {/* ─── MANAGE TAB ─────────────────────────────────────── */}
        <TabsContent value="manage" className="space-y-8 mt-0">

          {/* Income Streams */}
          <section className="space-y-3">
            <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-foreground/40 flex items-center gap-1.5">
              <Layers className="w-3 h-3" /> Income Streams
            </p>

            <form onSubmit={handleCreateHustle} className="flex gap-2">
              <Input
                placeholder="e.g. Freelance Design"
                value={newHustleName}
                onChange={(e) => setNewHustleName(e.target.value)}
                className="h-12 rounded-xl flex-1 bg-foreground/5 border-border/50 text-sm font-medium placeholder:text-foreground/25 focus-visible:ring-primary"
                disabled={createHustle.isPending}
              />
              <Button
                type="submit"
                className="h-12 w-12 rounded-xl bg-primary text-white hover:bg-primary/90 hover:scale-[1.04] shadow-sm hover:shadow-md transition-all flex-shrink-0"
                disabled={!newHustleName.trim() || createHustle.isPending}
              >
                {createHustle.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </form>

            {!hustles || hustles.length === 0 ? (
              <div className="text-center p-8 rounded-2xl border border-dashed border-foreground/10 text-foreground/25 text-sm">
                No income streams yet. Add one above.
              </div>
            ) : (
              <div className="space-y-2">
                {hustles.map((hustle) => (
                  <div key={hustle.id} className="bg-foreground/4 border border-border/50 rounded-2xl p-4 hover:bg-foreground/6 transition-all">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm leading-tight truncate">{hustle.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-bold font-display text-primary text-base">{formatCurrency(hustle.totalEarned)}</span>
                          <span className="text-[10px] text-foreground/30 uppercase tracking-wider font-semibold">
                            {hustle.entryCount} {hustle.entryCount === 1 ? "entry" : "entries"}
                          </span>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="text-foreground/20 hover:text-red-400 transition-colors mt-0.5 flex-shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl max-w-[85vw] bg-card border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete income stream?</AlertDialogTitle>
                            <AlertDialogDescription className="text-foreground/40">
                              This will permanently delete "{hustle.name}" and all its entries.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl bg-foreground/5 border-border hover:bg-foreground/8">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteHustle(hustle.id)} className="rounded-xl bg-red-500 hover:bg-red-600 text-white">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    {/* Recurring schedule selector */}
                    <div className="flex items-center gap-2">
                      <Repeat2 className="w-3 h-3 text-foreground/30 flex-shrink-0" />
                      <Select
                        value={hustle.recurring ?? "none"}
                        onValueChange={(val) => handleUpdateRecurring(hustle.id, val)}
                        disabled={updateHustle.isPending}
                      >
                        <SelectTrigger className="h-7 text-xs rounded-lg bg-foreground/5 border-border/40 focus:ring-primary flex-1 font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl bg-card border-border text-xs">
                          <SelectItem value="none" className="text-xs py-2">No schedule</SelectItem>
                          <SelectItem value="weekly" className="text-xs py-2">Weekly</SelectItem>
                          <SelectItem value="biweekly" className="text-xs py-2">Biweekly</SelectItem>
                          <SelectItem value="monthly" className="text-xs py-2">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Income Goal */}
          <section className="space-y-3">
            <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-foreground/40 flex items-center gap-1.5">
              <Target className="w-3 h-3" /> Income Goal
            </p>
            <div className="bg-foreground/4 border border-border/50 rounded-2xl p-5 space-y-4">
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
                  <TabsList className="grid w-full grid-cols-2 h-10 rounded-xl bg-foreground/5">
                    <TabsTrigger value="weekly" className="rounded-lg text-sm font-semibold data-[state=active]:bg-foreground/10">Weekly</TabsTrigger>
                    <TabsTrigger value="monthly" className="rounded-lg text-sm font-semibold data-[state=active]:bg-foreground/10">Monthly</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/35 text-sm font-semibold">$</span>
                    <Input
                      type="number"
                      placeholder="Set amount"
                      value={goalAmount}
                      onChange={(e) => setGoalAmount(e.target.value)}
                      className="pl-8 h-12 rounded-xl bg-foreground/5 border-border/50 font-bold placeholder:text-foreground/20 focus-visible:ring-primary"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={setGoalMut.isPending}
                    className="h-12 rounded-xl px-5 font-semibold bg-primary text-white hover:bg-primary/90 hover:scale-[1.02] shadow-sm hover:shadow-md transition-all"
                  >
                    {setGoalMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                  </Button>
                </div>
              </form>
            </div>
          </section>

          {/* Milestones */}
          {!isStatsLoading && stats?.milestones && stats.milestones.length > 0 && (
            <section className="space-y-3">
              <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-foreground/40 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Milestones
              </p>
              <div className="bg-foreground/4 border border-border/50 rounded-2xl overflow-hidden divide-y divide-border/40">
                {stats.milestones.map((m, i) => (
                  <div key={i} className={cn(
                    "px-4 py-3.5 flex items-center justify-between",
                    m.achieved ? "bg-gold-subtle" : ""
                  )}>
                    <span className={cn("font-medium text-sm", m.achieved ? "text-gold" : "text-foreground/25")}>
                      {m.label}
                    </span>
                    {m.achieved
                      ? <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
                      : <Lock className="w-3.5 h-3.5 text-foreground/15 flex-shrink-0" />}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Insights */}
          {!isStatsLoading && stats?.insights && stats.insights.length > 0 && (
            <section className="space-y-3">
              <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-foreground/40 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Insights
              </p>
              <div className="space-y-2">
                {stats.insights.map((insight, idx) => {
                  const isPositive = insight.type === "positive";
                  const isTip = insight.type === "tip";
                  return (
                    <div key={idx} className="flex gap-3 p-3.5 rounded-xl bg-foreground/4 border border-border/40">
                      <div className={cn(
                        "p-2 rounded-lg h-fit flex-shrink-0",
                        isPositive ? "bg-primary/10 text-primary" : isTip ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
                      )}>
                        {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : isTip ? <Target className="w-3.5 h-3.5" /> : <Lightbulb className="w-3.5 h-3.5" />}
                      </div>
                      <p className="text-sm text-foreground/75 font-medium py-0.5 leading-snug">{insight.text}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Weekly Chart */}
          {!isStatsLoading && stats?.weeklyEarnings && stats.weeklyEarnings.length > 0 && (
            <section className="space-y-3">
              <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-foreground/40">Weekly Earnings</p>
              <div className="bg-foreground/4 border border-border/50 rounded-2xl p-4">
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
                        formatter={(value: number) => [formatCurrency(value), "Earned"]}
                        cursor={{ fill: "rgba(255,255,255,0.04)", radius: 6 }}
                        contentStyle={{
                          background: "hsl(220, 12%, 16%)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "10px",
                          color: "#fff",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      />
                      <Bar dataKey="earned" fill="hsl(152, 60%, 42%)" radius={[5, 5, 5, 5]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Entry Dialog */}
      <Dialog open={!!editEntry} onOpenChange={(o) => !o && setEditEntry(null)}>
        <DialogContent className="rounded-2xl max-w-[92vw] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Edit Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-xs font-semibold text-foreground/40 uppercase tracking-wider block mb-1.5">
                Stream
              </label>
              <Select value={editHustleId} onValueChange={setEditHustleId}>
                <SelectTrigger className="h-12 rounded-xl bg-foreground/5 border-border/50 text-sm font-medium focus:ring-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-card border-border">
                  {hustles?.map((h) => (
                    <SelectItem key={h.id} value={String(h.id)} className="rounded-lg text-sm">
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground/40 uppercase tracking-wider block mb-1.5">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/35 text-sm font-semibold">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="pl-8 h-12 rounded-xl bg-foreground/5 border-border/50 font-bold focus-visible:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground/40 uppercase tracking-wider block mb-1.5">
                Date
              </label>
              <Input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="h-12 rounded-xl bg-foreground/5 border-border/50 font-medium focus-visible:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground/40 uppercase tracking-wider block mb-1.5">
                Note (optional)
              </label>
              <Input
                placeholder="Add a note..."
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                className="h-12 rounded-xl bg-foreground/5 border-border/50 text-sm font-medium placeholder:text-foreground/25 focus-visible:ring-primary"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setEditEntry(null)}
                className="flex-1 h-12 rounded-xl border-border/50 bg-foreground/5 hover:bg-foreground/8 font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={updateEntry.isPending}
                className="flex-1 h-12 rounded-xl bg-primary text-white hover:bg-primary/90 hover:scale-[1.02] shadow-sm hover:shadow-md transition-all font-semibold"
              >
                {updateEntry.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
