import { Globe2, History, LayoutDashboard, Network, Settings, Waypoints } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/src/lib/utils";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/scans", label: "Scans", icon: History },
  { to: "/sites", label: "Sites", icon: Globe2 },
  { to: "/domains", label: "Domains", icon: Waypoints },
  { to: "/global", label: "Global graph", icon: Network },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-panel/80">
        <div className="px-5 py-6">
          <p className="text-[10px] tracking-[0.32em] text-cyan uppercase">LinkScope</p>
          <h1 className="font-display mt-1 text-2xl">Observatory</h1>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-sm px-3 py-2 text-[11px] tracking-[0.16em] uppercase",
                  isActive ? "bg-raised text-cyan" : "text-mute hover:text-ink",
                )
              }
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <p className="px-5 py-4 text-[10px] leading-relaxed text-mute">
          Local-first map of the web you actually visit.
        </p>
      </aside>
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
