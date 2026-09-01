import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyProvider } from "./dashboard";
import { dateLabel, timeLabel } from "@/lib/oneslot";

export const Route = createFileRoute("/dashboard/slots")({
  component: SlotsPage,
});

type SlotRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  booked_count: number;
  services: { name: string } | null;
};

function SlotsPage() {
  const { provider } = useMyProvider();
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("07:00");
  const [duration, setDuration] = useState(60);
  const [capacity, setCapacity] = useState(10);

  const { data: services = [] } = useQuery({
    queryKey: ["dash-services-min", provider?.id],
    enabled: !!provider,
    queryFn: async () => {
      const { data } = await supabase
        .from("services")
        .select("id, name")
        .eq("provider_id", provider!.id)
        .order("name");
      return data ?? [];
    },
  });

  const { data: slots = [], refetch } = useQuery({
    queryKey: ["dash-slots", provider?.id],
    enabled: !!provider,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("slots")
        .select("id, starts_at, ends_at, capacity, booked_count, services(name)")
        .eq("provider_id", provider!.id)
        .gte("starts_at", new Date(Date.now() - 864e5).toISOString())
        .order("starts_at");
      if (error) throw error;
      return data as unknown as SlotRow[];
    },
  });

  async function addSlot() {
    if (!provider) return;
    const sid = serviceId || services[0]?.id;
    if (!sid) { toast.error("Create a service first"); return; }
    const start = new Date(`${date}T${time}:00`);
    const { error } = await supabase.from("slots").insert({
      provider_id: provider.id,
      service_id: sid,
      starts_at: start.toISOString(),
      ends_at: new Date(start.getTime() + duration * 60000).toISOString(),
      capacity,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Slot added");
    void refetch();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("slots").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Slot removed");
    void refetch();
  }

  const grouped = slots.reduce<Record<string, SlotRow[]>>((acc, s) => {
    const k = s.starts_at.slice(0, 10);
    (acc[k] ||= []).push(s);
    return acc;
  }, {});

  const field = "w-full rounded-2xl bg-surface px-3 py-2.5 text-sm outline-none";

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-card p-4 ring-1 ring-border">
        <h2 className="text-sm font-bold">Add a slot</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className={field}
          >
            <option value="">Service…</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={field} />
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className={field}
            placeholder="Mins"
          />
          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className={field}
            placeholder="Capacity"
          />
        </div>
        <button
          onClick={() => void addSlot()}
          className="mt-3 w-full rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground sm:w-auto sm:px-6"
        >
          Add slot
        </button>
      </section>

      {Object.entries(grouped).map(([day, list]) => (
        <section key={day} className="rounded-3xl bg-card p-4 ring-1 ring-border">
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {dateLabel(day)}
          </h3>
          <div className="mt-3 space-y-2">
            {list.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-2xl bg-surface px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-semibold">{timeLabel(s.starts_at)}</p>
                  <p className="text-[11px] text-muted-foreground">{s.services?.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {s.booked_count}/{s.capacity} booked
                  </span>
                  <button onClick={() => void remove(s.id)} className="text-muted-foreground">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
      {!slots.length && (
        <p className="py-10 text-center text-xs text-muted-foreground">No slots scheduled.</p>
      )}
    </div>
  );
}
