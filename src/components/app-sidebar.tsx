"use client"

import * as React from "react"
import {
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  Building2,
  Coins,
  Database,
  Globe,
  LayoutDashboard,
  ListChecks,
  MessageCircle,
  Settings,
  Shield,
  ShieldCheck,
  Smartphone,
  UserCheck,
  Users,
} from "lucide-react"
import Link from "next/link"

import { Logo } from "@/components/logo"
import { getStoredUser } from "@/lib/authStorage"
import { resolveProfilePhotoUrl } from "@/lib/user-profile"
import { SidebarNotification } from "@/components/sidebar-notification"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navGroups: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      label: "Operations",
      items: [
        { title: "Transfers", url: "/transfers", icon: ArrowRightLeft },
        { title: "Remitters", url: "/remitters", icon: Users },
        { title: "Receivers", url: "/receivers", icon: UserCheck },
        { title: "KYC Reviews", url: "/kyc", icon: ShieldCheck },
        { title: "Branch Access Flags", url: "/branch-access", icon: AlertTriangle },
      ],
    },
    {
      label: "Mobile",
      items: [
        { title: "Mobile Profiles", url: "/mobile-profiles", icon: Smartphone },
        {
          title: "Mobile Control",
          url: "#",
          icon: ShieldCheck,
          items: [
            { title: "Overview", url: "/mobile-users/control/overview" },
            { title: "App Flow Settings", url: "/mobile-users/control/app-flow-settings" },
            { title: "Customer Digital Rates", url: "/mobile-users/control/exchange-rates" },
            { title: "Wallet Funding Queue", url: "/mobile-users/control/wallet-transfers" },
            { title: "Profile Review Queue", url: "/mobile-users/control/profile-review-queue" },
            { title: "Campaigns", url: "/mobile-users/control/campaigns" },
            { title: "In-App Ads", url: "/mobile-users/control/in-app-ads" },
          ],
        },
      ],
    },
    {
      label: "Management",
      items: [
        { title: "System Users", url: "/users", icon: Users },
        { title: "Roles", url: "/roles", icon: Shield },
        { title: "Role Permissions", url: "/permission-groups", icon: ShieldCheck },
        { title: "Branches", url: "/branches", icon: Building2 },
        { title: "Branch Rates", url: "/branch-rates", icon: Coins },
      ],
    },
    {
      label: "System",
      items: [
        { title: "Settings", url: "/settings", icon: Settings },
        { title: "Support Inbox", url: "/support", icon: MessageCircle },
        { title: "User Logs", url: "/logs", icon: Database },
      ],
    },
    {
      label: "Reports",
      items: [
        { title: "Reports", url: "/reports", icon: BarChart3 },
      ],
    },
    {
      label: "Basic Data",
      items: [
        { title: "Countries", url: "/countries", icon: Globe },
        { title: "Banks", url: "/banks", icon: Building2 },
        { title: "Relationships", url: "/relationships", icon: Users },
        { title: "Purposes", url: "/purposes", icon: ListChecks },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [currentUser, setCurrentUser] = React.useState({
    name: "System Admin",
    email: "admin@linkforex.com",
    avatar: "",
  })

  React.useEffect(() => {
    const syncUser = (nextUser?: any) => {
      const storedUser = nextUser || getStoredUser<any>()
      if (!storedUser) return

      setCurrentUser({
        name: storedUser.name || storedUser.username || "System Admin",
        email: storedUser.email || "admin@linkforex.com",
        avatar: resolveProfilePhotoUrl(storedUser.profile_photo, storedUser.profile_photo_url) || "",
      })
    }

    syncUser()

    const onStorage = (event: StorageEvent) => {
      if (event.key !== "user" || !event.newValue) return
      try {
        syncUser(JSON.parse(event.newValue))
      } catch {
        syncUser()
      }
    }

    const onUserUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<any>
      if (!customEvent.detail) return
      syncUser(customEvent.detail)
    }

    window.addEventListener("storage", onStorage)
    window.addEventListener("admin-user-updated", onUserUpdated as EventListener)
    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("admin-user-updated", onUserUpdated as EventListener)
    }
  }, [])

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <Logo size={26} className="w-auto" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {data.navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarNotification />
        <NavUser user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
