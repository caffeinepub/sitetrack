import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FolderOpen,
  HardHat,
  IndianRupee,
  MapPin,
} from "lucide-react";
import { useGetSite } from "../hooks/useQueries";
import { formatDate, formatRupees } from "../utils/format";
import SiteReportModal from "./SiteReportModal";
import DailyLogTab from "./tabs/DailyLogTab";
import DocumentsTab from "./tabs/DocumentsTab";
import PaymentsTab from "./tabs/PaymentsTab";

interface SitePageProps {
  siteId: string;
  defaultTab?: "daily-log" | "payments" | "documents";
  onBack: () => void;
}

export default function SitePage({
  siteId,
  defaultTab = "daily-log",
  onBack,
}: SitePageProps) {
  const { data: site, isLoading } = useGetSite(siteId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <HardHat className="w-4 h-4 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              {isLoading ? (
                <Skeleton className="h-5 w-40" />
              ) : (
                <h1 className="font-display font-bold text-base text-foreground truncate">
                  {site?.name ?? "Site"}
                </h1>
              )}
            </div>

            <SiteReportModal siteId={siteId} />
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-auto w-full">
        {/* Site info banner */}
        {isLoading ? (
          <div className="p-4 border-b border-border">
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : site ? (
          <div className="bg-primary/5 border-b border-primary/10 px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" />
                <span>{site.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <IndianRupee className="w-3 h-3 shrink-0" />
                <span>{formatRupees(site.totalContractValue)} contract</span>
              </div>
              <div className="flex items-center gap-1">
                <CalendarDays className="w-3 h-3 shrink-0" />
                <span>Since {formatDate(site.startDate)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Client:{" "}
              <span className="font-medium text-foreground">
                {site.clientName}
              </span>
            </p>
          </div>
        ) : null}

        {/* Tabs */}
        <Tabs defaultValue={defaultTab} className="flex-1">
          <div className="sticky top-[57px] z-10 bg-background border-b border-border">
            <TabsList className="w-full h-12 rounded-none bg-transparent p-0 border-0">
              <TabsTrigger
                value="daily-log"
                data-ocid="site.daily_log_tab"
                className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent text-muted-foreground font-medium text-sm gap-1.5"
              >
                <ClipboardList className="w-4 h-4" />
                Daily Log
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                data-ocid="site.payments_tab"
                className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent text-muted-foreground font-medium text-sm gap-1.5"
              >
                <CreditCard className="w-4 h-4" />
                Payments
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                data-ocid="site.documents_tab"
                className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent text-muted-foreground font-medium text-sm gap-1.5"
              >
                <FolderOpen className="w-4 h-4" />
                Documents
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="daily-log" className="p-4 pb-8 mt-0">
            <DailyLogTab
              siteId={siteId}
              autoOpenForm={defaultTab === "daily-log"}
            />
          </TabsContent>

          <TabsContent value="payments" className="p-4 pb-8 mt-0">
            <PaymentsTab siteId={siteId} />
          </TabsContent>

          <TabsContent value="documents" className="p-4 pb-8 mt-0">
            <DocumentsTab siteId={siteId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
