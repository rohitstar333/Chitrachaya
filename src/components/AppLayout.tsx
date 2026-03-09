import { Link, useLocation } from "react-router-dom";
import { Camera, LayoutDashboard, CalendarPlus, List, Users } from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/events", label: "Events", icon: List },
  { to: "/request", label: "New Request", icon: CalendarPlus },
  { to: "/team", label: "Team", icon: Users },
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-14 px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center glow-red">
              <Camera className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <span className="text-base font-display font-bold text-foreground tracking-tight">Chitrachaya</span>
              <span className="hidden sm:inline text-[10px] font-mono text-muted-foreground ml-2 uppercase tracking-widest">Photography Club</span>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="container px-4 md:px-6 py-8">{children}</main>
    </div>
  );
};

export default AppLayout;
