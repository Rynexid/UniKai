import { defineStore } from "pinia";
import { ref, watch } from "vue";

type Theme = "light" | "dark";

export const useThemeStore = defineStore("theme", () => {
  const stored = typeof window !== "undefined" ? localStorage.getItem("unikai-theme") : null;
  const theme = ref<Theme>(stored === "light" ? "light" : "dark");

  watch(
    theme,
    (value) => {
      localStorage.setItem("unikai-theme", value);
      document.documentElement.classList.toggle("dark", value === "dark");
    },
    { immediate: true },
  );

  function toggleTheme() {
    theme.value = theme.value === "light" ? "dark" : "light";
  }

  return { theme, toggleTheme };
});
