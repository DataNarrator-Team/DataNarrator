"use client";

import { useState, useEffect } from "react";

export type ThemeMode = "light" | "dark";

export const STORAGE_KEY_THEME = "datanarrator_theme_mode";
export const EVENT_THEME_CHANGED = "datanarrator_theme_changed";

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(STORAGE_KEY_THEME);
    if (stored === "dark" || stored === "light") {
      return stored;
    }
    // Check system preference if user hasn't set one yet
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  } catch (e) {
    // ignore localStorage errors in privacy mode
  }
  return "light";
}

export function applyTheme(mode: ThemeMode): void {
  if (typeof window === "undefined") return;
  try {
    const root = document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(STORAGE_KEY_THEME, mode);
    window.dispatchEvent(new Event(EVENT_THEME_CHANGED));
  } catch (e) {
    // ignore
  }
}

export function toggleTheme(): ThemeMode {
  const current = getStoredTheme();
  const next: ThemeMode = current === "light" ? "dark" : "light";
  applyTheme(next);
  return next;
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>("light");

  useEffect(() => {
    // Initialize from storage or DOM
    const current = getStoredTheme();
    setThemeState(current);
    applyTheme(current);

    const handleThemeChange = () => {
      setThemeState(getStoredTheme());
    };

    window.addEventListener(EVENT_THEME_CHANGED, handleThemeChange);
    window.addEventListener("storage", handleThemeChange);

    return () => {
      window.removeEventListener(EVENT_THEME_CHANGED, handleThemeChange);
      window.removeEventListener("storage", handleThemeChange);
    };
  }, []);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    applyTheme(mode);
  };

  const handleToggle = () => {
    const next = toggleTheme();
    setThemeState(next);
  };

  return {
    theme,
    isDark: theme === "dark",
    setTheme,
    toggleTheme: handleToggle,
  };
}

