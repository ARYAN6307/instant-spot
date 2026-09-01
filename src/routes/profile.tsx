import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LayoutDashboard, LogOut, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { CITIES } from "@/lib/oneslot";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My profile — OneSlot" },
      {
        name: "description",
        content: "Manage your OneSlot profile, city preference and switch to the provider dashboard.",
      },
      { property: "og:title", content: "My profile — OneSlot" },
      { property: "og:description", content: "Your details, city and account settings." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, role, loading, refresh, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name ?? "");
      setCity(profile.city ?? "Bengaluru");
    }
  }, [profile]);

  if (!loading && !user) {
    return (
      <AppShell>
        <div className="mt-24 text-center">
          <p className="text-sm text-muted-foreground">Sign in to manage your profile.</p>
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

  async function save() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: name, city });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Profile saved");
      await refresh();
    }
  }

  async function becomeProvider() {
    if (!user) return;
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: user.id, role: "provider" });
    if (error && !error.message.includes("duplicate")) {
      toast.error(error.message);
      return;
    }
    await refresh();
    toast.success("Provider access unlocked");
    void navigate({ to: "/dashboard" });
  }

  return (
    <AppShell>
      <h1 className="pt-5 text-2xl font-extrabold tracking-tight">Profile</h1>

      <div className="mt-5 rounded-3xl bg-card p-4 ring-1 ring-border">
        <label className="text-xs font-medium text-muted-foreground">Full name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1.5 w-full rounded-2xl bg-surface px-4 py-3 text-sm outline-none"
        />
        <label className="mt-4 block text-xs font-medium text-muted-foreground">Mobile</label>
        <input
          value={profile?.phone ?? ""}
          readOnly
          className="mt-1.5 w-full rounded-2xl bg-surface px-4 py-3 text-sm text-muted-foreground outline-none"
        />
        <label className="mt-4 block text-xs font-medium text-muted-foreground">City</label>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="mt-1.5 w-full rounded-2xl bg-surface px-4 py-3 text-sm outline-none"
        >
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          disabled={busy}
          onClick={() => void save()}
          className="mt-4 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground"
        >
          Save changes
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-3xl bg-card ring-1 ring-border">
        {role === "provider" ? (
          <Link to="/dashboard" className="flex items-center gap-3 p-4">
            <LayoutDashboard className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Provider dashboard</span>
          </Link>
        ) : (
          <button onClick={() => void becomeProvider()} className="flex w-full items-center gap-3 p-4">
            <Store className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">List my business on OneSlot</span>
          </button>
        )}
        <button
          onClick={() => {
            void signOut();
            toast.success("Signed out");
          }}
          className="flex w-full items-center gap-3 border-t border-border p-4 text-muted-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-semibold">Sign out</span>
        </button>
      </div>
      <div className="h-10" />
    </AppShell>
  );
}
