import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DisasterReliefProvider } from "@/context/DisasterReliefContext";
import { LanguageProvider } from "@/context/LanguageContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kurukshetra PS20: Agentic Disaster Relief System",
  description: "Autonomous agentic emergency management platform powered by Groq LPU Sentinel and Google Gemini Strategist.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-red-500 selection:text-white`}>
        <LanguageProvider>
          <DisasterReliefProvider>
            {children}
          </DisasterReliefProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
