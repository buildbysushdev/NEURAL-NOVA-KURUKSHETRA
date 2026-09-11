/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "#791F1F",
          foreground: "#F6F4EF",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Strict Design System:
        authority: {
          base: "#12161C",
          text: "#F6F4EF",
          card: "#181E26",
          border: "#222933",
          muted: "#8A99AD",
        },
        citizen: {
          base: "#F6F4EF",
          text: "#1A1A1A",
          card: "#FFFFFF",
          border: "#DED9CE",
          muted: "#6B655B",
        },
        severity: {
          safe: "#3B6D11",
          watch: "#854F0B",
          critical: "#791F1F",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        "ibm-sans": ["var(--font-ibm-sans)", "sans-serif"],
        "ibm-mono": ["var(--font-ibm-mono)", "monospace"],
        "public-sans": ["var(--font-public-sans)", "sans-serif"],
        sans: ["var(--font-ibm-sans)", "var(--font-public-sans)", "sans-serif"],
        mono: ["var(--font-ibm-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
