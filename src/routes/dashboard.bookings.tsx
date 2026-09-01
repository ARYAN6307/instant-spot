import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMyProvider } from "./dashboard";
import { dateLabel, rupees, timeLabel } from "@/lib/oneslot";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/bookings")({
  component: BookingsPage,
});

type Row = {
  id: string;
  status: string;
  amount: number;
  created_at: string;
  slots: { starts_at: string; ends_at: string } | null;
  services: { name: string } | null;
  profiles: { full_name: string | null; phone: string | null } | null;
};

const FILTERS = ["all", "confirmed", "completed", "cancelled"] as const;

function BookingsPage() {
  const { provider } = useMyProvider();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const { data = [], refetch } = useQuery({
    queryKey: ["dash-bookings", provider?.id],
    enabled: !!provider,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          "id, status, amount, created_at, slots(starts_at, ends_at), services(name), profiles(full_name, phone)",
        )
        .eq("provider_id", provider!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Row[];
    },
  });

  async function mark(id: string, status: "completed" | "cancelled") {
    if (status === "cancelled") {
      const { error } = await supabase.rpc("cancel_booking", { p_booking_id: id });
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
      if (error) { toast.error(error.message); return; }
    }
    toast.success(`Booking ${status}`);
    void refetch();
  }

  const rows = data.filter((r) => filter === "all" || r.status === filter);

  return (
    <div>
      <div className="rail pb-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize ring-1 ring-border",
              filter === f ? "bg-primary text-primary-foreground ring-primary" : "bg-card",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {rows.map((b) => (
          <div key={b.id} className="rounded-3xl bg-card p-4 ring-1 ring-border">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {b.profiles?.full_name || b.profiles?.phone || "Customer"}
                </p>
                <p className="text-xs text-muted-foreground">{b.services?.name ?? "Session"}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {b.slots
                    ? `${dateLabel(b.slots.starts_at)} · ${timeLabel(b.slots.starts_at)}`
                    : "—"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{rupees(b.amount)}</p>
                <p
                  className={cn(
                    "text-[11px] capitalize",
                    b.status === "cancelled" ? "text-muted-foreground" : "text-primary",
                  )}
                >
                  {b.status}
                </p>
              </div>
            </div>
            {b.status === "confirmed" && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => void mark(b.id, "completed")}
                  className="flex-1 rounded-full bg-primary py-2 text-xs font-semibold text-primary-foreground"
                >
                  Mark attended
                </button>
                <button
                  onClick={() => void mark(b.id, "cancelled")}
                  className="flex-1 rounded-full bg-surface py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}
        {!rows.length && (
          <p className="py-16 text-center text-xs text-muted-foreground">No bookings here.</p>
        )}
      </div>
    </div>
  );
}
