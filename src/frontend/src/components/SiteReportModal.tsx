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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentW = pageW - margin * 2;
      let y = margin;

      // ── Colors ──────────────────────────────────────────────────
      const amber = [217, 119, 6] as [number, number, number];
      const dark = [30, 27, 21] as [number, number, number];
      const muted = [120, 113, 99] as [number, number, number];
      const white = [255, 255, 255] as [number, number, number];
      const light = [254, 252, 242] as [number, number, number];
      const border = [229, 220, 196] as [number, number, number];

      // ── Header Banner ────────────────────────────────────────────
      doc.setFillColor(...dark);
      doc.rect(0, 0, pageW, 42, "F");

      doc.setTextColor(...amber);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("SITETRACK", margin, 13);

      doc.setTextColor(...white);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      const title = `${site.name} — Site Report`;
      doc.text(title, margin, 24);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(196, 187, 163);
      const generatedLine = `Generated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`;
      const preparedBy = userProfile
        ? `Prepared by: ${userProfile.name}${userProfile.companyName ? ` · ${userProfile.companyName}` : ""}`
        : "";
      doc.text(generatedLine, margin, 32);
      if (preparedBy) doc.text(preparedBy, margin, 38);

      y = 52;

      // ── Helper: Section heading ──────────────────────────────────
      function drawSection(label: string) {
        if (y > pageH - 40) {
          doc.addPage();
          y = margin;
        }
        doc.setFillColor(...amber);
        doc.rect(margin, y, 3, 6, "F");
        doc.setTextColor(...dark);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(label, margin + 6, y + 4.5);
        y += 10;
      }

      // ── Helper: key-value row ───────────────────────────────────
      function drawKV(label: string, value: string, col = 0) {
        const colW = contentW / 2;
        const x = margin + col * colW;
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...muted);
        doc.text(label, x, y);
        doc.setTextColor(...dark);
        doc.setFont("helvetica", "bold");
        doc.text(value, x, y + 5);
        if (col === 1) y += 12;
      }

      // ── Site Details ─────────────────────────────────────────────
      drawSection("Site Details");
      doc.setFillColor(...light);
      doc.roundedRect(margin, y, contentW, 26, 2, 2, "F");
      doc.setDrawColor(...border);
      doc.roundedRect(margin, y, contentW, 26, 2, 2, "S");
      y += 5;
      drawKV("Client Name", site.clientName, 0);
      drawKV("Location", site.location, 1);
      drawKV("Contract Value", formatRupees(site.totalContractValue), 0);
      drawKV("Start Date", formatDate(site.startDate), 1);
      y += 4;

      // ── Financial Summary ────────────────────────────────────────
      drawSection("Financial Summary");
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Metric", "Amount"]],
        body: [
          ["Total Received", formatRupees(aggregates.totalReceived)],
          ["Total Expense", formatRupees(aggregates.totalExpense)],
          [
            Number(aggregates.profitLoss) >= 0 ? "Profit" : "Loss",
            formatRupees(aggregates.profitLoss),
          ],
          ["Pending Amount", formatRupees(aggregates.pendingAmount)],
        ],
        theme: "grid",
        headStyles: {
          fillColor: dark,
          textColor: white,
          fontStyle: "bold",
          fontSize: 9,
        },
        bodyStyles: { fontSize: 9, textColor: dark },
        alternateRowStyles: { fillColor: light },
        columnStyles: { 1: { halign: "right" } },
      });
      y =
        (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
          .finalY + 8;

      // ── Daily Logs ───────────────────────────────────────────────
      drawSection(`Daily Logs (${sortedLogs.length})`);
      if (sortedLogs.length === 0) {
        doc.setFontSize(9);
        doc.setTextColor(...muted);
        doc.text("No daily logs recorded yet.", margin, y);
        y += 8;
      } else {
        autoTable(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          head: [["Date", "Labour", "Work Done", "Material Expense"]],
          body: sortedLogs.map((log) => [
            formatDate(log.date),
            String(Number(log.labourCount)),
            log.workDone,
            formatRupees(log.materialExpense),
          ]),
          theme: "grid",
          headStyles: {
            fillColor: dark,
            textColor: white,
            fontStyle: "bold",
            fontSize: 8,
          },
          bodyStyles: { fontSize: 8, textColor: dark },
          alternateRowStyles: { fillColor: light },
          columnStyles: {
            0: { cellWidth: 24 },
            1: { cellWidth: 16, halign: "center" },
            2: { cellWidth: "auto" },
            3: { cellWidth: 30, halign: "right" },
          },
        });
        y =
          (doc as unknown as { lastAutoTable: { finalY: number } })
            .lastAutoTable.finalY + 8;
      }

      // ── Payments ─────────────────────────────────────────────────
      drawSection(`Payments (${sortedPayments.length})`);
      if (sortedPayments.length === 0) {
        doc.setFontSize(9);
        doc.setTextColor(...muted);
        doc.text("No payments recorded yet.", margin, y);
        y += 8;
      } else {
        autoTable(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          head: [["Date", "Amount Received", "Notes"]],
          body: sortedPayments.map((p) => [
            formatDate(p.date),
            formatRupees(p.amountReceived),
            p.notes || "—",
          ]),
          theme: "grid",
          headStyles: {
            fillColor: dark,
            textColor: white,
            fontStyle: "bold",
            fontSize: 8,
          },
          bodyStyles: { fontSize: 8, textColor: dark },
          alternateRowStyles: { fillColor: light },
          columnStyles: {
            0: { cellWidth: 24 },
            1: { cellWidth: 35, halign: "right" },
            2: { cellWidth: "auto" },
          },
        });
        y =
          (doc as unknown as { lastAutoTable: { finalY: number } })
            .lastAutoTable.finalY + 8;
      }

      // ── Documents ────────────────────────────────────────────────
      drawSection(`Documents (${(documents ?? []).length})`);
      if (!documents || documents.length === 0) {
        doc.setFontSize(9);
        doc.setTextColor(...muted);
        doc.text("No documents uploaded yet.", margin, y);
        y += 8;
      } else {
        autoTable(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          head: [["Document Name", "Uploaded Date"]],
          body: documents.map((d) => [d.name, formatDate(d.uploadedDate)]),
          theme: "grid",
          headStyles: {
            fillColor: dark,
            textColor: white,
            fontStyle: "bold",
            fontSize: 8,
          },
          bodyStyles: { fontSize: 8, textColor: dark },
          alternateRowStyles: { fillColor: light },
          columnStyles: { 1: { cellWidth: 35 } },
        });
      }

      // ── Footer on every page ─────────────────────────────────────
      const totalPages = (
        doc.internal as unknown as { getNumberOfPages(): number }
      ).getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(...border);
        doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...muted);
        doc.text("SiteTrack — Confidential", margin, pageH - 7);
        doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 7, {
          align: "right",
        });
      }

      const safeFileName = site.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      doc.save(`${safeFileName}_site_report.pdf`);
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
