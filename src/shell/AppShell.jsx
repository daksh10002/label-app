import { NavLink, Outlet } from "react-router-dom";

export default function AppShell() {
  return (
    <div>
      {/* Top bar */}
      <div className="no-print sticky top-0 z-10 backdrop-blur bg-appbg/80 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <div className="font-extrabold tracking-wide">Sticker Studio</div>
          <nav className="ml-auto flex gap-2">
            <Nav to="/">Home</Nav>
            <Nav to="/goshudh">Goshudh</Nav>
            <Nav to="/trinetra">Trinetra</Nav>
            <Nav to="/groshaat">Groshaat</Nav>
            <Nav to="/jar">Jar</Nav>
          </nav>
        </div>
      </div>
      {/* Page body */}
      <div className="mx-auto max-w-6xl px-4 py-4">
        <Outlet />
      </div>
    </div>
  );
}

function Nav({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-1.5 rounded-xl border ${isActive ? "border-slate-500 bg-slate-900" : "border-border hover:bg-slate-900"}`
      }
      end
    >
      {children}
    </NavLink>
  );
}
