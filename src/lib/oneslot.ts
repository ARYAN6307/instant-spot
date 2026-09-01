import type { Database } from "@/integrations/supabase/types";

export type Category = Database["public"]["Enums"]["provider_category"];
export type Provider = Database["public"]["Tables"]["providers"]["Row"];
export type Service = Database["public"]["Tables"]["services"]["Row"];
export type Plan = Database["public"]["Tables"]["plans"]["Row"];
export type Slot = Database["public"]["Tables"]["slots"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];

export const CATEGORIES: { key: Category; label: string; emoji: string }[] = [
  { key: "gym", label: "Gyms", emoji: "🏋️" },
  { key: "salon", label: "Salons", emoji: "💇" },
  { key: "tuition", label: "Tuition", emoji: "📚" },
  { key: "sports", label: "Sports", emoji: "🏸" },
  { key: "dance_yoga", label: "Dance & Yoga", emoji: "🧘" },
];

export const CITIES = ["Bengaluru", "Mumbai", "Delhi NCR", "Hyderabad", "Pune"];

export function categoryLabel(c: Category) {
  return CATEGORIES.find((x) => x.key === c)?.label ?? c;
}

export function rupees(n: number | null | undefined) {
  return "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n ?? 0));
}

export function dayLabel(d: Date) {
  const today = new Date();
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.round((d.getTime() - t.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString("en-IN", { weekday: "short" });
}

export function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function phoneToEmail(phone: string) {
  return `p${phone.replace(/\D/g, "")}@oneslot.app`;
}

/** Deterministic mock-OTP derived credential — real auth records, mocked delivery. */
export function phoneToPassword(phone: string) {
  return `oneslot-${phone.replace(/\D/g, "")}-otp`;
}
