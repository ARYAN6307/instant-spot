import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMyProvider } from "./dashboard";
import { CATEGORIES, CITIES, type Category } from "@/lib/oneslot";

export const Route = createFileRoute("/dashboard/listing")({
  component: ListingPage,
});

function ListingPage() {
  const { user } = useAuth();
  const { provider, refetch } = useMyProvider();
  const [form, setForm] = useState({
    name: "",
    category: "gym" as Category,
    description: "",
    address: "",
    area: "",
    city: "Bengaluru",
    phone: "",
    cover_url: "",
    price_from: 999,
    is_active: true,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (provider) {
      setForm({
        name: provider.name,
        category: provider.category,
        description: provider.description ?? "",
        address: provider.address ?? "",
        area: provider.area,
        city: provider.city,
        phone: provider.phone ?? "",
        cover_url: provider.cover_url ?? "",
        price_from: provider.price_from,
        is_active: provider.is_active,
      });
    }
  }, [provider]);

  async function save() {
    if (!user) return;
    if (!form.name || !form.area) {
      toast.error("Business name and area are required");
      return;
    }
    setBusy(true);
    const payload = { ...form, owner_id: user.id };
    const { error } = provider
      ? await supabase.from("providers").update(payload).eq("id", provider.id)
      : await supabase.from("providers").insert(payload);
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success(provider ? "Listing updated" : "Listing created");
      refetch();
    }
  }

  const field = "mt-1.5 w-full rounded-2xl bg-surface px-4 py-3 text-sm outline-none";
  const label = "mt-4 block text-xs font-medium text-muted-foreground first:mt-0";

  return (
    <div className="mx-auto max-w-xl rounded-3xl bg-card p-5 ring-1 ring-border">
      <h1 className="text-lg font-bold">{provider ? "Edit listing" : "Create your listing"}</h1>

      <label className={label}>Business name</label>
      <input
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className={field}
      />

      <label className={label}>Category</label>
      <select
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
        className={field}
      >
        {CATEGORIES.map((c) => (
          <option key={c.key} value={c.key}>
            {c.label}
          </option>
        ))}
      </select>

      <label className={label}>Description</label>
      <textarea
        rows={3}
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className={field}
      />

      <label className={label}>Address</label>
      <input
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
        className={field}
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Area / locality</label>
          <input
            value={form.area}
            onChange={(e) => setForm({ ...form, area: e.target.value })}
            className={field}
          />
        </div>
        <div>
          <label className={label}>City</label>
          <select
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className={field}
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Phone</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={field}
          />
        </div>
        <div>
          <label className={label}>Starting price (₹/month)</label>
          <input
            type="number"
            value={form.price_from}
            onChange={(e) => setForm({ ...form, price_from: Number(e.target.value) })}
            className={field}
          />
        </div>
      </div>

      <label className={label}>Cover image URL</label>
      <input
        value={form.cover_url}
        onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
        placeholder="https://…"
        className={field}
      />

      <label className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
        />
        Listing is live and visible to customers
      </label>

      <button
        disabled={busy}
        onClick={() => void save()}
        className="mt-5 w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground"
      >
        {provider ? "Save changes" : "Publish listing"}
      </button>
    </div>
  );
}
