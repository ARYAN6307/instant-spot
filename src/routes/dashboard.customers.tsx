import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyProvider } from "./dashboard";
import { rupees } from "@/lib/oneslot";

export const Route = createFileRoute("/dashboard/customers")({
  component: CustomersPage,
});

type Row = {
  user_id: string;
  amount: number;
  status: string;
  profiles: { full_name: string | null; phone: string | null } | null;
};

function CustomersPage() {
  const { provider } = useMyProvider();

  const { data = [] } = useQuery({
    queryKey: ["dash-customers", provider?.id],
    enabled: !!provider,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("user_id, amount, status, profiles(full_name, phone)")
        .eq("provider_id", provider!.id);
      if (error) throw error;
      return data as unknown as Row[];
    },
  });

  const customers = Object.values(
    data.reduce<Record<string, { name: string; phone: string; visits: number; spend: number }>>(
      (acc, b) => {
        const e = (acc[b.user_id] ||= {
          name: b.profiles?.full_name || "Customer",
          phone: b.profiles?.phone || "—",
          visits: 0,
          spend: 0,
        });
        if (b.status !== "cancelled") {
          e.visits += 1;
          e.spend += b.amount;
        }
        return acc;
      },
      {},
    ),
  ).sort((a, b) => b.spend - a.spend);

  return (
    <div className="space-y-2">
      {customers.map((c) => (
        <div
          key={c.phone + c.name}
          className="flex items-center justify-between rounded-3xl bg-card p-4 ring-1 ring-border"
        >
          <div>
            <p className="text-sm font-semibold">{c.name}</p>
            <p className="text-[11px] text-muted-foreground">{c.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">{rupees(c.spend)}</p>
            <p className="text-[11px] text-muted-foreground">{c.visits} visits</p>
          </div>
        </div>
      ))}
      {!customers.length && (
        <p className="py-16 text-center text-xs text-muted-foreground">No customers yet.</p>
      )}
    </div>
  );
}
