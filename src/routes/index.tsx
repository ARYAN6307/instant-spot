import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { ProviderCard } from "@/components/ProviderCard";
import { CATEGORIES, type Provider } from "@/lib/oneslot";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OneSlot — Book gyms, salons, tuition & classes near you" },
      {
        name: "description",
        content:
          "Discover and book recurring local services in your city: gyms, salons, tuition centres, sports academies and dance or yoga studios. Real slots, real memberships.",
      },
      { property: "og:title", content: "OneSlot — Your city's recurring services, one app" },
      {
        property: "og:description",
        content: "Browse verified gyms, salons, tuition and academies. Book a slot in seconds.",
      },
    ],
  }),
  component: Home,
});

function Rail({ title, items, to }: { title: string; items: Provider[]; to?: string }) {
  if (!items.length) return null;
  return (
    <section className="mt-7">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold tracking-tight">{title}</h2>
        {to && (
          <Link
            to="/search"
            search={{ category: to }}
            className="flex items-center gap-1 text-xs font-medium text-primary"
          >
            See all <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="rail -mx-4 px-4 pb-1">
        {items.map((p) => (
          <ProviderCard key={p.id} provider={p} />
        ))}
      </div>
    </section>
  );
}

function Home() {
  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["providers", "home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("providers")
        .select("*")
        .eq("is_active", true)
        .order("rating", { ascending: false });
      if (error) throw error;
      return data as Provider[];
    },
  });

  const top = providers.slice(0, 8);

  return (
    <AppShell>
      <div className="pt-5">
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight">
          Your week,
          <br />
          <span className="text-primary">already booked.</span>
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Gyms, salons, tuition, academies and studios near you — with real slots and flexible
          session passes.
        </p>
      </div>

      <div className="rail -mx-4 mt-5 px-4">
        {CATEGORIES.map((c) => (
          <Link
            key={c.key}
            to="/search"
            search={{ category: c.key }}
            className="flex w-[92px] flex-col items-center gap-2 rounded-2xl bg-card px-2 py-3 ring-1 ring-border"
          >
            <span className="text-2xl">{c.emoji}</span>
            <span className="text-center text-[11px] font-medium leading-tight">{c.label}</span>
          </Link>
        ))}
      </div>

      {isLoading && (
        <div className="mt-8 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl bg-card" />
          ))}
        </div>
      )}

      <Rail title="Top rated near you" items={top} />

      {CATEGORIES.map((c) => (
        <Rail
          key={c.key}
          title={c.label}
          to={c.key}
          items={providers.filter((p) => p.category === c.key)}
        />
      ))}

      <Link
        to="/dashboard"
        className="mt-9 block rounded-3xl bg-card p-5 ring-1 ring-border"
      >
        <p className="text-sm font-semibold">Run a gym, salon or academy?</p>
        <p className="mt-1 text-xs text-muted-foreground">
          List your business on OneSlot and manage slots, plans and customers from one dashboard.
        </p>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
          Open provider dashboard <ArrowRight className="h-3 w-3" />
        </span>
      </Link>

      <div className="h-10" />
    </AppShell>
  );
}
