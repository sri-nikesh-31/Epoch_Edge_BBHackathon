import { Home, LayoutDashboard, MessageSquare, Settings, Landmark } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const items = [
  { title: "Home", url: "/", icon: Home },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Chatbot", url: "/chatbot", icon: MessageSquare },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-5 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#FF9933] flex items-center justify-center shadow-md flex-shrink-0">
            <Landmark className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base text-sidebar-foreground leading-tight">JanMitra</span>
            <span className="text-[10px] text-sidebar-foreground/50 leading-tight tracking-wide uppercase">RBI Assistant</span>
          </div>
        </Link>
        {/* Tricolor stripe */}
        <div className="flex h-1 mt-4 overflow-hidden rounded-full">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white/20" />
          <div className="flex-1 bg-[#138808]" />
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`h-10 px-3 rounded-lg transition-all font-medium text-sm gap-3 ${
                        isActive
                          ? "bg-[#FF9933] text-white hover:bg-[#e88800]"
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                      }`}
                    >
                      <Link href={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="rounded-lg bg-sidebar-accent/50 p-3 border border-sidebar-border">
          <p className="text-[11px] text-sidebar-foreground/50 leading-relaxed">
            Data sourced from RBI official circulars. Not affiliated with the Reserve Bank of India.
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
