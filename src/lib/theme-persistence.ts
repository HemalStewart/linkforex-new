export const THEME_STORAGE_KEY = "nextjs-ui-theme";
export const THEME_SNAPSHOT_STORAGE_KEY = "linkforex-theme-snapshot";
export const THEME_CUSTOMIZER_STORAGE_KEY = "linkforex-theme-customizer";

export type ThemeCustomizerState = {
  selectedTheme: string;
  selectedTweakcnTheme: string;
  selectedRadius: string;
};

export const defaultThemeCustomizerState: ThemeCustomizerState = {
  selectedTheme: "",
  selectedTweakcnTheme: "",
  selectedRadius: "0.5rem",
};
