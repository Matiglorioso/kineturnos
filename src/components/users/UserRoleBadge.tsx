import { Badge } from "@/components/ui/badge";
import { getRoleLabel } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/types";

const ROLE_STYLES: Record<AppUser["role"], string> = {
  superadmin: "border-violet-200 bg-violet-50 text-violet-700",
  admin: "border-brand-200 bg-brand-50 text-brand-700",
  profesional: "border-sky-200 bg-sky-50 text-sky-700",
};

export function UserRoleBadge({ role, className }: { role: AppUser["role"]; className?: string }) {
  return (
    <Badge variant="outline" className={cn("py-1", ROLE_STYLES[role], className)}>
      {getRoleLabel(role)}
    </Badge>
  );
}
