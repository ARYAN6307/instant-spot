import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyProvider } from "./dashboard";
import { dateLabel, rupees } from "@/lib/oneslot";

export const Route = createFileRoute("/dashboard/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { provider } = useMyProvider();

  const { data } = useQuery({
    queryKey: ["dash-reports", provider?.id],
    enabled: !!provider,
    queryFn: async () => {
      const [bookings, subs] = await Promise.all([
        supabase
          .from("bookings")
          .select("amount, status, created_at")
          .eq("provider_id", provider!.id),
        supabase
          .from("subscriptions")
          .select("amount_paid, created_at")
          .eq("provider_id", provider!.id),
      ]);
      return { bookings: bookings.data ?? [], subs: subs.data ?? [] };
    },
  });

  const byDay: Record<string, number> = {};
  for (const b of data?.bookings ?? []) {
    if (b.status === "cancelled") continue;
    const k = b.created_at.slice(0, 10);
    byDay[k] = (byDay[k] ?? 0) + b.amount;
  }
  for (const s of data?.subs ?? []) {
    const k = s.created_at.slice(0, 10);
    byDay[k] = (byDay[k] ?? 0) + (s.amount_paid ?? 0);
  }
  const days = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).slice(-14);
  const max = Math.max(1, ...days.map(([, v]) => v));
  const total = days.reduce((a, [, v]) => a + v, 0);
  const cancelled = (data?.bookings ?? []).filter((b) => b.status === "cancelled").length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <Card label="Revenue (14d)" value={rupees(total)} />
        <Card label="Bookings" value={String(data?.bookings.length ?? 0)} />
        <Card label="Cancellations" value={String(cancelled)} />
      </div>

      <section className="rounded-3xl bg-card p-4 ring-1 ring-border">
        <h2 className="text-sm font-bold">Daily revenue</h2>
        <div className="mt-4 flex h-40 items-end gap-1.5">
          {days.map(([d, v]) => (
            <div key={d} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md bg-primary"
                style={{ height: `${Math.max(4, (v / max) * 130)}px` }}
                title={`${dateLabel(d)} · ${rupees(v)}`}
              />
              <span className="text-[9px] text-muted-foreground">{d.slice(8)}</span>
            </div>
          ))}
          {!days.length && (
            <p className="w-full text-center text-xs text-muted-foreground">No revenue yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-card p-4 ring-1 ring-border">
      <p className="text-lg font-extrabold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
