import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, Clock, MapPin, Phone, Star, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/AppShell";
import { Rating } from "@/components/ProviderCard";
import { useAuth } from "@/hooks/useAuth";
import {
  categoryLabel,
  dayLabel,
  rupees,
  timeLabel,
  type Plan,
  type Provider,
  type Review,
  type Service,
  type Slot,
  type Subscription,
} from "@/lib/oneslot";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/provider/$id")({
  head: () => ({
    meta: [
      { title: "Provider details — OneSlot" },
      {
        name: "description",
        content:
          "See slots, session passes, services and reviews for this local business, and book your next session on OneSlot.",
      },
      { property: "og:title", content: "Book your next session — OneSlot" },
      {
        property: "og:description",
        content: "Live availability, membership packs and verified reviews.",
      },
    ],
  }),
  component: ProviderPage,
});

type Tab = "slots" | "plans" | "reviews";

function ProviderPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("slots");
  const [dayIndex, setDayIndex] = useState(0);

  const { data: provider } = useQuery({
    queryKey: ["provider", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("providers").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Provider;
    },
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("provider_id", id)
        .eq("is_active", true)
        .order("price");
      if (error) throw error;
      return data as Service[];
    },
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["plans", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("provider_id", id)
        .eq("is_active", true)
        .order("price");
      if (error) throw error;
      return data as Plan[];
    },
  });

  const { data: slots = [] } = useQuery({
    queryKey: ["slots", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("slots")
        .select("*")
        .eq("provider_id", id)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at");
      if (error) throw error;
      return data as Slot[];
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("provider_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Review[];
    },
  });

  const { data: subs = [] } = useQuery({
    queryKey: ["my-subs", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("provider_id", id)
        .eq("status", "active")
        .gt("sessions_remaining", 0)
        .gt("expires_at", new Date().toISOString());
      if (error) throw error;
      return data as Subscription[];
    },
  });

  const days = useMemo(() => {
    const set = new Map<string, Slot[]>();
    for (const s of slots) {
      const key = new Date(s.starts_at).toDateString();
      set.set(key, [...(set.get(key) ?? []), s]);
    }
    return [...set.entries()].map(([key, list]) => ({ date: new Date(key), slots: list }));
  }, [slots]);

  const book = useMutation({
    mutationFn: async ({ slotId, useSub }: { slotId: string; useSub: boolean }) => {
      const { data, error } = await supabase.rpc("book_slot", {
        p_slot_id: slotId,
        p_subscription_id: (useSub ? subs[0]?.id : undefined) as string | undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Booked! Payment confirmed (demo).");
      void qc.invalidateQueries({ queryKey: ["slots", id] });
      void qc.invalidateQueries({ queryKey: ["my-subs"] });
      void qc.invalidateQueries({ queryKey: ["bookings"] });
      void navigate({ to: "/bookings" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const buy = useMutation({
    mutationFn: async (plan: Plan) => {
      if (!user) throw new Error("Sign in first");
      const expires = new Date(Date.now() + plan.validity_days * 86400000).toISOString();
      const { error } = await supabase.from("subscriptions").insert({
        user_id: user.id,
        provider_id: id,
        plan_id: plan.id,
        sessions_total: plan.sessions,
        sessions_remaining: plan.sessions,
        amount_paid: plan.price,
        expires_at: expires,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment successful (demo). Membership activated!");
      void qc.invalidateQueries({ queryKey: ["my-subs"] });
      void qc.invalidateQueries({ queryKey: ["subscriptions"] });
      void navigate({ to: "/memberships" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!provider) {
    return (
      <div className="min-h-screen animate-pulse bg-background">
        <div className="h-64 bg-card" />
      </div>
    );
  }

  const activeDay = days[dayIndex];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="relative h-60 w-full overflow-hidden">
        {provider.cover_url && (
          <img src={provider.cover_url} alt={provider.name} className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/40" />
        <Link
          to="/search"
          className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-black/60 backdrop-blur"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>

      <div className="mx-auto -mt-10 w-full max-w-3xl px-4">
        <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide">
          {categoryLabel(provider.category)}
        </span>
        <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight">{provider.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <Rating value={Number(provider.rating)} count={provider.rating_count} />
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {provider.area}, {provider.city}
          </span>
          {provider.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" /> {provider.phone}
            </span>
          )}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{provider.description}</p>

        {subs.length > 0 && (
          <div className="mt-4 rounded-2xl bg-primary/10 p-3 text-xs ring-1 ring-primary/30">
            You have <b>{subs[0]!.sessions_remaining} sessions</b> left on your pass here — bookings
            use them automatically.
          </div>
        )}

        <div className="mt-5 flex gap-1 rounded-full bg-surface p-1">
          {(["slots", "plans", "reviews"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-full py-2 text-xs font-semibold capitalize",
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {t === "plans" ? "Passes" : t}
            </button>
          ))}
        </div>

        {tab === "slots" && (
          <section className="mt-5">
            {services.length > 0 && (
              <div className="mb-5 space-y-2">
                <h2 className="text-sm font-bold">Services</h2>
                {services.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-2xl bg-card p-3.5 ring-1 ring-border"
                  >
                    <div className="pr-3">
                      <p className="text-sm font-semibold">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.description}</p>
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" /> {s.duration_min} min
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold">{rupees(s.price)}</span>
                  </div>
                ))}
              </div>
            )}

            <h2 className="mb-2 text-sm font-bold">Pick a slot</h2>
            <div className="rail -mx-4 px-4">
              {days.map((d, i) => (
                <button
                  key={d.date.toISOString()}
                  onClick={() => setDayIndex(i)}
                  className={cn(
                    "min-w-[68px] rounded-2xl px-3 py-2 text-center ring-1 ring-border",
                    i === dayIndex ? "bg-primary text-primary-foreground ring-primary" : "bg-card",
                  )}
                >
                  <span className="block text-[10px] font-medium opacity-80">
                    {dayLabel(d.date)}
                  </span>
                  <span className="block text-sm font-bold">{d.date.getDate()}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {activeDay?.slots.map((s) => {
                const full = s.booked_count >= s.capacity;
                const service = services.find((x) => x.id === s.service_id);
                return (
                  <button
                    key={s.id}
                    disabled={full || book.isPending}
                    onClick={() => {
                      if (!user) {
                        toast.error("Sign in to book");
                        void navigate({ to: "/auth" });
                        return;
                      }
                      book.mutate({ slotId: s.id, useSub: subs.length > 0 });
                    }}
                    className={cn(
                      "rounded-2xl p-3 text-left ring-1 ring-border transition",
                      full ? "bg-surface opacity-40" : "bg-card hover:ring-primary",
                    )}
                  >
                    <p className="text-sm font-bold">{timeLabel(s.starts_at)}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {service?.name ?? "Session"}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {full ? "Full" : `${s.capacity - s.booked_count} left`}
                    </p>
                  </button>
                );
              })}
              {!activeDay?.slots.length && (
                <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                  No slots published for this day.
                </p>
              )}
            </div>
          </section>
        )}

        {tab === "plans" && (
          <section className="mt-5 space-y-3">
            {plans.map((p) => (
              <div key={p.id} className="rounded-3xl bg-card p-4 ring-1 ring-border">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      {p.sessions} sessions · valid {p.validity_days} days
                    </p>
                  </div>
                  <span className="text-lg font-extrabold">{rupees(p.price)}</span>
                </div>
                <button
                  disabled={buy.isPending}
                  onClick={() => {
                    if (!user) {
                      void navigate({ to: "/auth" });
                      return;
                    }
                    buy.mutate(p);
                  }}
                  className="mt-3 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Buy pass
                </button>
              </div>
            ))}
            {!plans.length && (
              <p className="py-8 text-center text-sm text-muted-foreground">No passes yet.</p>
            )}
          </section>
        )}

        {tab === "reviews" && (
          <ReviewsTab providerId={id} reviews={reviews} />
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function ReviewsTab({ providerId, reviews }: { providerId: string; reviews: Review[] }) {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to review");
      const { error } = await supabase.from("reviews").upsert(
        {
          user_id: user.id,
          provider_id: providerId,
          rating,
          comment,
          author_name: profile?.full_name ?? "OneSlot user",
        },
        { onConflict: "user_id,provider_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Thanks for the review!");
      setComment("");
      void qc.invalidateQueries({ queryKey: ["reviews", providerId] });
      void qc.invalidateQueries({ queryKey: ["provider", providerId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="mt-5 space-y-3">
      <div className="rounded-3xl bg-card p-4 ring-1 ring-border">
        <p className="text-sm font-bold">Rate this place</p>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)}>
              <Star
                className={cn(
                  "h-6 w-6",
                  n <= rating ? "fill-primary text-primary" : "text-muted-foreground",
                )}
              />
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="How was your experience?"
          className="mt-3 w-full rounded-2xl bg-surface p-3 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          disabled={submit.isPending}
          onClick={() => submit.mutate()}
          className="mt-2 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Post review
        </button>
      </div>

      {reviews.map((r) => (
        <div key={r.id} className="rounded-3xl bg-card p-4 ring-1 ring-border">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{r.author_name ?? "OneSlot user"}</p>
            <Rating value={r.rating} />
          </div>
          {r.comment && <p className="mt-1.5 text-sm text-muted-foreground">{r.comment}</p>}
        </div>
      ))}
      {!reviews.length && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No reviews yet — be the first.
        </p>
      )}
    </section>
  );
}
