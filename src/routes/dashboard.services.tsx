import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyProvider } from "./dashboard";
import { rupees } from "@/lib/oneslot";

export const Route = createFileRoute("/dashboard/services")({
  component: ServicesPage,
});

function ServicesPage() {
  const { provider } = useMyProvider();
  const [svc, setSvc] = useState({ name: "", price: 500, duration_mins: 60, description: "" });
  const [plan, setPlan] = useState({ name: "", price: 3000, sessions: 12, validity_days: 30 });

  const { data: services = [], refetch: refetchServices } = useQuery({
    queryKey: ["dash-services", provider?.id],
    enabled: !!provider,
    queryFn: async () => {
      const { data } = await supabase
        .from("services")
        .select("*")
        .eq("provider_id", provider!.id)
        .order("created_at");
      return data ?? [];
    },
  });

  const { data: plans = [], refetch: refetchPlans } = useQuery({
    queryKey: ["dash-plans", provider?.id],
    enabled: !!provider,
    queryFn: async () => {
      const { data } = await supabase
        .from("plans")
        .select("*")
        .eq("provider_id", provider!.id)
        .order("price");
      return data ?? [];
    },
  });

  async function addService() {
    if (!provider || !svc.name) return toast.error("Service name is required");
    const { error } = await supabase.from("services").insert({ ...svc, provider_id: provider.id });
    if (error) return toast.error(error.message);
    setSvc({ name: "", price: 500, duration_mins: 60, description: "" });
    toast.success("Service added");
    void refetchServices();
  }

  async function addPlan() {
    if (!provider || !plan.name) return toast.error("Pass name is required");
    const { error } = await supabase.from("plans").insert({ ...plan, provider_id: provider.id });
    if (error) return toast.error(error.message);
    setPlan({ name: "", price: 3000, sessions: 12, validity_days: 30 });
    toast.success("Pass added");
    void refetchPlans();
  }

  async function del(table: "services" | "plans", id: string) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    table === "services" ? void refetchServices() : void refetchPlans();
  }

  const field = "w-full rounded-2xl bg-surface px-3 py-2.5 text-sm outline-none";

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <section className="rounded-3xl bg-card p-4 ring-1 ring-border">
        <h2 className="text-sm font-bold">Services</h2>
        <div className="mt-3 space-y-2">
          {services.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-2xl bg-surface px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{s.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {s.duration_mins} mins · {rupees(s.price)}
                </p>
              </div>
              <button onClick={() => void del("services", s.id)} className="text-muted-foreground">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {!services.length && (
            <p className="py-4 text-center text-xs text-muted-foreground">No services yet.</p>
          )}
        </div>
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          <input
            className={field}
            placeholder="Service name"
            value={svc.name}
            onChange={(e) => setSvc({ ...svc, name: e.target.value })}
          />
          <input
            className={field}
            placeholder="Short description"
            value={svc.description}
            onChange={(e) => setSvc({ ...svc, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className={field}
              type="number"
              placeholder="Price"
              value={svc.price}
              onChange={(e) => setSvc({ ...svc, price: Number(e.target.value) })}
            />
            <input
              className={field}
              type="number"
              placeholder="Minutes"
              value={svc.duration_mins}
              onChange={(e) => setSvc({ ...svc, duration_mins: Number(e.target.value) })}
            />
          </div>
          <button
            onClick={() => void addService()}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground"
          >
            Add service
          </button>
        </div>
      </section>

      <section className="rounded-3xl bg-card p-4 ring-1 ring-border">
        <h2 className="text-sm font-bold">Session passes</h2>
        <div className="mt-3 space-y-2">
          {plans.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-2xl bg-surface px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {p.sessions} sessions · {p.validity_days} days · {rupees(p.price)}
                </p>
              </div>
              <button onClick={() => void del("plans", p.id)} className="text-muted-foreground">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {!plans.length && (
            <p className="py-4 text-center text-xs text-muted-foreground">No passes yet.</p>
          )}
        </div>
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          <input
            className={field}
            placeholder="Pass name"
            value={plan.name}
            onChange={(e) => setPlan({ ...plan, name: e.target.value })}
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              className={field}
              type="number"
              placeholder="Price"
              value={plan.price}
              onChange={(e) => setPlan({ ...plan, price: Number(e.target.value) })}
            />
            <input
              className={field}
              type="number"
              placeholder="Sessions"
              value={plan.sessions}
              onChange={(e) => setPlan({ ...plan, sessions: Number(e.target.value) })}
            />
            <input
              className={field}
              type="number"
              placeholder="Validity"
              value={plan.validity_days}
              onChange={(e) => setPlan({ ...plan, validity_days: Number(e.target.value) })}
            />
          </div>
          <button
            onClick={() => void addPlan()}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground"
          >
            Add pass
          </button>
        </div>
      </section>
    </div>
  );
}
