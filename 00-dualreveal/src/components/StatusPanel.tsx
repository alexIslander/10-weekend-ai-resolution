import clsx from "clsx";

export function StatusPanel({
  title,
  description,
  tone = "neutral",
  action
}: {
  title: string;
  description: string;
  tone?: "neutral" | "success" | "warning";
  action?: React.ReactNode;
}) {
  const toneClasses = {
    neutral: "border-mint-200 bg-white/85",
    success: "border-mint-300 bg-mint-100/70",
    warning: "border-blush/60 bg-blush/20"
  };

  return (
    <div
      className={clsx(
        "rounded-2xl border px-5 py-4 text-sm text-navy",
        toneClasses[tone]
      )}
    >
      <div className="space-y-2">
        <p className="text-base font-semibold">{title}</p>
        <p className="text-sm text-navy/70">{description}</p>
        {action ? <div className="pt-2">{action}</div> : null}
      </div>
    </div>
  );
}
