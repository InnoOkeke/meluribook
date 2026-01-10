/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0EA5A4', // Deep Cyan (Light Mode Action)
          dark: '#2DD4BF',    // Mint Blue (Dark Mode Action)
          foreground: '#FFFFFF',
          'foreground-dark': '#042F2E',
        },
        secondary: {
          DEFAULT: '#38BDF8', // Soft Blue
        },
        accent: {
          DEFAULT: '#2DD4BF', // Mint Blue
        },
        success: '#22C55E',
        warning: '#FACC15',
        error: '#EF4444',
        dark: {
          bg: '#020617',     // Slate 950
          surface: '#020617', // Match bg per user request (rely on borders)
          text: '#E5E7EB',    // Gray 200
          textSecondary: '#94A3B8', // Slate 400
          textMuted: '#64748B',     // Slate 500
          border: '#1E293B',        // Slate 800
        },
        light: {
          bg: '#F8FAFC',    // Slate 50
          surface: '#FFFFFF',
          text: '#0F172A',  // Slate 900
          textSecondary: '#475569', // Slate 600
          textMuted: '#94A3B8',     // Slate 400
          border: '#E2E8F0',        // Slate 200
        }
      },
    },
  },
  plugins: [],
}
