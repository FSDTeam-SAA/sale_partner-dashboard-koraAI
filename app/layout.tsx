import type { Metadata } from "next";
import "./globals.css";
import "./novya.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "NOVYA · Sales Partner",
  description: "Your commercial work, connected. NOVYA Sales Partner workspace.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#050d1a] text-gray-200">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
