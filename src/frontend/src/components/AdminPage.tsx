import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Principal } from "@icp-sdk/core/principal";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  HardHat,
  IndianRupee,
  Loader2,
  MapPin,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { PlatformStats, Site, UserSummary } from "../backend.d";
import {
  useAdminDeleteSite,
  useAdminDeleteUser,
  useAdminGetAllUsers,
  useAdminGetPlatformStats,
  useGetAllSites,
  useIsCallerAdmin,
} from "../hooks/useQueries";
import { formatDate, formatRupees } from "../utils/format";

// ─── Helpers ───────────────────────────────────────────────────

function truncatePrincipal(p: Principal): string {
  const str = p.toString();
  if (str.length <= 16) return str;
  return `${str.slice(0, 8)}…${str.slice(-6)}`;
}

// ─── Stats Tab ─────────────────────────────────────────────────

function StatsTab({
  stats,
  isLoading,
}: {
  stats: PlatformStats | undefined;
  isLoading: boolean;
}) {
  const statCards = [
    {
      label: "Total Users",
      value: stats ? String(stats.totalUsers) : "—",
      icon: <Users className="w-5 h-5" />,
      color: "text-primary",
      bg: "bg-primary/8",
      ocid: "admin.stats.card.1",
    },
    {
      label: "Total Sites",
      value: stats ? String(stats.totalSites) : "—",
      icon: <Building2 className="w-5 h-5" />,
      color: "text-blue-600",
      bg: "bg-blue-50",
      ocid: "admin.stats.card.2",
    },
    {
      label: "Total Contract Value",
      value: stats ? formatRupees(stats.totalContractValue) : "—",
      icon: <IndianRupee className="w-5 h-5" />,
      color: "text-amber-primary",
      bg: "bg-amber-50",
      ocid: "admin.stats.card.3",
    },
    {
      label: "Total Received",
      value: stats ? formatRupees(stats.totalReceived) : "—",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-success",
      bg: "bg-success/8",
      ocid: "admin.stats.card.4",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 md:p-6">
      {statCards.map((card, i) => (
        <motion.div
          key={card.ocid}
          data-ocid={card.ocid}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4, ease: "easeOut" }}
        >
          <Card className="border border-border shadow-card overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </p>
                <div
                  className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center ${card.color}`}
                >
                  {card.icon}
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-10 w-36" />
              ) : (
                <p
                  className={`financial-number text-3xl ${card.color} leading-none`}
                >
                  {card.value}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Users Tab ─────────────────────────────────────────────────

function DeleteUserDialog({
  user,
  index,
  onConfirm,
  isPending,
}: {
  user: UserSummary;
  index: number;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          data-ocid={`admin.users.delete_button.${index}`}
          variant="destructive"
          size="sm"
          className="h-7 px-2.5 text-xs gap-1"
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Trash2 className="w-3 h-3" />
          )}
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent data-ocid="admin.users.delete.dialog">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Delete User?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete{" "}
            <span className="font-semibold text-foreground">
              {user.profile.name}
            </span>{" "}
            and all their data including sites, logs, payments, and documents.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-ocid="admin.users.delete.cancel_button">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            data-ocid="admin.users.delete.confirm_button"
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Yes, delete user
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function UsersTab() {
  const { data: users, isLoading, isError } = useAdminGetAllUsers();
  const deleteUser = useAdminDeleteUser();

  const handleDeleteUser = async (principal: Principal, name: string) => {
    try {
      await deleteUser.mutateAsync(principal);
      toast.success(`User "${name}" deleted successfully`);
    } catch {
      toast.error("Failed to delete user. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div data-ocid="admin.loading_state" className="p-6 space-y-3">
        {(["a", "b", "c", "d"] as const).map((k) => (
          <Skeleton key={k} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div data-ocid="admin.error_state" className="p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
        <p className="text-sm text-destructive font-medium">
          Failed to load users
        </p>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="p-8 text-center">
        <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No users found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table data-ocid="admin.users.table">
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="font-semibold text-xs uppercase tracking-wide">
              Name
            </TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wide hidden sm:table-cell">
              Company
            </TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wide text-center">
              Sites
            </TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wide hidden md:table-cell">
              Principal
            </TableHead>
            <TableHead className="text-right font-semibold text-xs uppercase tracking-wide">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, i) => (
            <TableRow
              key={user.principal.toString()}
              data-ocid={`admin.users.row.${i + 1}`}
              className="hover:bg-muted/30 transition-colors"
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {user.profile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-foreground truncate max-w-[120px]">
                    {user.profile.name}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                {user.profile.companyName ?? (
                  <span className="text-muted-foreground/50">—</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  variant="secondary"
                  className="font-mono text-xs font-semibold"
                >
                  {String(user.siteCount)}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground">
                  {truncatePrincipal(user.principal)}
                </code>
              </TableCell>
              <TableCell className="text-right">
                <DeleteUserDialog
                  user={user}
                  index={i + 1}
                  onConfirm={() =>
                    handleDeleteUser(user.principal, user.profile.name)
                  }
                  isPending={deleteUser.isPending}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Sites Tab ─────────────────────────────────────────────────

function DeleteSiteDialog({
  site,
  index,
  onConfirm,
  isPending,
}: {
  site: Site;
  index: number;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          data-ocid={`admin.sites.delete_button.${index}`}
          variant="destructive"
          size="sm"
          className="h-7 px-2.5 text-xs gap-1"
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Trash2 className="w-3 h-3" />
          )}
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent data-ocid="admin.sites.delete.dialog">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Delete Site?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete{" "}
            <span className="font-semibold text-foreground">{site.name}</span>{" "}
            for client{" "}
            <span className="font-semibold text-foreground">
              {site.clientName}
            </span>
            , including all daily logs, payments, and documents. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-ocid="admin.sites.delete.cancel_button">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            data-ocid="admin.sites.delete.confirm_button"
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Yes, delete site
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SitesTab() {
  const { data: sites, isLoading, isError } = useGetAllSites();
  const deleteSite = useAdminDeleteSite();

  const handleDeleteSite = async (siteId: string, siteName: string) => {
    try {
      await deleteSite.mutateAsync(siteId);
      toast.success(`Site "${siteName}" deleted successfully`);
    } catch {
      toast.error("Failed to delete site. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {(["a", "b", "c", "d"] as const).map((k) => (
          <Skeleton key={k} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
        <p className="text-sm text-destructive font-medium">
          Failed to load sites
        </p>
      </div>
    );
  }

  if (!sites || sites.length === 0) {
    return (
      <div className="p-8 text-center">
        <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No sites found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table data-ocid="admin.sites.table">
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="font-semibold text-xs uppercase tracking-wide">
              Site
            </TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wide hidden sm:table-cell">
              Location
            </TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wide hidden md:table-cell">
              Contract Value
            </TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wide hidden lg:table-cell">
              Start Date
            </TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wide hidden xl:table-cell">
              Owner
            </TableHead>
            <TableHead className="text-right font-semibold text-xs uppercase tracking-wide">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sites.map((site, i) => (
            <TableRow
              key={site.id}
              data-ocid={`admin.sites.row.${i + 1}`}
              className="hover:bg-muted/30 transition-colors"
            >
              <TableCell>
                <div>
                  <p className="text-sm font-semibold text-foreground truncate max-w-[140px]">
                    {site.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                    {site.clientName}
                  </p>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate max-w-[100px]">
                    {site.location}
                  </span>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <span className="text-sm font-semibold text-amber-primary font-mono">
                  {formatRupees(site.totalContractValue)}
                </span>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <span className="text-xs text-muted-foreground">
                  {formatDate(site.startDate)}
                </span>
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground">
                  {truncatePrincipal(site.user)}
                </code>
              </TableCell>
              <TableCell className="text-right">
                <DeleteSiteDialog
                  site={site}
                  index={i + 1}
                  onConfirm={() => handleDeleteSite(site.id, site.name)}
                  isPending={deleteSite.isPending}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Admin Page ────────────────────────────────────────────────

interface AdminPageProps {
  onBack: () => void;
}

export default function AdminPage({ onBack }: AdminPageProps) {
  const { data: isAdmin, isLoading: adminCheckLoading } = useIsCallerAdmin();
  const { data: stats, isLoading: statsLoading } = useAdminGetPlatformStats();

  // Redirect guard
  if (adminCheckLoading) {
    return (
      <div
        data-ocid="admin.loading_state"
        className="min-h-screen bg-background flex items-center justify-center"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    // Auto-redirect
    onBack();
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <HardHat className="w-4 h-4 text-primary-foreground" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-base text-foreground">
                  Admin Panel
                </h1>
                <Badge className="bg-primary/15 text-primary border-primary/20 text-xs font-semibold">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Platform management — SiteTrack
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-6xl mx-auto w-full">
        <Tabs defaultValue="users" className="w-full">
          {/* Tab bar */}
          <div className="bg-card border-b border-border px-4 py-2">
            <TabsList className="bg-muted/50 h-10">
              <TabsTrigger
                data-ocid="admin.users.tab"
                value="users"
                className="gap-1.5 text-sm"
              >
                <Users className="w-3.5 h-3.5" />
                Users
              </TabsTrigger>
              <TabsTrigger
                data-ocid="admin.sites.tab"
                value="sites"
                className="gap-1.5 text-sm"
              >
                <Building2 className="w-3.5 h-3.5" />
                Sites
              </TabsTrigger>
              <TabsTrigger
                data-ocid="admin.stats.tab"
                value="stats"
                className="gap-1.5 text-sm"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Stats
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Users tab */}
          <TabsContent value="users" className="mt-0">
            <div className="p-4 md:px-6 md:pt-5 pb-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display font-bold text-lg text-foreground">
                    All Users
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    View and manage registered users
                  </p>
                </div>
              </div>
            </div>
            <UsersTab />
          </TabsContent>

          {/* Sites tab */}
          <TabsContent value="sites" className="mt-0">
            <div className="p-4 md:px-6 md:pt-5 pb-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display font-bold text-lg text-foreground">
                    All Sites
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Manage construction sites across all users
                  </p>
                </div>
              </div>
            </div>
            <SitesTab />
          </TabsContent>

          {/* Stats tab */}
          <TabsContent value="stats" className="mt-0">
            <div className="p-4 md:px-6 md:pt-5 pb-0">
              <div>
                <h2 className="font-display font-bold text-lg text-foreground">
                  Platform Statistics
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Overall platform performance at a glance
                </p>
              </div>
            </div>
            <StatsTab stats={stats} isLoading={statsLoading} />
          </TabsContent>
        </Tabs>
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
