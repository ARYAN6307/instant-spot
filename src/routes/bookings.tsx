import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarX2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { dateLabel, rupees, timeLabel } from "@/lib/oneslot";

export const Route = createFileRoute("/bookings")({
  head: () => ({
    meta: [
      { title: "My bookings — OneSlot" },
      {
        name: "description",
        content: "Track upcoming and past sessions booked through OneSlot and cancel when plans change.",
      },
      { property: "og:title", content: "My bookings — OneSlot" },
      { property: "og:description", content: "Every session you booked, in one place." },
    ],
  }),
  component: BookingsPage,
});

type Row = {
  id: string;
  status: string;
  amount: number;
  subscription_id: string | null;
  slots: { starts_at: string; ends_at: string } | null;
  providers: { id: string; name: string; area: string; cover_url: string | null } | null;
  services: { name: string } | null;
};

function BookingsPage() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();

  const { data = [] } = useQuery({
    queryKey: ["bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          "id, status, amount, subscription_id, slots(starts_at, ends_at), providers(id, name, area, cover_url), services(name)",
        )
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Row[];
    },
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("cancel_booking", { p_booking_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Booking cancelled");
      void qc.invalidateQueries({ queryKey: ["bookings"] });
      void qc.invalidateQueries({ queryKey: ["subscriptions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!loading && !user) return <SignedOut />;

  const now = Date.now();
  const upcoming = data.filter(
    (b) => b.status !== "cancelled" && new Date(b.slots?.starts_at ?? 0).getTime() > now,
  );
  const past = data.filter(
    (b) => b.status === "cancelled" || new Date(b.slots?.starts_at ?? 0).getTime() <= now,
  );

  return (
    <AppShell>
      <h1 className="pt-5 text-2xl font-extrabold tracking-tight">My bookings</h1>

      <Section title="Upcoming" rows={upcoming} onCancel={(id) => cancel.mutate(id)} />
      <Section title="History" rows={past} />

      {!data.length && (
        <div className="mt-20 text-center">
          <CalendarX2 className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No bookings yet.</p>
          <Link
            to="/search"
            className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Explore places
          </Link>
        </div>
      )}
      <div className="h-10" />
    </AppShell>
  );
}

function Section({
  title,
  rows,
  onCancel,
}: {
  title: string;
  rows: Row[];
  onCancel?: (id: string) => void;
}) {
  if (!rows.length) return null;
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-sm font-bold text-muted-foreground">{title}</h2>
      <div className="space-y-3">
        {rows.map((b) => (
          <div key={b.id} className="overflow-hidden rounded-3xl bg-card ring-1 ring-border">
            <div className="flex gap-3 p-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-surface-2">
                {b.providers?.cover_url && (
                  <img
                    src={b.providers.cover_url}
                    alt={b.providers.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{b.providers?.name}</p>
                <p className="text-xs text-muted-foreground">{b.services?.name}</p>
                <p className="mt-1 text-xs">
                  {b.slots ? `${dateLabel(b.slots.starts_at)} · ${timeLabel(b.slots.starts_at)}` : ""}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {b.subscription_id ? "Paid with pass" : rupees(b.amount)} ·{" "}
                  <span
                    className={
                      b.status === "cancelled" ? "text-muted-foreground" : "text-primary font-semibold"
                    }
                  >
                    {b.status}
                  </span>
                </p>
              </div>
            </div>
            {onCancel && b.status === "confirmed" && (
              <button
                onClick={() => onCancel(b.id)}
                className="w-full border-t border-border py-2.5 text-xs font-semibold text-muted-foreground"
              >
                Cancel booking
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function SignedOut() {
  return (
    <AppShell>
      <div className="mt-24 text-center">
        <p className="text-sm text-muted-foreground">Sign in to see your bookings.</p>
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
