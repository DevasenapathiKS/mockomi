import type { ReactNode } from "react";

import { RoleShell } from "@/src/components/layout/RoleShell";

export default function CandidateGroupLayout({ children }: { children: ReactNode }) {
  return (
    <RoleShell
      roleLabel="Candidate"
      requiredRole="candidate"
      navItems={[
        { href: "/candidate", label: "Dashboard" },
        { href: "/candidate/discover", label: "Discover" },
        { href: "/candidate/sessions", label: "Sessions" },
        { href: "/candidate/progress", label: "Progress" },
        { href: "/candidate/apply-interviewer", label: "Apply" },
      ]}
    >
      {children}
    </RoleShell>
  );
}

