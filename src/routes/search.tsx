import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { ProviderCard } from "@/components/ProviderCard";
import { CATEGORIES, type Provider } from "@/lib/oneslot";
import { cn } from "@/lib/utils";

type SearchParams = { q?: string; category?: string; sort?: string; maxPrice?: number };

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    q: typeof s['q'] === "string" && s['q'] ? s['q'] : undefined,
    category: typeof s['category'] === "string" && s['category'] ? s['category'] : undefined,
    sort: typeof s['sort'] === "string" && s['sort'] ? s['sort'] : undefined,
    maxPrice: typeof s['maxPrice'] === "number" ? s['maxPrice'] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Explore local services — OneSlot" },
      {
        name: "description",
        content:
          "Search and filter gyms, salons, tuition centres, sports academies and yoga studios by category, price and rating.",
      },
      { property: "og:title", content: "Explore local services — OneSlot" },
      {
        property: "og:description",
        content: "Filter by category, price and rating to find your next recurring booking.",
      },
    ],
  }),
  component: SearchPage,
});

const SORTS = [
  { key: "rating", label: "Top rated" },
  { key: "price_low", label: "Price: low to high" },
  { key: "price_high", label: "Price: high to low" },
  { key: "newest", label: "Newest" },
];

function SearchPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });

  const setParam = (patch: Partial<SearchParams>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }) });

  const { data = [], isLoading } = useQuery({
    queryKey: ["providers", search],
    queryFn: async () => {
      let q = supabase.from("providers").select("*").eq("is_active", true);
      if (search.category) q = q.eq("category", search.category as Provider["category"]);
      if (search.q) q = q.or(`name.ilike.%${search.q}%,area.ilike.%${search.q}%,description.ilike.%${search.q}%`);
      if (search.maxPrice) q = q.lte("price_from", search.maxPrice);
      if (search.sort === "price_low") q = q.order("price_from", { ascending: true });
      else if (search.sort === "price_high") q = q.order("price_from", { ascending: false });
      else if (search.sort === "newest") q = q.order("created_at", { ascending: false });
      else q = q.order("rating", { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      return data as Provider[];
    },
  });

  return (
    <AppShell>
      <div className="rail -mx-4 mt-4 px-4">
        <button
          onClick={() => setParam({ category: undefined })}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 ring-border",
            !search.category ? "bg-primary text-primary-foreground ring-primary" : "bg-card",
          )}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setParam({ category: search.category === c.key ? undefined : c.key })}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 ring-border",
              search.category === c.key
                ? "bg-primary text-primary-foreground ring-primary"
                : "bg-card",
            )}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        <select
          value={search.sort ?? "rating"}
          onChange={(e) => setParam({ sort: e.target.value })}
          className="rounded-full bg-card px-3 py-1.5 text-xs font-medium ring-1 ring-border outline-none"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={String(search.maxPrice ?? "")}
          onChange={(e) =>
            setParam({ maxPrice: e.target.value ? Number(e.target.value) : undefined })
          }
          className="rounded-full bg-card px-3 py-1.5 text-xs font-medium ring-1 ring-border outline-none"
        >
          <option value="">Any budget</option>
          <option value="1000">Under ₹1,000</option>
          <option value="2000">Under ₹2,000</option>
          <option value="5000">Under ₹5,000</option>
        </select>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {isLoading ? "Searching…" : `${data.length} places found`}
        {search.q ? ` for “${search.q}”` : ""}
      </p>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {data.map((p) => (
          <ProviderCard key={p.id} provider={p} wide />
        ))}
      </div>

      {!isLoading && !data.length && (
        <p className="mt-16 text-center text-sm text-muted-foreground">
          Nothing matched. Try another category or clear filters.
        </p>
      )}
      <div className="h-10" />
    </AppShell>
  );
}
