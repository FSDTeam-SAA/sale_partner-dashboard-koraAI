import {Suspense} from "react";
import {AuthShell} from "@/components/novya/auth";
export default function Layout({children}:{children:React.ReactNode}){return <AuthShell><Suspense fallback={<p>Loading?</p>}>{children}</Suspense></AuthShell>;}
