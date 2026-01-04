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

  const isActive = (path: string) => {
    if (path === "/result") {
      return location.pathname === "/result";
    }
    return location.pathname === path;
  };

  const handleNavClick = (path: string) => {
    const currentState = location.state;
    navigate(path, { state: currentState });
  };

  return (
    <div className="glass-card py-2 px-4 mb-4 max-w-2xl mx-auto">
      <div className="flex gap-2 flex-wrap items-center justify-center">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNavClick(item.path)}
            className={`flex items-center justify-center px-3 py-1.5 h-8 rounded-lg font-body text-sm font-medium transition-colors border box-border ${
              isActive(item.path)
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-secondary/50 text-muted-foreground border-border/50 hover:bg-secondary"
            }`}
          >
            <span className="leading-none">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ResultNavigation;

