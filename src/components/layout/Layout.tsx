import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, PlusCircle, TableProperties } from "lucide-react";
import { SettingsSheet } from "@/components/SettingsSheet";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background max-w-md mx-auto relative">
      {/* Floating settings gear — top-right */}
      <div className="fixed top-0 right-0 w-full max-w-md mx-auto pointer-events-none z-50">
        <div className="flex justify-end pr-4 pt-4 pointer-events-auto">
          <SettingsSheet />
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pb-28">
        {children}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border/50 px-8 pb-safe pt-3 z-50">
        <div className="flex justify-between items-end h-14">

          <Link href="/" className="flex flex-col items-center gap-1.5 flex-1" data-testid="nav-dashboard">
            <LayoutDashboard className={`w-5 h-5 transition-colors ${location === '/' ? 'text-primary' : 'text-foreground/25'}`} />
            <span className={`text-[10px] font-semibold tracking-widest uppercase transition-colors ${location === '/' ? 'text-primary' : 'text-foreground/25'}`}>
              Dashboard
            </span>
          </Link>

          <Link href="/add" className="flex flex-col items-center flex-1 -mt-6" data-testid="nav-add">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-primary/20 transition-all duration-200 ${
              location === '/add'
                ? 'bg-primary scale-105'
                : 'bg-primary/90 hover:bg-primary hover:scale-[1.04] hover:shadow-primary/30'
            }`}>
              <PlusCircle className="w-6 h-6 text-white" />
            </div>
            <span className={`text-[10px] font-semibold tracking-widest uppercase mt-1.5 transition-colors ${location === '/add' ? 'text-primary' : 'text-foreground/25'}`}>
              Add
            </span>
          </Link>

          <Link href="/transactions" className="flex flex-col items-center gap-1.5 flex-1" data-testid="nav-transactions">
            <TableProperties className={`w-5 h-5 transition-colors ${location === '/transactions' ? 'text-primary' : 'text-foreground/25'}`} />
            <span className={`text-[10px] font-semibold tracking-widest uppercase transition-colors ${location === '/transactions' ? 'text-primary' : 'text-foreground/25'}`}>
              Transactions
            </span>
          </Link>

        </div>
      </nav>
    </div>
  );
}
