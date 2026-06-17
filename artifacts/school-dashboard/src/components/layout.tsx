import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Users,
  GraduationCap,
  LayoutDashboard,
  CalendarCheck,
  BookOpen,
  CreditCard,
  LogOut,
  Moon,
  Sun,
  Settings,
  ClipboardList,
  TrendingUp,
  Menu,
  Megaphone,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getAnnouncements } from "@/lib/storage";

const NAV_ITEMS = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Students", href: "/students", icon: Users },
  { title: "Teachers", href: "/teachers", icon: GraduationCap },
  { title: "Attendance", href: "/attendance", icon: CalendarCheck },
  { title: "Academics", href: "/academics", icon: BookOpen },
  { title: "Exams", href: "/exams", icon: ClipboardList },
  { title: "Progress", href: "/progress", icon: TrendingUp },
  { title: "Fees", href: "/fees", icon: CreditCard },
  { title: "Announcements", href: "/announcements", icon: Megaphone },
  { title: "Security", href: "/settings", icon: Settings },
];

function NavLink({
  item,
  location,
  badge,
}: {
  item: typeof NAV_ITEMS[0];
  location: string;
  badge?: number;
}) {
  const Icon = item.icon;
  const isActive = location === item.href || location.startsWith(`${item.href}/`);
  return (
    <Link href={item.href}>
      <div className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 cursor-pointer text-sm ${
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      }`}>
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{item.title}</span>
        {badge != null && badge > 0 && (
          <span className="ml-auto text-[10px] font-bold leading-none bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
            {badge}
          </span>
        )}
      </div>
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const [announcementCount, setAnnouncementCount] = useState(0);

  useEffect(() => {
    const refresh = () => setAnnouncementCount(getAnnouncements().length);
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [location]); // re-check when navigating

  const handleLogout = () => {
    localStorage.removeItem("school_auth");
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Topbar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-card shadow-sm">
        <div className="flex items-center gap-2 font-serif font-bold text-lg text-primary">
          <GraduationCap className="h-5 w-5" />
          Oxford Science
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar text-sidebar-foreground border-sidebar-border p-0 flex flex-col">
              <div className="p-5 flex items-center gap-3 font-serif font-bold text-lg border-b border-sidebar-border/50">
                <GraduationCap className="h-6 w-6 shrink-0" />
                <div className="leading-tight">
                  <div>Oxford Science</div>
                  <div className="text-xs font-sans font-normal opacity-70">Public School & College</div>
                </div>
              </div>
              <ScrollArea className="flex-1 px-3 py-4">
                <div className="flex flex-col gap-0.5">
                  {NAV_ITEMS.map(item => (
                    <NavLink
                      key={item.href}
                      item={item}
                      location={location}
                      badge={item.href === "/announcements" ? announcementCount : undefined}
                    />
                  ))}
                </div>
              </ScrollArea>
              <div className="p-4 border-t border-sidebar-border/50">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  data-testid="button-logout-mobile"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border sticky top-0 h-screen">
        <div className="p-5 flex items-center gap-3 font-serif font-bold text-lg border-b border-sidebar-border/50">
          <GraduationCap className="h-7 w-7 shrink-0" />
          <div className="leading-tight">
            <div>Oxford Science</div>
            <div className="text-xs font-sans font-normal opacity-60">Public School & College</div>
          </div>
        </div>
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="flex flex-col gap-0.5">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.href}
                item={item}
                location={location}
                badge={item.href === "/announcements" ? announcementCount : undefined}
              />
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-sidebar-border/50 flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            onClick={handleLogout}
            data-testid="button-logout-desktop"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
