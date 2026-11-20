import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  BookOpen,
  Calculator,
  FlaskConical,
  HelpCircle,
  History,
  Home,
  Info,
  Leaf,
  LogOut,
  Menu as MenuIcon,
  MessagesSquare,
  Settings,
  Stethoscope,
  User,
  Bug,
  Sprout,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useSessionProfile } from "@/hooks/useSessionProfile";
import { myThreadSummary } from "@/lib/server/messaging";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PRIMARY = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/diagnose", label: "Diagnose", icon: Stethoscope },
  { to: "/messages", label: "Messages", icon: MessagesSquare },
  { to: "/history", label: "History", icon: History },
];

const LIBRARY = [
  { to: "/library", label: "Information library", icon: BookOpen },
  { to: "/library/diseases", label: "Diseases", icon: FlaskConical },
  { to: "/library/pests", label: "Pests", icon: Bug },
  { to: "/library/inputs", label: "Active ingredients", icon: Sprout },
  { to: "/library/cropping", label: "Cropping guide", icon: Sprout },
  { to: "/library/stewardship", label: "Stewardship guide", icon: Sprout },
  { to: "/planner", label: "Application planner", icon: Calculator },
];

const ACCOUNT = [
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/reports", label: "My reports", icon: BookOpen },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/help", label: "Help & tutorial", icon: HelpCircle },
  { to: "/about", label: "About OnionCare", icon: Info },
];

export default function FarmerShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { profile, loading, error } = useSessionProfile();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !error && !profile) navigate({ to: "/onboarding" });
  }, [loading, error, profile, navigate]);

  useEffect(() => {
    let active = true;
    myThreadSummary()
      .then((result) => {
        if (active) setUnread(result.unread ?? 0);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [location.pathname]);

  const displayName = profile?.name || user?.full_name || "Farmer";
  const firstName = displayName.split(/\s+/)[0];
  const isActive = (to) => location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <div className="min-h-screen bg-background pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Leaf className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <span className="font-heading text-[0.9375rem] font-semibold">OnionCare</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {PRIMARY.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.to) ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/library"
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive("/library") ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Library
            </Link>
          </nav>

          <div className="flex items-center gap-1.5">
            <Link
              to="/notifications"
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Bell className="h-5 w-5" strokeWidth={1.9} />
              {unread > 0 ? (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
              ) : null}
            </Link>

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Open menu"
                  className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
                >
                  <MenuIcon className="h-5 w-5" strokeWidth={1.9} />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[19rem] overflow-y-auto p-0">
                <SheetHeader className="border-b border-border px-5 py-4 text-left">
                  <SheetTitle className="text-base">{loading ? "Loading…" : displayName}</SheetTitle>
                  <p className="text-xs text-muted-foreground">
                    {profile ? `${profile.location} · @${profile.username}` : "Farmer account"}
                  </p>
                </SheetHeader>
                <MenuLinks onNavigate={() => setMenuOpen(false)} />
              </SheetContent>
            </Sheet>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="hidden h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary lg:flex"
                  aria-label="Account menu"
                >
                  {firstName.slice(0, 1).toUpperCase()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{profile?.location ?? "—"}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/library">Information library</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-9">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        aria-label="Primary"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-between px-1">
          {PRIMARY.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[0.6875rem] font-medium transition-colors",
                isActive(item.to) ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span className="relative">
                <item.icon className="h-5 w-5" strokeWidth={isActive(item.to) ? 2.2 : 1.8} />
                {item.to === "/messages" && unread > 0 ? (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
                ) : null}
              </span>
              {item.label}
            </Link>
          ))}
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[0.6875rem] font-medium text-muted-foreground"
              >
                <MenuIcon className="h-5 w-5" strokeWidth={1.8} />
                Menu
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[19rem] overflow-y-auto p-0">
              <SheetHeader className="border-b border-border px-5 py-4 text-left">
                <SheetTitle className="text-base">{displayName}</SheetTitle>
                <p className="text-xs text-muted-foreground">{profile?.location ?? "Farmer account"}</p>
              </SheetHeader>
              <MenuLinks />
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </div>
  );
}

function MenuLinks({ onNavigate }) {
  const { logout } = useAuth();
  return (
    <div className="px-3 py-4">
      <MenuGroup title="Library" items={LIBRARY} onNavigate={onNavigate} />
      <MenuGroup title="Account" items={ACCOUNT} onNavigate={onNavigate} />
      <div className="mt-4 border-t border-border pt-3">
        <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground" onClick={() => logout()}>
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}

function MenuGroup({ title, items, onNavigate }) {
  return (
    <div className="mb-4">
      <p className="px-2 pb-1.5 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className="flex min-h-[44px] items-center gap-3 rounded-md px-2 text-sm text-foreground transition-colors hover:bg-secondary"
          >
            <item.icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.9} />
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}