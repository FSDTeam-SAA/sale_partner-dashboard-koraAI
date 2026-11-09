import {NovyaShell} from "@/components/novya/shell";
import { AuthSessionGate } from "@/components/auth-session-gate";
import {Suspense} from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthSessionGate>
      <Suspense fallback={<div className="nv-loading">Loading your work…</div>}><NovyaShell>{children}</NovyaShell></Suspense>
    </AuthSessionGate>
  );
}
