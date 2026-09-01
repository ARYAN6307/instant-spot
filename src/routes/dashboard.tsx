import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Provider } from "@/lib/oneslot";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Provider dashboard — OneSlot" },
      {
        name: "description",
        content:
          "Manage your OneSlot listing, services, session passes, availability, bookings and revenue reports.",
      },
      { property: "og:title", content: "Provider dashboard — OneSlot" },
      { property: "og:description", content: "Slots, bookings, customers and revenue in one place." },
    ],
  }),
  component: DashboardLayout,
});

const ProviderCtx = createContext<{ provider: Provider | null; refetch: () => void }>({
  provider: null,
  refetch: () => {},
});

export function useMyProvider() {
  return useContext(ProviderCtx);
}

const TABS = [
  { to: "/dashboard", label: "Overview", exact: true },
  { to: "/dashboard/bookings", label: "Bookings" },
  { to: "/dashboard/slots", label: "Availability" },
  { to: "/dashboard/services", label: "Services & passes" },
  { to: "/dashboard/customers", label: "Customers" },
  { to: "/dashboard/reports", label: "Reports" },
  { to: "/dashboard/listing", label: "Listing" },
] as const;

function DashboardLayout() {
  const { user, role, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: provider = null, refetch } = useQuery({
    queryKey: ["my-provider", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("providers")
        .select("*")
        .eq("owner_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as Provider) ?? null;
    },
  });

  if (loading) return <div className="min-h-screen bg-background" />;

  if (!user) {
    return (
      <Gate
        title="Provider access"
        body="Sign in with your business mobile number to open the dashboard."
        cta="Sign in"
        to="/auth"
      />
    );
  }

  if (role !== "provider") {
    return (
      <Gate
        title="Not a provider yet"
        body="Unlock provider access from your profile to list your business."
        cta="Go to profile"
        to="/profile"
      />
    );
  }

  return (
    <ProviderCtx.Provider value={{ provider, refetch: () => void refetch() }}>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                Provider
              </p>
              <p className="text-sm font-bold">{provider?.name ?? "Set up your listing"}</p>
            </div>
            <Link to="/" className="rounded-full bg-surface px-3 py-1.5 text-xs font-medium">
              Consumer app
            </Link>
          </div>
          <div className="rail mx-auto max-w-5xl px-4 pb-2.5">
            {TABS.map((t) => {
              const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 ring-border",
                    active ? "bg-primary text-primary-foreground ring-primary" : "bg-card",
                  )}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-5">
          <Outlet />
        </main>
      </div>
    </ProviderCtx.Provider>
  );
}

function Gate({
  title,
  body,
  cta,
  to,
}: {
  title: string;
  body: string;
  cta: string;
  to: "/auth" | "/profile";
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{body}</p>
        <Link
          to={to}
          className="mt-5 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}
