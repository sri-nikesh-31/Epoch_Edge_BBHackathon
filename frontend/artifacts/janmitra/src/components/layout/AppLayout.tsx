import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Landmark } from "lucide-react";
import { Link } from "wouter";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-col flex-1 min-h-screen overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-[hsl(224,65%,13%)] px-4">
          <SidebarTrigger className="text-white/70 hover:text-white hover:bg-white/10" />
          <div className="h-5 w-px bg-white/15" />
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#FF9933] flex items-center justify-center">
              <Landmark className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm text-white">JanMitra</span>
          </Link>
          <span className="text-white/30 text-xs hidden sm:block ml-1">— RBI Policy Assistant</span>
        </header>
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
