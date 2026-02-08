import clsx from "clsx";

export function ProgressBar({
  current,
  total,
  className
}: {
  current: number;
  total: number;
  className?: string;
}) {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));
  return (
    <div className={clsx("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-mint-600">
        <span>Progress</span>
        <span>
          {current} / {total}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-mint-100">
        <div
          className="h-2 rounded-full bg-navy transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
