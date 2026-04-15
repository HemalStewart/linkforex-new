import type { Metadata } from "next";
import "./globals.css";

import { ApiAuthBridge } from "@/components/api-auth-bridge";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarConfigProvider } from "@/contexts/sidebar-context";
import { inter } from "@/lib/fonts";
import {
  THEME_CUSTOMIZER_STORAGE_KEY,
  THEME_SNAPSHOT_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from "@/lib/theme-persistence";

export const metadata: Metadata = {
  title: "LinkForex",
  description: "LinkForex new admin UI",
  icons: {
    icon: "/logo-removebg-preview.png",
    shortcut: "/logo-removebg-preview.png",
    apple: "/logo-removebg-preview.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeBootstrapScript = `
    (function() {
      try {
        var root = document.documentElement;
        var storedTheme = localStorage.getItem('${THEME_STORAGE_KEY}') || 'system';
        root.classList.remove('light', 'dark');
        var resolvedTheme = storedTheme === 'system'
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : storedTheme;
        root.classList.add(resolvedTheme);

        var rawCustomizer = localStorage.getItem('${THEME_CUSTOMIZER_STORAGE_KEY}');
        if (rawCustomizer) {
          try {
            var customizer = JSON.parse(rawCustomizer);
            var hasPersistentTheme =
              (!!customizer.selectedTheme && customizer.selectedTheme !== 'default') ||
              !!customizer.selectedTweakcnTheme ||
              (customizer.selectedRadius && customizer.selectedRadius !== '0.5rem');
            if (!hasPersistentTheme) {
              localStorage.removeItem('${THEME_SNAPSHOT_STORAGE_KEY}');
            }
          } catch (error) {
            localStorage.removeItem('${THEME_SNAPSHOT_STORAGE_KEY}');
          }
        }

        var rawSnapshot = localStorage.getItem('${THEME_SNAPSHOT_STORAGE_KEY}');
        if (!rawSnapshot) return;

        var snapshot = JSON.parse(rawSnapshot);
        Object.keys(snapshot).forEach(function(key) {
          root.style.setProperty(key, snapshot[key]);
        });
      } catch (error) {
        // ignore bootstrap theme errors
      }
    })();
  `;

  return (
    <html lang="en" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system" storageKey="nextjs-ui-theme">
          <SidebarConfigProvider>
            <ApiAuthBridge />
            {children}
          </SidebarConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
