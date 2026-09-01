import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, IndianRupee, Star, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyProvider } from "./dashboard";
import { dateLabel, rupees, timeLabel } from "@/lib/oneslot";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

function Overview() {
  const { provider } = useMyProvider();

  const { data } = useQuery({
    queryKey: ["dash-overview", provider?.id],
    enabled: !!provider,
    queryFn: async () => {
      const [bookings, subs, slots] = await Promise.all([
        supabase
          .from("bookings")
          .select("id, amount, status, created_at, slots(starts_at), services(name)")
          .eq("provider_id", provider!.id)
          .order("created_at", { ascending: false }),
        supabase.from("subscriptions").select("id, amount_paid").eq("provider_id", provider!.id),
        supabase
          .from("slots")
          .select("id, capacity, booked_count, starts_at")
          .eq("provider_id", provider!.id)
          .gte("starts_at", new Date().toISOString()),
      ]);
      return {
        bookings: (bookings.data ?? []) as unknown as {
          id: string;
          amount: number;
          status: string;
          created_at: string;
          slots: { starts_at: string } | null;
          services: { name: string } | null;
        }[],
        subs: subs.data ?? [],
        slots: slots.data ?? [],
      };
    },
  });

  if (!provider) {
    return (
      <div className="rounded-3xl bg-card p-6 text-center ring-1 ring-border">
        <p className="text-sm font-semibold">You haven't created a listing yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Add your business details to start publishing slots and passes.
        </p>
        <Link
          to="/dashboard/listing"
          className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Create listing
        </Link>
      </div>
    );
  }

  const revenue =
    (data?.bookings ?? [])
      .filter((b) => b.status !== "cancelled")
      .reduce((a, b) => a + b.amount, 0) +
    (data?.subs ?? []).reduce((a, s) => a + (s.amount_paid ?? 0), 0);
  const active = (data?.bookings ?? []).filter((b) => b.status === "confirmed").length;
  const capacityLeft = (data?.slots ?? []).reduce(
    (a, s) => a + Math.max(s.capacity - s.booked_count, 0),
    0,
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={IndianRupee} label="Revenue" value={rupees(revenue)} />
        <Stat icon={CalendarDays} label="Active bookings" value={String(active)} />
        <Stat icon={Users} label="Open seats" value={String(capacityLeft)} />
        <Stat
          icon={Star}
          label="Rating"
          value={Number(provider.rating) > 0 ? Number(provider.rating).toFixed(1) : "—"}
        />
      </div>

      <section className="rounded-3xl bg-card p-4 ring-1 ring-border">
        <h2 className="text-sm font-bold">Recent bookings</h2>
        <div className="mt-3 space-y-2">
          {(data?.bookings ?? []).slice(0, 6).map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-2xl bg-surface px-3 py-2.5 text-xs"
            >
              <span className="font-medium">{b.services?.name ?? "Session"}</span>
              <span className="text-muted-foreground">
                {b.slots ? `${dateLabel(b.slots.starts_at)} · ${timeLabel(b.slots.starts_at)}` : "—"}
              </span>
              <span className="font-semibold">{b.status}</span>
            </div>
          ))}
          {!data?.bookings.length && (
            <p className="py-6 text-center text-xs text-muted-foreground">No bookings yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof IndianRupee;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl bg-card p-4 ring-1 ring-border">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-2 text-lg font-extrabold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
