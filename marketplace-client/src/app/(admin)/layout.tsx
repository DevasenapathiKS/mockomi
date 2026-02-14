import type { ReactNode } from "react";

import { RoleShell } from "@/src/components/layout/RoleShell";

export default function AdminGroupLayout({ children }: { children: ReactNode }) {
  return (
    <RoleShell
      roleLabel="Admin"
      requiredRole="admin"
      navItems={[{ href: "/admin/dashboard", label: "Dashboard" }]}
    >
      {children}
    </RoleShell>
  );
}

