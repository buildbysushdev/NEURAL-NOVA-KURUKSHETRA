import type { Metadata } from "next";
import "./globals.css";
import { DisasterReliefProvider } from "@/context/DisasterReliefContext";
import { LanguageProvider } from "@/context/LanguageContext";

export const metadata: Metadata = {
  title: "Kurukshetra PS20: Agentic Disaster Relief",
  description: "Unified agentic disaster relief management platform for Citizens, Rescue Teams, and Authorities powered by Groq and Gemini.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-red-500 selection:text-white">
        <LanguageProvider>
          <DisasterReliefProvider>
            {children}
          </DisasterReliefProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
