import { Link } from "@tanstack/react-router";
import { MapPin, Star } from "lucide-react";
import { categoryLabel, rupees, type Provider } from "@/lib/oneslot";
import { cn } from "@/lib/utils";

export function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-semibold">
      <Star className="h-3 w-3 fill-primary text-primary" />
      {Number(value) > 0 ? Number(value).toFixed(1) : "New"}
      {count ? <span className="font-normal text-muted-foreground">({count})</span> : null}
    </span>
  );
}

export function ProviderCard({
  provider,
  className,
  wide,
}: {
  provider: Provider;
  className?: string;
  wide?: boolean;
}) {
  return (
    <Link
      to="/provider/$id"
      params={{ id: provider.id }}
      className={cn(
        "group block overflow-hidden rounded-3xl bg-card ring-1 ring-border transition-transform active:scale-[0.98]",
        wide ? "w-full" : "w-[74vw] max-w-[280px]",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
        {provider.cover_url && (
          <img
            src={provider.cover_url}
            alt={provider.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide backdrop-blur">
          {categoryLabel(provider.category)}
        </span>
      </div>
      <div className="space-y-1.5 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-[15px] font-semibold">{provider.name}</h3>
          <Rating value={Number(provider.rating)} count={provider.rating_count} />
        </div>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> {provider.area}, {provider.city}
        </p>
        <p className="pt-0.5 text-xs text-muted-foreground">
          From <span className="font-semibold text-foreground">{rupees(provider.price_from)}</span>
          /month
        </p>
      </div>
    </Link>
  );
}
