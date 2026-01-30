import { useLocation, useNavigate } from "react-router-dom";

const ResultNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: "/result", label: "Detection Result" },
    { path: "/result/what-we-checked", label: "What we checked" },
    { path: "/result/how-it-works", label: "How it works" },
    { path: "/result/what-should-we-do", label: "What should we do" },
  ];

  const isActive = (path: string) =>
    path === "/result"
      ? location.pathname === "/result"
      : location.pathname === path;

  return (
    <nav className="flex justify-center">
      <div className="flex flex-wrap items-center gap-3">
        {navItems.map((item) => {
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path, { state: location.state })}
              className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all
                ${
                  active
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                }`}
            >
              {item.label}

              {active && (
                <span className="absolute left-1/2 -bottom-1 h-[2px] w-6 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default ResultNavigation;
