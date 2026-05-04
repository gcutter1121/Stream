import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Settings, Sun, Moon, Trash2, RotateCcw, Target } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { Switch } from "@/components/ui/switch";
import {
  useResetData,
  getGetSummaryQueryKey,
  getListEntriesQueryKey,
  getGetStatsQueryKey,
  getGetGoalQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/useTheme";

export function SettingsSheet() {
  const [open, setOpen] = useState(false);
  const { isLight, toggle } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const resetData = useResetData();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetGoalQueryKey() });
  };

  const handleResetEntries = () => {
    resetData.mutate({ data: { resetGoals: false } }, {
      onSuccess: () => {
        invalidateAll();
        toast({ title: "All entries cleared" });
        setOpen(false);
      },
      onError: () => toast({ title: "Failed to reset", variant: "destructive" }),
    });
  };

  const handleResetAll = () => {
    resetData.mutate({ data: { resetGoals: true } }, {
      onSuccess: () => {
        invalidateAll();
        toast({ title: "All data reset" });
        setOpen(false);
      },
      onError: () => toast({ title: "Failed to reset", variant: "destructive" }),
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="w-9 h-9 rounded-xl flex items-center justify-center text-foreground/40 hover:text-foreground/70 hover:bg-foreground/6 transition-all active:scale-95"
          aria-label="Settings"
        >
          <Settings className="w-[18px] h-[18px]" />
        </button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t border-border bg-card px-0 pb-safe"
      >
        <SheetHeader className="px-6 pb-2">
          <SheetTitle className="text-base font-bold tracking-tight">Settings</SheetTitle>
        </SheetHeader>

        <div className="px-6 space-y-1 pb-6">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between py-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              {isLight ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-foreground/50" />
              )}
              <div>
                <p className="text-sm font-semibold">
                  {isLight ? "Light Mode" : "Dark Mode"}
                </p>
                <p className="text-xs text-foreground/40 mt-0.5">Toggle app appearance</p>
              </div>
            </div>
            <Switch
              checked={isLight}
              onCheckedChange={toggle}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {/* Reset Entries */}
          <div className="flex items-center justify-between py-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <Trash2 className="w-4 h-4 text-foreground/40" />
              <div>
                <p className="text-sm font-semibold">Reset Entries</p>
                <p className="text-xs text-foreground/40 mt-0.5">Delete all income entries</p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-xs font-semibold text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all">
                  Reset
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl max-w-[85vw] bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset all entries?</AlertDialogTitle>
                  <AlertDialogDescription className="text-foreground/45">
                    This will permanently delete all income entries. Your income streams and goals will be preserved.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl bg-foreground/5 border-border hover:bg-foreground/8">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleResetEntries}
                    className="rounded-xl bg-red-500 hover:bg-red-600 text-white"
                  >
                    Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Reset Goals */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <RotateCcw className="w-4 h-4 text-foreground/40" />
              <div>
                <p className="text-sm font-semibold">Reset Everything</p>
                <p className="text-xs text-foreground/40 mt-0.5">Entries + goals cleared</p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-xs font-semibold text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all">
                  Reset
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl max-w-[85vw] bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset everything?</AlertDialogTitle>
                  <AlertDialogDescription className="text-foreground/45">
                    This will permanently delete all entries and goals. Income streams will remain.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl bg-foreground/5 border-border hover:bg-foreground/8">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleResetAll}
                    className="rounded-xl bg-red-500 hover:bg-red-600 text-white"
                  >
                    Reset All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
