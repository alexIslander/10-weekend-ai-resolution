import { APP_CONFIG } from "@/lib/config";

export const retentionCutoffIso = () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - APP_CONFIG.dataRetentionDays);
  return cutoff.toISOString();
};
