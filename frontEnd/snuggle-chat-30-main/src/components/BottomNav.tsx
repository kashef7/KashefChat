import { NavLink } from "react-router-dom";
import { Home, Search, Bell, User } from "lucide-react";

export default function BottomNav() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-1 text-xs transition-colors ${
      isActive ? "text-primary font-semibold" : "text-muted-foreground"
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background px-4 py-2">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        <NavLink to="/" className={linkClass}>
          <Home className="h-5 w-5" />
          <span>Home</span>
        </NavLink>
        <NavLink to="/search" className={linkClass}>
          <Search className="h-5 w-5" />
          <span>Search</span>
        </NavLink>
        <NavLink to="/notifications" className={linkClass}>
          <Bell className="h-5 w-5" />
          <span>Alerts</span>
        </NavLink>
        <NavLink to="/profile" className={linkClass}>
          <User className="h-5 w-5" />
          <span>Profile</span>
        </NavLink>
      </div>
    </nav>
  );
}
