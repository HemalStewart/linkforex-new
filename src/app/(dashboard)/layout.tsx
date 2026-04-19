"use client";

import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { UpgradeToProButton } from "@/components/upgrade-to-pro-button";
import { useSidebarConfig } from "@/hooks/use-sidebar-config";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [themeCustomizerOpen, setThemeCustomizerOpen] = React.useState(false);
  const { config } = useSidebarConfig();

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "14rem",
        "--sidebar-width-icon": "2.75rem",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
      className={config.collapsible === "none" ? "sidebar-none-mode" : ""}
    >
      {config.side === "left" ? (
        <>
          <AppSidebar
            variant={config.variant}
            collapsible={config.collapsible}
            side={config.side}
          />
          <SidebarInset>
            <SiteHeader onOpenCustomizer={() => setThemeCustomizerOpen(true)} />
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-3 py-3 md:gap-4 md:py-4">
                  {children}
                </div>
              </div>
            </div>
            <SiteFooter />
          </SidebarInset>
        </>
      ) : (
        <>
          <SidebarInset>
            <SiteHeader onOpenCustomizer={() => setThemeCustomizerOpen(true)} />
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-3 py-3 md:gap-4 md:py-4">
                  {children}
                </div>
              </div>
            </div>
            <SiteFooter />
          </SidebarInset>
          <AppSidebar
            variant={config.variant}
            collapsible={config.collapsible}
            side={config.side}
          />
        </>
      )}
      <ThemeCustomizer
        open={themeCustomizerOpen}
        onOpenChange={setThemeCustomizerOpen}
      />
      <UpgradeToProButton />
    </SidebarProvider>
  );
}
