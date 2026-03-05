import { Button } from "@/components/ui/button";
import { HardHat, Loader2, LogIn } from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const [error, setError] = useState<string | null>(null);

  const isLoggingIn = loginStatus === "logging-in";

  const handleLogin = async () => {
    setError(null);
    try {
      await login();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      if (message !== "User is already authenticated") {
        setError(message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header stripe */}
      <div className="h-1.5 bg-primary w-full" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-card">
            <HardHat className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold text-foreground tracking-tight">
              SiteTrack
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Construction site management
            </p>
          </div>
        </div>

        {/* Login card */}
        <div className="w-full max-w-sm">
          <div className="bg-card rounded-2xl shadow-card border border-border p-8">
            <div className="mb-6">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Welcome back
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sign in to manage your construction sites
              </p>
            </div>

            {error && (
              <div
                data-ocid="auth.error_state"
                className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <Button
              data-ocid="auth.login_button"
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>

            <p className="mt-4 text-xs text-center text-muted-foreground">
              Uses Internet Identity — secure, no password needed
            </p>
          </div>

          {/* Features teaser */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: "Daily Logs", icon: "📋" },
              { label: "Payments", icon: "💰" },
              { label: "Documents", icon: "📂" },
            ].map((f) => (
              <div
                key={f.label}
                className="bg-card border border-border rounded-xl p-3 text-center"
              >
                <div className="text-2xl mb-1">{f.icon}</div>
                <p className="text-xs font-medium text-muted-foreground">
                  {f.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Built with love using caffeine.ai
        </a>
      </footer>
    </div>
  );
}
