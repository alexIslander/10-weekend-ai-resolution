import { env } from "@/lib/env";

export const getBaseUrl = () => {
  if (env.NEXT_PUBLIC_BASE_URL) return env.NEXT_PUBLIC_BASE_URL;
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
};
