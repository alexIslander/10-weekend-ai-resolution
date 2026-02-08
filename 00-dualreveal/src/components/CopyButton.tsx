"use client";

import { useState } from "react";

export function CopyButton({
  text,
  label = "Copy"
}: {
  text: string;
  label?: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 1800);
    } catch (error) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 1800);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="btn-secondary"
      aria-live="polite"
    >
      {status === "copied" ? "Copied" : status === "error" ? "Copy failed" : label}
    </button>
  );
}
