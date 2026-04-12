import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const THEMES = [
  {
    id: "control-room",
    name: "Developer Control Room",
    description: "Dark, technical, and focused for live interview coding.",
  },
  {
    id: "clean-saas",
    name: "Clean SaaS Professional",
    description: "Bright, clean layout with enterprise dashboard feel.",
  },
  {
    id: "dual-tone",
    name: "Dual Theme Interview Mode",
    description: "Balanced neutral style for long interview sessions.",
  },
];

const ThemeContext = createContext(null);

const DEFAULT_THEME = "control-room";

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || DEFAULT_THEME);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      themes: THEMES,
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
