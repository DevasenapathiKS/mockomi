import type { ReactNode } from "react";

import { RoleShell } from "@/src/components/layout/RoleShell";

export default function InterviewerGroupLayout({ children }: { children: ReactNode }) {
  return (
    <RoleShell
      roleLabel="Interviewer"
      requiredRole="interviewer"
      navItems={[
        { href: "/interviewer", label: "Dashboard" },
        { href: "/interviewer/availability", label: "Availability" },
        { href: "/interviewer/sessions", label: "Sessions" },
        { href: "/interviewer/earnings", label: "Earnings" },
      ]}
    >
      {children}
    </RoleShell>
  );
}

