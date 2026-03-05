import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  CalendarDays,
  Download,
  FileText,
  IndianRupee,
  Loader2,
  MapPin,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  useGetCallerUserProfile,
  useGetDailyLogsForSite,
  useGetDocumentsForSite,
  useGetPaymentEntriesForSite,
  useGetSite,
  useGetSiteAggregates,
} from "../hooks/useQueries";
import { formatDate, formatRupees } from "../utils/format";

interface SiteReportModalProps {
  siteId: string;
}

export default function SiteReportModal({ siteId }: SiteReportModalProps) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: site, isLoading: siteLoading } = useGetSite(siteId);
  const { data: aggregates, isLoading: aggregatesLoading } =
    useGetSiteAggregates(siteId);
  const { data: dailyLogs, isLoading: logsLoading } =
    useGetDailyLogsForSite(siteId);
  const { data: payments, isLoading: paymentsLoading } =
    useGetPaymentEntriesForSite(siteId);
  const { data: documents, isLoading: docsLoading } =
    useGetDocumentsForSite(siteId);
  const { data: userProfile, isLoading: profileLoading } =
    useGetCallerUserProfile();

  const isLoading =
    siteLoading ||
    aggregatesLoading ||
    logsLoading ||
    paymentsLoading ||
    docsLoading ||
    profileLoading;

  const sortedLogs = [...(dailyLogs ?? [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const sortedPayments = [...(payments ?? [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  function generatePDF() {
    if (!site || !aggregates) return;
    setIsGenerating(true);

    try {
      // Build printable HTML report and use browser print
      const printContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>${site.name} — Site Report</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; font-size: 11px; color: #1e1b15; background: white; }
            .header { background: #1e1b15; color: white; padding: 16px 20px 14px; }
            .header .brand { color: #d97706; font-size: 7px; font-weight: bold; letter-spacing: 2px; margin-bottom: 6px; }
            .header h1 { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
            .header .meta { font-size: 8px; color: #c4bb9d; }
            .content { padding: 16px 20px; }
            .section-title { font-size: 10px; font-weight: bold; border-left: 3px solid #d97706; padding-left: 8px; margin: 14px 0 8px; }
            .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #fefcf2; border: 1px solid #e5dcc4; border-radius: 4px; padding: 10px; margin-bottom: 10px; }
            .detail-item .label { font-size: 7px; color: #78716e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
            .detail-item .value { font-size: 10px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 10px; }
            th { background: #1e1b15; color: white; padding: 5px 8px; text-align: left; font-size: 8px; }
            th.right { text-align: right; }
            td { padding: 5px 8px; border-bottom: 1px solid #e5dcc4; vertical-align: top; }
            td.right { text-align: right; }
            tr:nth-child(even) td { background: #fefcf2; }
            .footer { margin-top: 16px; padding-top: 8px; border-top: 1px solid #e5dcc4; display: flex; justify-content: space-between; font-size: 7px; color: #78716e; }
            .no-data { color: #78716e; font-style: italic; font-size: 9px; margin-bottom: 10px; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">SITETRACK</div>
            <h1>${site.name} — Site Report</h1>
            <div class="meta">
              Generated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              ${userProfile ? ` &nbsp;·&nbsp; Prepared by: ${userProfile.name}${userProfile.companyName ? ` · ${userProfile.companyName}` : ""}` : ""}
            </div>
          </div>
          <div class="content">
            <div class="section-title">Site Details</div>
            <div class="detail-grid">
              <div class="detail-item"><div class="label">Client Name</div><div class="value">${site.clientName}</div></div>
              <div class="detail-item"><div class="label">Location</div><div class="value">${site.location}</div></div>
              <div class="detail-item"><div class="label">Contract Value</div><div class="value">${formatRupees(site.totalContractValue)}</div></div>
              <div class="detail-item"><div class="label">Start Date</div><div class="value">${formatDate(site.startDate)}</div></div>
            </div>

            <div class="section-title">Financial Summary</div>
            <table>
              <thead><tr><th>Metric</th><th class="right">Amount</th></tr></thead>
              <tbody>
                <tr><td>Total Received</td><td class="right">${formatRupees(aggregates.totalReceived)}</td></tr>
                <tr><td>Total Expense</td><td class="right">${formatRupees(aggregates.totalExpense)}</td></tr>
                <tr><td>${Number(aggregates.profitLoss) >= 0 ? "Profit" : "Loss"}</td><td class="right">${formatRupees(aggregates.profitLoss)}</td></tr>
                <tr><td>Pending Amount</td><td class="right">${formatRupees(aggregates.pendingAmount)}</td></tr>
              </tbody>
            </table>

            <div class="section-title">Daily Logs (${sortedLogs.length})</div>
            ${
              sortedLogs.length === 0
                ? '<div class="no-data">No daily logs recorded yet.</div>'
                : `<table>
                  <thead><tr><th>Date</th><th>Labour</th><th>Work Done</th><th class="right">Material Expense</th></tr></thead>
                  <tbody>${sortedLogs.map((log) => `<tr><td>${formatDate(log.date)}</td><td>${Number(log.labourCount)}</td><td>${log.workDone}</td><td class="right">${formatRupees(log.materialExpense)}</td></tr>`).join("")}</tbody>
                </table>`
            }

            <div class="section-title">Payments (${sortedPayments.length})</div>
            ${
              sortedPayments.length === 0
                ? '<div class="no-data">No payments recorded yet.</div>'
                : `<table>
                  <thead><tr><th>Date</th><th class="right">Amount Received</th><th>Notes</th></tr></thead>
                  <tbody>${sortedPayments.map((p) => `<tr><td>${formatDate(p.date)}</td><td class="right">${formatRupees(p.amountReceived)}</td><td>${p.notes || "—"}</td></tr>`).join("")}</tbody>
                </table>`
            }

            <div class="section-title">Documents (${(documents ?? []).length})</div>
            ${
              !documents || documents.length === 0
                ? '<div class="no-data">No documents uploaded yet.</div>'
                : `<table>
                  <thead><tr><th>Document Name</th><th>Uploaded Date</th></tr></thead>
                  <tbody>${documents.map((d) => `<tr><td>${d.name}</td><td>${formatDate(d.uploadedDate)}</td></tr>`).join("")}</tbody>
                </table>`
            }

            <div class="footer">
              <span>SiteTrack — Confidential</span>
              <span>${new Date().toLocaleDateString("en-IN")}</span>
            </div>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Please allow popups to download the report.");
        return;
      }
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-medium border-border hover:bg-muted"
          data-ocid="site.generate_report_button"
        >
          <FileText className="w-3.5 h-3.5" />
          Report
        </Button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-md w-[calc(100vw-2rem)] rounded-2xl p-0 overflow-hidden"
        data-ocid="site.report_modal"
      >
        {/* Modal header */}
        <DialogHeader className="px-5 pt-5 pb-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground leading-tight">
                Generate Site Report
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isLoading
                  ? "Loading data…"
                  : `PDF report for ${site?.name ?? "this site"}`}
              </p>
            </div>
          </div>
        </DialogHeader>

        <Separator className="mt-4" />

        {/* Preview body */}
        <div className="px-5 py-4 space-y-3">
          {isLoading ? (
            <div className="space-y-2.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              {/* Site info */}
              <PreviewRow
                icon={<Building2 className="w-3.5 h-3.5" />}
                label="Site Details"
                value={`${site?.clientName} · ${site?.location}`}
              />

              {/* Financial */}
              <PreviewRow
                icon={<IndianRupee className="w-3.5 h-3.5" />}
                label="Financial Summary"
                value={
                  aggregates
                    ? `Received ${formatRupees(aggregates.totalReceived)} · Expense ${formatRupees(aggregates.totalExpense)}`
                    : "—"
                }
              />
              <div className="grid grid-cols-2 gap-2">
                <MiniStat
                  label="Profit / Loss"
                  value={aggregates ? formatRupees(aggregates.profitLoss) : "—"}
                  positive={
                    aggregates ? Number(aggregates.profitLoss) >= 0 : true
                  }
                />
                <MiniStat
                  label="Pending"
                  value={
                    aggregates ? formatRupees(aggregates.pendingAmount) : "—"
                  }
                />
              </div>

              {/* Counts */}
              <div className="grid grid-cols-3 gap-2">
                <CountBadge
                  icon={<TrendingUp className="w-3 h-3" />}
                  count={sortedLogs.length}
                  label="Daily Logs"
                />
                <CountBadge
                  icon={<IndianRupee className="w-3 h-3" />}
                  count={sortedPayments.length}
                  label="Payments"
                />
                <CountBadge
                  icon={<FileText className="w-3 h-3" />}
                  count={documents?.length ?? 0}
                  label="Documents"
                />
              </div>

              {/* User / date */}
              {userProfile && (
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-xl">
                  <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    Prepared by{" "}
                    <span className="text-foreground font-medium">
                      {userProfile.name}
                    </span>
                    {userProfile.companyName && (
                      <> · {userProfile.companyName}</>
                    )}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-xl">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">
                  Generated on{" "}
                  <span className="text-foreground font-medium">
                    {new Date().toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </span>
              </div>
            </>
          )}
        </div>

        <Separator />

        {/* Footer actions */}
        <div className="px-5 py-4 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setOpen(false)}
            data-ocid="site.report_cancel_button"
          >
            <X className="w-4 h-4 mr-1.5" />
            Cancel
          </Button>
          <Button
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={generatePDF}
            disabled={isLoading || isGenerating || !site || !aggregates}
            data-ocid="site.report_download_button"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-1.5" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function PreviewRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5 bg-muted/30 rounded-xl border border-border/50">
      <span className="text-primary mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide leading-none mb-0.5">
          {label}
        </p>
        <p className="text-xs text-foreground font-medium leading-snug truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="px-3 py-2.5 bg-muted/30 rounded-xl border border-border/50 text-center">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide leading-none mb-1">
        {label}
      </p>
      <p
        className={`text-sm font-bold ${positive === false ? "text-destructive" : "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}

function CountBadge({
  icon,
  count,
  label,
}: {
  icon: React.ReactNode;
  count: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-2 py-2.5 bg-primary/5 rounded-xl border border-primary/15">
      <span className="text-primary">{icon}</span>
      <p className="text-base font-bold text-foreground leading-none">
        {count}
      </p>
      <p className="text-[10px] text-muted-foreground leading-none">{label}</p>
    </div>
  );
}
