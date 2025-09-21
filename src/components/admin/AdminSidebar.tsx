import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Users, 
  Video, 
  Settings, 
  Shield, 
  Server, 
  BarChart3,
  Menu,
  X,
  LogOut,
  Home
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useLocalAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const adminMenuItems = [
  { title: "Dashboard", url: "/admin", icon: BarChart3 },
  { title: "Utilisateurs", url: "/admin/users", icon: Users },
  { title: "Contenus", url: "/admin/content", icon: Video },
  { title: "Sécurité", url: "/admin/security", icon: Shield },
  { title: "Services", url: "/admin/services", icon: Server },
  { title: "Paramètres", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const { isAdmin, profile } = useAdminAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/admin") {
      return currentPath === "/admin";
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar className="w-64">
      <SidebarContent className="bg-card border-r">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Admin Panel</h2>
              <p className="text-xs text-muted-foreground">Massflix</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Return to main app */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    <span>Retour à l'app</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Admin menu items */}
              {adminMenuItems.map((item) => {
                // Hide certain sections for moderators
                if (!isAdmin && (item.url.includes('/settings') || item.url.includes('/services'))) {
                  return null;
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end={item.url === "/admin"}
                        className={({ isActive }) => getNavCls({ isActive })}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User info and logout */}
        <div className="mt-auto p-4 border-t">
          <div className="mb-3">
            <p className="text-sm font-medium">{profile?.full_name || profile?.username}</p>
            <p className="text-xs text-muted-foreground capitalize">{profile?.role || 'user'}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}