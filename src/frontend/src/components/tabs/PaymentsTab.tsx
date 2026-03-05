import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarDays,
  ChevronDown,
  IndianRupee,
  Loader2,
  MessageSquare,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { PaymentEntry } from "../../backend.d";
import {
  useAddPaymentEntry,
  useDeletePaymentEntry,
  useGetPaymentEntriesForSite,
} from "../../hooks/useQueries";
import {
  formatDate,
  formatRupees,
  generateId,
  getTodayDate,
} from "../../utils/format";

interface PaymentsTabProps {
  siteId: string;
}

export default function PaymentsTab({ siteId }: PaymentsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    date: getTodayDate(),
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const { data: payments, isLoading } = useGetPaymentEntriesForSite(siteId);
  const addPayment = useAddPaymentEntry();
  const deletePayment = useDeletePaymentEntry(siteId);

  const setField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const newErrors: Partial<typeof form> = {};
    if (
      !form.amount ||
      Number.isNaN(Number(form.amount)) ||
      Number(form.amount) <= 0
    ) {
      newErrors.amount = "Enter a valid amount";
    }
    if (!form.date) newErrors.date = "Date is required";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const entryId = generateId();
    const entry: PaymentEntry = {
      id: entryId,
      siteId,
      amountReceived: BigInt(Math.round(Number(form.amount))),
      date: form.date,
      notes: form.notes.trim(),
    };

    try {
      await addPayment.mutateAsync({ id: entryId, entry });
      toast.success("Payment recorded!");
      setForm({ amount: "", date: getTodayDate(), notes: "" });
      setShowForm(false);
    } catch {
      toast.error("Failed to save payment. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this payment entry?")) return;
    try {
      await deletePayment.mutateAsync(id);
      toast.success("Payment deleted");
    } catch {
      toast.error("Failed to delete payment");
    }
  };

  const sortedPayments = [...(payments ?? [])].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  const totalReceived = sortedPayments.reduce(
    (sum, p) => sum + p.amountReceived,
    BigInt(0),
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      {payments && payments.length > 0 && (
        <div className="bg-success/10 border border-success/20 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              Total Received
            </p>
            <p className="financial-number text-2xl text-success">
              {formatRupees(totalReceived)}
            </p>
          </div>
        </div>
      )}

      {/* Form toggle */}
      <button
        type="button"
        onClick={() => setShowForm((v) => !v)}
        className="w-full flex items-center justify-between p-4 bg-success/5 border border-success/20 rounded-2xl hover:bg-success/10 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-success" />
          <span className="font-semibold text-foreground">
            {showForm ? "Hide Form" : "Record Payment"}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${showForm ? "rotate-180" : ""}`}
        />
      </button>

      {/* Payment form */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl shadow-card p-5 animate-fade-up">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Amount (₹){" "}
                  <span className="text-destructive normal-case">*</span>
                </Label>
                <div className="relative">
                  <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    data-ocid="payment.amount_input"
                    type="number"
                    placeholder="0"
                    value={form.amount}
                    onChange={(e) => setField("amount", e.target.value)}
                    className="pl-8 h-10 text-sm"
                    min="0"
                  />
                </div>
                {errors.amount && (
                  <p className="text-xs text-destructive">{errors.amount}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Date <span className="text-destructive normal-case">*</span>
                </Label>
                <div className="relative">
                  <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    data-ocid="payment.date_input"
                    type="date"
                    value={form.date}
                    onChange={(e) => setField("date", e.target.value)}
                    className="pl-8 h-10 text-sm"
                  />
                </div>
                {errors.date && (
                  <p className="text-xs text-destructive">{errors.date}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Notes
              </Label>
              <Textarea
                data-ocid="payment.notes_input"
                placeholder="e.g. 2nd installment - foundation work"
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                className="resize-none text-sm min-h-[70px]"
                rows={2}
              />
            </div>

            <Button
              data-ocid="payment.submit_button"
              type="submit"
              disabled={addPayment.isPending}
              className="w-full h-11 bg-success hover:bg-success/90 text-success-foreground font-semibold"
            >
              {addPayment.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Record Payment"
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Payment list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-semibold text-sm text-foreground">
            Payment History
          </h3>
          {payments && (
            <span className="text-xs text-muted-foreground">
              {payments.length} entries
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : sortedPayments.length === 0 ? (
          <div
            data-ocid="payment.empty_state"
            className="text-center py-10 text-muted-foreground"
          >
            <IndianRupee className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No payments recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedPayments.map((payment, idx) => (
              <div
                key={payment.id}
                data-ocid={`payment.item.${idx + 1}`}
                className="bg-card border border-border rounded-2xl p-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(payment.date)}
                      </span>
                    </div>
                    <p className="financial-number text-xl text-success">
                      {formatRupees(payment.amountReceived)}
                    </p>
                    {payment.notes && (
                      <div className="flex items-start gap-1.5 mt-2">
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {payment.notes}
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(payment.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    title="Delete payment"
                    data-ocid={`payment.delete_button.${idx + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
