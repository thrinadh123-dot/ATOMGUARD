import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Zap, Sparkles, ShieldCheck } from "lucide-react";
import AtomLogo from "@/components/common/AtomLogo";

const Home = () => {
  const [url, setUrl] = useState("");
  const navigate = useNavigate();

  const handleCheck = () => {
    if (!url.trim()) return;
    navigate("/result", { state: { url: url.trim() } });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCheck();
    }
  };

  return (
    <div className="min-h-screen bg-background hero-gradient">
      {/* Header */}
      <header className="w-full py-6 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AtomLogo className="w-9 h-9 animate-rotate-slow" />
            <span className="font-display font-semibold text-xl text-foreground tracking-wide">
              AtomGuard
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-body">Advanced Phishing Detection</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8 md:mb-10 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              <span className="font-body">Instant URL Analysis</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight">
              Phishing URL
              <br />
              <span className="text-gradient">Detection</span>
            </h1>
            <p className="font-body text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-0 leading-relaxed">
            Analyze URLs instantly using security indicators to identify phishing, suspicious, or safe links.
            </p>
          </div>

          {/* Input Section */}
          <div className="glass-card gradient-border p-6 md:p-8 mb-12 animate-fade-in-up delay-100">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Paste a URL to check (e.g., paypa1.com)"
                  className="font-body w-full pl-12 pr-4 py-4 bg-secondary/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 input-glow transition-all duration-300"
                />
              </div>
              <button
                onClick={handleCheck}
                disabled={!url.trim()}
                className="btn-primary font-body flex items-center justify-center gap-2 min-w-[160px]"
              >
                <AtomLogo className="w-6 h-6 shrink-0" variant="white" />
                <span>Check URL</span>
              </button>
            </div>

            {/* Example URLs */}
            <div className="mt-6 pt-6 border-t border-border/30">
              <p className="font-body text-sm text-muted-foreground mb-3">Try these examples:</p>
              <div className="flex flex-wrap gap-2">
                {["google.com", "paypa1.com", "amaz0n-secure.tk"].map(
                  (example) => (
                    <button
                      key={example}
                      onClick={() => setUrl(example)}
                      className="font-body px-3 py-1.5 text-xs font-medium bg-secondary/50 hover:bg-secondary/70 border border-border/50 rounded-lg text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
                    >
                      {example}
                    </button>
                  )
                )}
              </div>
              <p className="font-body text-xs text-muted-foreground/70 mt-4 text-center">
                URLs are analyzed in real-time and are not stored. Your privacy is protected.
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 animate-fade-in-up delay-200">
            {[
              {
                icon: ShieldCheck,
                title: "Pattern Detection",
                desc: "Detects common phishing patterns such as misspelled or fake domains.",
              },
              {
                icon: Zap,
                title: "Instant Results",
                desc: "Get instant analysis with clear, easy-to-understand explanations.",
              },
              {
                icon: Sparkles,
                title: "Student-Friendly",
                desc: "Designed for students with simple, non-technical insights.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="glass-card p-6 text-center hover:border-primary/30 transition-colors duration-300"
              >
                <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="font-body text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/30">
        <p className="font-body text-center text-sm text-muted-foreground">
        AtomGuard is an educational phishing detection tool.
        </p>
      </footer>
    </div>
  );
};

export default Home;

