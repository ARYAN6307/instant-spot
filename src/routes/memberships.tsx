import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { dateLabel, rupees } from "@/lib/oneslot";

export const Route = createFileRoute("/memberships")({
  head: () => ({
    meta: [
      { title: "My passes & memberships — OneSlot" },
      {
        name: "description",
        content:
          "See remaining sessions, validity and value of every OneSlot session pass you have purchased.",
      },
      { property: "og:title", content: "My passes — OneSlot" },
      { property: "og:description", content: "Sessions left, expiry dates and where to use them." },
    ],
  }),
  component: MembershipsPage,
});

type Row = {
  id: string;
  sessions_total: number;
  sessions_remaining: number;
  amount_paid: number;
  expires_at: string;
  status: string;
  plans: { name: string } | null;
  providers: { id: string; name: string; area: string; cover_url: string | null } | null;
};

function MembershipsPage() {
  const { user, loading } = useAuth();

  const { data = [] } = useQuery({
    queryKey: ["subscriptions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(
          "id, sessions_total, sessions_remaining, amount_paid, expires_at, status, plans(name), providers(id, name, area, cover_url)",
        )
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Row[];
    },
  });

  if (!loading && !user) {
    return (
      <AppShell>
        <div className="mt-24 text-center">
          <p className="text-sm text-muted-foreground">Sign in to see your passes.</p>
          <Link
            to="/auth"
            className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Sign in
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="pt-5 text-2xl font-extrabold tracking-tight">My passes</h1>
      <div className="mt-5 space-y-3">
        {data.map((s) => {
          const pct = Math.round((s.sessions_remaining / Math.max(s.sessions_total, 1)) * 100);
          const expired = new Date(s.expires_at).getTime() < Date.now();
          return (
            <Link
              key={s.id}
              to="/provider/$id"
              params={{ id: s.providers?.id ?? "" }}
              className="block overflow-hidden rounded-3xl bg-card ring-1 ring-border"
            >
              <div className="flex gap-3 p-4">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-surface-2">
                  {s.providers?.cover_url && (
                    <img
                      src={s.providers.cover_url}
                      alt={s.providers.name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.providers?.name}</p>
                  <p className="text-xs text-muted-foreground">{s.plans?.name}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {rupees(s.amount_paid)} · {expired ? "Expired" : `Valid till ${dateLabel(s.expires_at)}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold text-primary">{s.sessions_remaining}</p>
                  <p className="text-[10px] text-muted-foreground">of {s.sessions_total} left</p>
                </div>
              </div>
              <div className="h-1.5 w-full bg-surface-2">
                <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          );
        })}
      </div>

      {!data.length && (
        <div className="mt-20 text-center">
          <Ticket className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No passes yet.</p>
          <Link
            to="/search"
            className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Browse places
          </Link>
        </div>
      )}
      <div className="h-10" />
    </AppShell>
  );
}
