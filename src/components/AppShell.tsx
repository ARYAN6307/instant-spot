import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { CalendarCheck, ChevronDown, Home, Search, Ticket, User2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { CITIES } from "@/lib/oneslot";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Explore", icon: Search },
  { to: "/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/memberships", label: "Passes", icon: Ticket },
  { to: "/profile", label: "Profile", icon: User2 },
] as const;

export function LocationSearchHeader() {
  const navigate = useNavigate();
  const [city, setCity] = useState("Bengaluru");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("oneslot-city");
    if (saved) setCity(saved);
  }, []);

  function pick(c: string) {
    setCity(c);
    window.localStorage.setItem("oneslot-city", c);
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-3xl px-4 pb-3 pt-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-baseline gap-1.5">
            <span className="text-lg font-extrabold tracking-tight">One</span>
            <span className="text-lg font-extrabold tracking-tight text-primary">Slot</span>
          </Link>
          <div className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground"
            >
              {city}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {open && (
              <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-border bg-popover p-1 shadow-2xl">
                {CITIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => pick(c)}
                    className={cn(
                      "block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-surface-2",
                      c === city && "text-primary",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <form
          className="mt-3 flex items-center gap-2 rounded-2xl bg-surface px-3.5 py-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            void navigate({ to: "/search", search: { q: q || undefined } as { q?: string | undefined } });
          }}
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search gyms, salons, tuition, academies…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </form>
      </div>
    </header>
  );
}

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-3xl items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppShell({
  children,
  header = true,
}: {
  children: ReactNode;
  header?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background pb-20">
      {header && <LocationSearchHeader />}
      <main className="mx-auto w-full max-w-3xl px-4">{children}</main>
      <BottomNav />
    </div>
  );
}
