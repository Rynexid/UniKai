"use client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";
interface ThemeCtx {
  theme: Theme;
  toggleTheme: () => void;
}
const ThemeContext = createContext<ThemeCtx>({
  theme: "dark",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("unikai-theme") as Theme | null;
    if (stored === "light" || stored === "dark") setTheme(stored);
    else {
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(dark ? "dark" : "light");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("unikai-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = () =>
    setTheme((t) => (t === "light" ? "dark" : "light"));

  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
