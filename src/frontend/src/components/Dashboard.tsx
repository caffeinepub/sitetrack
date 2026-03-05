import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import {
  ClipboardList,
  Eye,
  HardHat,
  Loader2,
  LogOut,
  MapPin,
  Shield,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import type { SiteAggregate } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useBecomeFirstAdmin,
  useGetAllSites,
  useGetCallerUserProfile,
  useGetSiteAggregates,
} from "../hooks/useQueries";
import { formatDate, formatRupees } from "../utils/format";

interface DashboardProps {
  onCreateSite: () => void;
  onViewSite: (siteId: string) => void;
  onEnterLog: (siteId: string) => void;
  onAdminPanel?: () => void;
  isAdminResolved?: boolean;
}

function FinancialCard({
  label,
  value,
  colorClass,
  bgClass,
  icon,
  ocid,
  isLoading,
}: {
  label: string;
  value: string;
  colorClass: string;
  bgClass: string;
  icon: React.ReactNode;
  ocid: string;
  isLoading: boolean;
}) {
  return (
    <div
      data-ocid={ocid}
      className={`${bgClass} border border-border rounded-2xl p-5 shadow-card`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="opacity-60">{icon}</div>
      </div>
      {isLoading ? (
        <Skeleton className="h-10 w-32 mt-1" />
      ) : (
        <p className={`financial-number text-3xl ${colorClass} leading-none`}>
          {value}
        </p>
      )}
    </div>
  );
}

function SiteAggregatesCards({
  siteId,
  contractValue,
  onEnterLog,
  onViewSite,
}: {
  siteId: string;
  contractValue: bigint;
  onEnterLog: () => void;
  onViewSite: () => void;
}) {
  const { data: agg, isLoading } = useGetSiteAggregates(siteId);

  const safeAgg: SiteAggregate = agg ?? {
    totalReceived: BigInt(0),
    totalExpense: BigInt(0),
    profitLoss: BigInt(0),
    pendingAmount: contractValue,
  };

  const isProfitPositive = safeAgg.profitLoss >= BigInt(0);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <FinancialCard
          ocid="dashboard.total_received_card"
          label="Total Received"
          value={formatRupees(safeAgg.totalReceived)}
          colorClass="text-success"
          bgClass="bg-card"
          icon={<TrendingUp className="w-5 h-5 text-success" />}
          isLoading={isLoading}
        />
        <FinancialCard
          ocid="dashboard.total_expense_card"
          label="Total Expense"
          value={formatRupees(safeAgg.totalExpense)}
          colorClass="text-destructive"
          bgClass="bg-card"
          icon={<TrendingDown className="w-5 h-5 text-destructive" />}
          isLoading={isLoading}
        />
        <FinancialCard
          ocid="dashboard.profit_card"
          label="Profit / Loss"
          value={formatRupees(safeAgg.profitLoss)}
          colorClass={isProfitPositive ? "text-success" : "text-destructive"}
          bgClass={
            isProfitPositive
              ? "bg-success/5 border-success/20"
              : "bg-destructive/5 border-destructive/20"
          }
          icon={
            isProfitPositive ? (
              <TrendingUp className="w-5 h-5 text-success" />
            ) : (
              <TrendingDown className="w-5 h-5 text-destructive" />
            )
          }
          isLoading={isLoading}
        />
        <FinancialCard
          ocid="dashboard.pending_card"
          label="Pending Amount"
          value={formatRupees(safeAgg.pendingAmount)}
          colorClass="text-amber-primary"
          bgClass="bg-card"
          icon={<span className="text-xl font-bold text-amber-primary">₹</span>}
          isLoading={isLoading}
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          data-ocid="dashboard.enter_log_button"
          onClick={onEnterLog}
          className="h-14 flex-col gap-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-card"
        >
          <ClipboardList className="w-5 h-5" />
          <span className="text-sm">Today's Log</span>
        </Button>
        <Button
          data-ocid="dashboard.view_site_button"
          onClick={onViewSite}
          variant="outline"
          className="h-14 flex-col gap-1 border-2 border-primary/30 text-primary hover:bg-primary/5 font-semibold"
        >
          <Eye className="w-5 h-5" />
          <span className="text-sm">View Site</span>
        </Button>
      </div>
    </>
  );
}

export default function Dashboard({
  onCreateSite,
  onViewSite,
  onEnterLog,
  onAdminPanel,
  isAdminResolved,
}: DashboardProps) {
  const { data: sites, isLoading: sitesLoading } = useGetAllSites();
  const { data: profile } = useGetCallerUserProfile();
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { mutateAsync: becomeFirstAdmin, isPending: claimingAdmin } =
    useBecomeFirstAdmin();

  const handleClaimAdmin = async () => {
    try {
      const result = await becomeFirstAdmin();
      if (result) {
        toast.success(
          "You are now admin! Reload the page to see the Admin panel.",
        );
      } else {
        toast.error("An admin already exists. Contact them for access.");
      }
    } catch {
      toast.error("Failed to claim admin access. Please try again.");
    }
  };

  const site = sites?.[0];

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <HardHat className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">
              SiteTrack
            </span>
          </div>
          <div className="flex items-center gap-2">
            {profile?.companyName && (
              <span className="text-xs text-muted-foreground hidden sm:block truncate max-w-[120px]">
                {profile.companyName}
              </span>
            )}
            {onAdminPanel && (
              <button
                type="button"
                data-ocid="nav.admin.link"
                onClick={onAdminPanel}
                className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-primary/10 flex items-center gap-1.5 text-xs font-medium"
                title="Admin Panel"
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
            {isAdminResolved && !onAdminPanel && (
              <button
                type="button"
                data-ocid="nav.claim_admin_button"
                onClick={handleClaimAdmin}
                disabled={claimingAdmin}
                className="text-muted-foreground hover:text-amber-500 transition-colors p-1.5 rounded-lg hover:bg-amber-500/10 flex items-center gap-1.5 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                title="Claim Admin Access"
              >
                {claimingAdmin ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Claim Admin</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-auto w-full px-4 py-6">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground">
            {greeting()}, {profile?.name?.split(" ")[0] ?? "there"} 👋
          </h1>
          {site ? (
            <p className="text-sm text-muted-foreground mt-1">
              Here's your site overview for today
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
              Set up your first site to get started
            </p>
          )}
        </div>

        {sitesLoading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {(["a", "b", "c", "d"] as const).map((k) => (
                <Skeleton key={k} className="h-28 rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
            </div>
          </div>
        ) : site ? (
          <>
            {/* Site info card */}
            <div className="bg-card border border-border rounded-2xl p-4 mb-5 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2Icon />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display font-bold text-foreground text-base leading-tight truncate">
                    {site.name}
                  </h2>
                  <p className="text-sm text-muted-foreground truncate">
                    {site.clientName}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">
                      {site.location}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">Contract</p>
                  <p className="font-display font-bold text-sm text-foreground">
                    {formatRupees(site.totalContractValue)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Since {formatDate(site.startDate)}
                  </p>
                </div>
              </div>
            </div>

            <SiteAggregatesCards
              siteId={site.id}
              contractValue={site.totalContractValue}
              onEnterLog={() => onEnterLog(site.id)}
              onViewSite={() => onViewSite(site.id)}
            />
          </>
        ) : (
          /* No site yet */
          <div className="flex flex-col items-center text-center py-12">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 construction-pattern flex items-center justify-center mb-5">
              <HardHat className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground mb-2">
              No site yet
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Create your first construction site to start tracking logs,
              payments and documents.
            </p>
            <Button
              onClick={onCreateSite}
              className="h-12 px-8 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              + Create Site
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border mt-auto">
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

function Building2Icon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary"
      aria-label="Building"
      role="img"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  );
}
