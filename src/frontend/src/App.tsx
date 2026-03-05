import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import AdminPage from "./components/AdminPage";
import CreateSitePage from "./components/CreateSitePage";
import Dashboard from "./components/Dashboard";
import LoginPage from "./components/LoginPage";
import ProfileSetup from "./components/ProfileSetup";
import SitePage from "./components/SitePage";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile, useIsCallerAdmin } from "./hooks/useQueries";

type AppView =
  | { screen: "login" }
  | { screen: "profile-setup" }
  | { screen: "dashboard" }
  | { screen: "create-site" }
  | { screen: "admin" }
  | {
      screen: "site";
      siteId: string;
      tab?: "daily-log" | "payments" | "documents";
    };

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  const { data: isAdmin } = useIsCallerAdmin();

  const [view, setView] = useState<AppView>({ screen: "dashboard" });

  // Show nothing while initializing identity
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
            <span className="text-2xl">🏗️</span>
          </div>
          <p className="text-sm text-muted-foreground">Loading SiteTrack...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <Toaster richColors position="top-center" />
      </>
    );
  }

  // Authenticated but profile loading
  if (profileLoading || !profileFetched) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
            <span className="text-2xl">🏗️</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Setting up your account...
          </p>
        </div>
      </div>
    );
  }

  // Profile setup needed
  const showProfileSetup =
    isAuthenticated && profileFetched && userProfile === null;
  if (showProfileSetup) {
    return (
      <>
        <ProfileSetup onComplete={() => setView({ screen: "dashboard" })} />
        <Toaster richColors position="top-center" />
      </>
    );
  }

  // Render current view
  const renderView = () => {
    switch (view.screen) {
      case "create-site":
        return (
          <CreateSitePage
            onCreated={(siteId) =>
              setView({ screen: "site", siteId, tab: "daily-log" })
            }
          />
        );

      case "site":
        return (
          <SitePage
            siteId={view.siteId}
            defaultTab={view.tab ?? "daily-log"}
            onBack={() => setView({ screen: "dashboard" })}
          />
        );

      case "admin":
        return <AdminPage onBack={() => setView({ screen: "dashboard" })} />;

      default: {
        return (
          <Dashboard
            onCreateSite={() => setView({ screen: "create-site" })}
            onViewSite={(siteId) =>
              setView({ screen: "site", siteId, tab: "daily-log" })
            }
            onEnterLog={(siteId) =>
              setView({ screen: "site", siteId, tab: "daily-log" })
            }
            onAdminPanel={
              isAdmin ? () => setView({ screen: "admin" }) : undefined
            }
            isAdminResolved={isAdmin !== undefined}
          />
        );
      }
    }
  };

  return (
    <>
      {renderView()}
      <Toaster richColors position="top-center" />
    </>
  );
}
