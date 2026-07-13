const STORAGE_KEY = "dicekout.theme";
const DARK = "dark";
const LIGHT = "light";
export const BROWSER_THEME_COLORS = Object.freeze({ light: "#f4f4f4", dark: "#090a0c" });

export const getInitialTheme = () => {
  if (typeof window === "undefined") return LIGHT;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === DARK || saved === LIGHT) return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? DARK : LIGHT;
};

export const applyTheme = (theme) => {
  if (typeof document === "undefined") return;
  const value = theme === DARK ? DARK : LIGHT;
  document.documentElement.dataset.theme = value;
  document.body.dataset.theme = value;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content",
    BROWSER_THEME_COLORS[value],
  );
  window.localStorage.setItem(STORAGE_KEY, value);
};

export const toggleThemeValue = (theme) => (theme === DARK ? LIGHT : DARK);
