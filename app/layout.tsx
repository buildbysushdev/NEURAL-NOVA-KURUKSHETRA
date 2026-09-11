import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Public_Sans } from "next/font/google";
import "./globals.css";
import { DisasterReliefProvider } from "@/context/DisasterReliefContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "sonner";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-mono",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-public-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kurukshetra PS20: Agentic Disaster Relief System",
  description: "Autonomous agentic emergency response system for Citizens, Rescue Squads, and Authorities powered by Groq LPU Sentinel and Google Gemini Strategist.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} ${publicSans.variable}`}
    >
      <body className="min-h-screen antialiased bg-[#12161C] text-[#F6F4EF] font-ibm-sans selection:bg-[#791F1F] selection:text-white">
        <ErrorBoundary>
          <LanguageProvider>
            <DisasterReliefProvider>
              {children}
              <Toaster
                position="top-right"
                duration={4000}
                theme="dark"
                toastOptions={{
                  style: {
                    background: "#181E26",
                    border: "1px solid #222933",
                    color: "#F6F4EF",
                    fontFamily: "var(--font-ibm-sans)",
                    fontSize: "13px",
                    borderRadius: "2px",
                  },
                }}
              />
            </DisasterReliefProvider>
          </LanguageProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
