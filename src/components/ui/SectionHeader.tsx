import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  label?: string;
  title: string;
  description?: string;
  badge?: string;
  className?: string;
  dark?: boolean;
};

export function SectionHeader({
  label,
  title,
  description,
  badge,
  className,
  dark = false,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        {label ? (
          <p
            className={cn(
              "text-sm font-medium uppercase tracking-[0.3em]",
              dark ? "text-orange-200" : "text-orange-600"
            )}
          >
            {label}
          </p>
        ) : null}
        <h2
          className={cn(
            "font-bold tracking-tight",
            label ? "mt-2" : "",
            dark ? "text-2xl text-white sm:text-3xl" : "text-2xl text-gray-900 sm:text-3xl"
          )}
        >
          {title}
        </h2>
        {description ? (
          <p className={cn("mt-2 max-w-2xl text-sm sm:text-base", dark ? "text-white/80" : "text-gray-600")}>
            {description}
          </p>
        ) : null}
      </div>
      {badge ? (
        <span className="rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1 text-sm font-bold text-orange-600">
          {badge}
        </span>
      ) : null}
    </div>
  );
}
