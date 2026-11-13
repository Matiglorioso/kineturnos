import { fetchJson } from "@/lib/api/fetch-json";
import type { AuditLogItem } from "@/types";

export function fetchAuditLog(days: number): Promise<{ items: AuditLogItem[]; truncated: boolean }> {
  return fetchJson(`/api/auditoria?dias=${days}`);
}
