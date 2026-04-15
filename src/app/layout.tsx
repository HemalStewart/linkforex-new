import type { Metadata } from "next";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { SidebarConfigProvider } from "@/contexts/sidebar-context";
import { inter } from "@/lib/fonts";
import {
  THEME_SNAPSHOT_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from "@/lib/theme-persistence";

export const metadata: Metadata = {
  title: "LinkForex",
  description: "LinkForex new admin UI",
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
            {children}
          </SidebarConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
