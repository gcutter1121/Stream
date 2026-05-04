import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Zap, RefreshCw } from "lucide-react";

import {
  useListHustles,
  useCreateEntry,
  getListHustlesQueryKey,
  getGetSummaryQueryKey,
  getListEntriesQueryKey,
  getGetStatsQueryKey,
  getGetGoalQueryKey
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrency } from "@/lib/utils";

interface LastEntry {
  amount: number;
  hustleId: number;
  hustleName: string;
  note?: string;
}

const formSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  hustleId: z.coerce.number().positive("Please select an income stream"),
  date: z.date(),
  note: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

const QUICK_AMOUNTS = [10, 20, 50, 100];

function saveLastEntry(entry: LastEntry) {
  localStorage.setItem("lastEntry", JSON.stringify(entry));
  localStorage.setItem("lastHustleId", entry.hustleId.toString());
}

export default function AddIncome() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lastHustleId, setLastHustleId] = useState<number | undefined>();
  const [lastEntry, setLastEntry] = useState<LastEntry | null>(null);

  useEffect(() => {
    const savedId = localStorage.getItem("lastHustleId");
    if (savedId) setLastHustleId(parseInt(savedId, 10));
    const savedEntry = localStorage.getItem("lastEntry");
    if (savedEntry) {
      try { setLastEntry(JSON.parse(savedEntry)); } catch {}
    }
  }, []);

  const { data: hustles, isLoading: hustlesLoading } = useListHustles({
    query: { queryKey: getListHustlesQueryKey() }
  });

  const createEntry = useCreateEntry();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: undefined,
      hustleId: lastHustleId || undefined,
      date: new Date(),
      note: ""
    }
  });

  useEffect(() => {
    if (lastHustleId && !form.getValues().hustleId) {
      form.setValue("hustleId", lastHustleId);
    }
  }, [lastHustleId, form]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetGoalQueryKey() });
  };

  const handleQuickAdd = (amount: number) => {
    if (!lastHustleId) {
      toast({ title: "Select an income stream first", variant: "destructive" });
      return;
    }
    const hustleName = hustles?.find(h => h.id === lastHustleId)?.name ?? "";
    createEntry.mutate({
      data: { amount, hustleId: lastHustleId, date: format(new Date(), "yyyy-MM-dd") }
    }, {
      onSuccess: () => {
        saveLastEntry({ amount, hustleId: lastHustleId, hustleName });
        toast({ title: `+${formatCurrency(amount)} logged` });
        invalidateAll();
        setLocation("/");
      },
      onError: () => toast({ title: "Failed to log income", variant: "destructive" })
    });
  };

  const handleRepeatLast = () => {
    if (!lastEntry) return;
    createEntry.mutate({
      data: {
        amount: lastEntry.amount,
        hustleId: lastEntry.hustleId,
        date: format(new Date(), "yyyy-MM-dd"),
        note: lastEntry.note || undefined,
      }
    }, {
      onSuccess: () => {
        toast({ title: `+${formatCurrency(lastEntry.amount)} logged` });
        invalidateAll();
        setLocation("/");
      },
      onError: () => toast({ title: "Failed to log income", variant: "destructive" })
    });
  };

  const onSubmit = (data: FormValues) => {
    const hustleName = hustles?.find(h => h.id === data.hustleId)?.name ?? "";
    saveLastEntry({ amount: data.amount, hustleId: data.hustleId, hustleName, note: data.note });
    setLastHustleId(data.hustleId);

    createEntry.mutate({
      data: {
        amount: data.amount,
        hustleId: data.hustleId,
        date: format(data.date, "yyyy-MM-dd"),
        note: data.note || undefined
      }
    }, {
      onSuccess: () => {
        toast({ title: "Income logged" });
        invalidateAll();
        setLocation("/");
      },
      onError: () => toast({ title: "Failed to log income", variant: "destructive" })
    });
  };

  if (hustlesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!hustles || hustles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center space-y-6 animate-in fade-in">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
          <CalendarIcon className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">No Income Streams</h2>
          <p className="text-foreground/40 text-sm max-w-[220px] mx-auto">Add an income stream before logging entries.</p>
        </div>
        <Button onClick={() => setLocation("/transactions")} className="w-full max-w-xs rounded-xl h-12 text-base font-semibold bg-primary text-white hover:bg-primary/90 hover:scale-[1.02] shadow-sm hover:shadow-md transition-all">
          Add Income Stream
        </Button>
      </div>
    );
  }

  const lastStream = hustles.find(h => h.id === lastHustleId);

  return (
    <div className="px-6 pt-12 pb-12 space-y-7 animate-in fade-in slide-in-from-bottom-2 duration-400">
      <header>
        <h1 className="text-2xl font-bold font-display tracking-tight">Log Income</h1>
      </header>

      {/* REPEAT LAST ENTRY */}
      {lastEntry && (
        <button
          type="button"
          onClick={handleRepeatLast}
          disabled={createEntry.isPending}
          className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-primary/8 border border-primary/15 hover:bg-primary/12 hover:scale-[1.01] hover:shadow-md transition-all active:scale-[0.99] group"
        >
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-0.5 flex items-center gap-1.5">
              <RefreshCw className="w-2.5 h-2.5" /> Repeat Last
            </p>
            <p className="text-sm font-bold text-foreground">
              {formatCurrency(lastEntry.amount)}
              <span className="font-normal text-foreground/50"> · {lastEntry.hustleName}</span>
              {lastEntry.note && <span className="font-normal text-foreground/35"> · {lastEntry.note}</span>}
            </p>
          </div>
          <div className="text-primary font-bold text-xl group-hover:translate-x-0.5 transition-transform">
            {createEntry.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "+"}
          </div>
        </button>
      )}

      {/* QUICK ADD */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-foreground/40 flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-primary" />
            Quick Add
          </p>
          {lastStream && (
            <span className="text-[10px] text-foreground/30 font-medium">to {lastStream.name}</span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_AMOUNTS.map(amount => (
            <button
              key={amount}
              type="button"
              onClick={() => handleQuickAdd(amount)}
              disabled={!lastHustleId || createEntry.isPending}
              className={cn(
                "h-14 rounded-xl font-display text-base font-bold transition-all",
                "disabled:opacity-25 disabled:cursor-not-allowed",
                lastHustleId
                  ? "bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white hover:scale-[1.03] hover:shadow-md active:scale-95"
                  : "bg-foreground/4 border border-border/30 text-foreground/25"
              )}
            >
              +${amount}
            </button>
          ))}
        </div>
        {!lastHustleId && (
          <p className="text-xs text-foreground/25 text-center">Submit once to enable Quick Add</p>
        )}
      </section>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-foreground/8" />
        <span className="text-[10px] text-foreground/25 font-semibold uppercase tracking-wider">or enter amount</span>
        <div className="flex-1 h-px bg-foreground/8" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* AMOUNT */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-bold text-foreground/25 pointer-events-none">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      className="pl-11 h-20 text-4xl font-bold rounded-2xl font-display bg-foreground/5 border-border/40 focus-visible:ring-primary placeholder:text-foreground/12"
                      placeholder="0"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* INCOME STREAM */}
          <FormField
            control={form.control}
            name="hustleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-semibold tracking-[0.16em] uppercase text-foreground/40">Income Stream</FormLabel>
                <Select
                  onValueChange={(val) => {
                    field.onChange(val);
                    setLastHustleId(parseInt(val, 10));
                  }}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-xl bg-foreground/5 border-border/40 text-sm font-semibold focus:ring-primary">
                      <SelectValue placeholder="Select income stream" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl bg-card border-border">
                    {hustles.map((hustle) => (
                      <SelectItem key={hustle.id} value={hustle.id.toString()} className="py-2.5 text-sm">
                        <span>{hustle.name}</span>
                        {hustle.recurring && (
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-primary/60">
                            {hustle.recurring}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            {/* DATE */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-[10px] font-semibold tracking-[0.16em] uppercase text-foreground/40">Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-12 rounded-xl text-left font-medium text-sm bg-foreground/5 border-border/40 hover:bg-foreground/8",
                            !field.value && "text-foreground/30"
                          )}
                        >
                          {field.value ? format(field.value, "MMM d, yyyy") : "Date"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-25" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl bg-card border-border" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* NOTE */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold tracking-[0.16em] uppercase text-foreground/40">Note</FormLabel>
                  <FormControl>
                    <Input
                      className="h-12 rounded-xl bg-foreground/5 border-border/40 text-sm font-medium focus-visible:ring-primary placeholder:text-foreground/20"
                      placeholder="Optional"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-xl text-base font-semibold bg-primary text-white hover:bg-primary/90 hover:scale-[1.02] shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            disabled={createEntry.isPending}
          >
            {createEntry.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Entry
          </Button>
        </form>
      </Form>
    </div>
  );
}
