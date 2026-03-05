import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarDays,
  Camera,
  ChevronDown,
  FileText,
  IndianRupee,
  Loader2,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../../backend";
import type { DailyLog } from "../../backend.d";
import {
  useAddDailyLog,
  useDeleteDailyLog,
  useGetDailyLogsForSite,
} from "../../hooks/useQueries";
import {
  formatDate,
  formatRupees,
  generateId,
  getTodayDate,
} from "../../utils/format";

interface DailyLogTabProps {
  siteId: string;
  autoOpenForm?: boolean;
}

const MAX_PHOTOS = 3;

export default function DailyLogTab({
  siteId,
  autoOpenForm,
}: DailyLogTabProps) {
  const [showForm, setShowForm] = useState(autoOpenForm ?? true);
  const [form, setForm] = useState({
    date: getTodayDate(),
    labourCount: "",
    workDone: "",
    materialExpense: "",
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: logs, isLoading } = useGetDailyLogsForSite(siteId);
  const addLog = useAddDailyLog();
  const deleteLog = useDeleteDailyLog(siteId);

  const setField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_PHOTOS - photos.length;
    const toAdd = files.slice(0, remaining);

    const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
    setPhotos((prev) => [...prev, ...toAdd]);
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const removePhoto = (idx: number) => {
    URL.revokeObjectURL(photoPreviews[idx]);
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = () => {
    const newErrors: Partial<typeof form> = {};
    if (!form.date) newErrors.date = "Date is required";
    if (!form.workDone.trim())
      newErrors.workDone = "Work done description is required";
    if (form.materialExpense && Number.isNaN(Number(form.materialExpense))) {
      newErrors.materialExpense = "Enter a valid amount";
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    // Upload photos using ExternalBlob
    const photoBlobIds: string[] = [];

    try {
      await Promise.all(
        photos.map(async (file) => {
          const bytes = new Uint8Array(await file.arrayBuffer());
          const blob = ExternalBlob.fromBytes(bytes);
          const url = blob.getDirectURL();
          photoBlobIds.push(url);
        }),
      );
    } catch {
      toast.error("Failed to upload photos. Please try again.");
      setIsSubmitting(false);
      return;
    }

    const logId = generateId();
    const log: DailyLog = {
      id: logId,
      siteId,
      date: form.date,
      labourCount: BigInt(
        form.labourCount ? Math.round(Number(form.labourCount)) : 0,
      ),
      workDone: form.workDone.trim(),
      materialExpense: BigInt(
        form.materialExpense ? Math.round(Number(form.materialExpense)) : 0,
      ),
      photoBlobIds,
    };

    try {
      await addLog.mutateAsync({ id: logId, log });
      toast.success("Daily log saved!");
      setForm({
        date: getTodayDate(),
        labourCount: "",
        workDone: "",
        materialExpense: "",
      });
      // Cleanup preview URLs
      for (const url of photoPreviews) {
        URL.revokeObjectURL(url);
      }
      setPhotos([]);
      setPhotoPreviews([]);
      setShowForm(false);
    } catch {
      toast.error("Failed to save log. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this log entry?")) return;
    try {
      await deleteLog.mutateAsync(id);
      toast.success("Log deleted");
    } catch {
      toast.error("Failed to delete log");
    }
  };

  const sortedLogs = [...(logs ?? [])].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  return (
    <div className="space-y-4">
      {/* Form toggle */}
      <button
        type="button"
        onClick={() => setShowForm((v) => !v)}
        className="w-full flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-2xl hover:bg-primary/10 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">
            {showForm ? "Hide Form" : "Add Today's Log"}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${showForm ? "rotate-180" : ""}`}
        />
      </button>

      {/* Log form */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl shadow-card p-5 animate-fade-up">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Date
                </Label>
                <div className="relative">
                  <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    data-ocid="daily_log.date_input"
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

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Labour Count
                </Label>
                <div className="relative">
                  <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    data-ocid="daily_log.labour_input"
                    type="number"
                    placeholder="0"
                    value={form.labourCount}
                    onChange={(e) => setField("labourCount", e.target.value)}
                    className="pl-8 h-10 text-sm"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Work Done{" "}
                <span className="text-destructive normal-case">*</span>
              </Label>
              <Textarea
                data-ocid="daily_log.work_input"
                placeholder="Describe the work completed today..."
                value={form.workDone}
                onChange={(e) => setField("workDone", e.target.value)}
                className="resize-none min-h-[80px] text-sm"
                rows={3}
              />
              {errors.workDone && (
                <p className="text-xs text-destructive">{errors.workDone}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Material Expense (₹)
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  data-ocid="daily_log.expense_input"
                  type="number"
                  placeholder="0"
                  value={form.materialExpense}
                  onChange={(e) => setField("materialExpense", e.target.value)}
                  className="pl-8 h-10 text-sm"
                  min="0"
                />
              </div>
              {errors.materialExpense && (
                <p className="text-xs text-destructive">
                  {errors.materialExpense}
                </p>
              )}
            </div>

            {/* Photo upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Photos ({photos.length}/{MAX_PHOTOS})
              </Label>
              <div className="flex gap-2 flex-wrap">
                {photoPreviews.map((src, idx) => (
                  <div
                    key={src}
                    className="relative w-20 h-20 rounded-xl overflow-hidden border border-border"
                  >
                    <img
                      src={src}
                      alt={`Site work ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <button
                    type="button"
                    data-ocid="daily_log.photo_upload"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-1"
                  >
                    <Camera className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Add</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </div>

            <Button
              data-ocid="daily_log.submit_button"
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Log"
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Past logs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-semibold text-sm text-foreground">Past Logs</h3>
          {logs && (
            <span className="text-xs text-muted-foreground">
              {logs.length} entries
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : sortedLogs.length === 0 ? (
          <div
            data-ocid="daily_log.empty_state"
            className="text-center py-10 text-muted-foreground"
          >
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No logs yet. Add your first log above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedLogs.map((log, idx) => (
              <div
                key={log.id}
                data-ocid={`daily_log.item.${idx + 1}`}
                className="bg-card border border-border rounded-2xl p-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-semibold text-sm text-foreground">
                      {formatDate(log.date)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(log.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Delete log"
                    data-ocid={`daily_log.delete_button.${idx + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-sm text-foreground mb-3 leading-relaxed">
                  {log.workDone}
                </p>

                <div className="flex flex-wrap gap-2 text-xs">
                  {Number(log.labourCount) > 0 && (
                    <span className="flex items-center gap-1 bg-secondary px-2.5 py-1 rounded-full text-secondary-foreground font-medium">
                      <Users className="w-3 h-3" />
                      {Number(log.labourCount)} workers
                    </span>
                  )}
                  {Number(log.materialExpense) > 0 && (
                    <span className="flex items-center gap-1 bg-destructive/10 px-2.5 py-1 rounded-full text-destructive font-medium">
                      <IndianRupee className="w-3 h-3" />
                      {formatRupees(log.materialExpense)}
                    </span>
                  )}
                  {log.photoBlobIds.length > 0 && (
                    <span className="flex items-center gap-1 bg-accent px-2.5 py-1 rounded-full text-accent-foreground font-medium">
                      <Camera className="w-3 h-3" />
                      {log.photoBlobIds.length} photo
                      {log.photoBlobIds.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Photo thumbnails */}
                {log.photoBlobIds.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {log.photoBlobIds.map((blobId, pIdx) => {
                      const blob = ExternalBlob.fromURL(blobId);
                      const url = blob.getDirectURL();
                      return (
                        <a
                          key={blobId}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-14 h-14 rounded-lg overflow-hidden border border-border hover:opacity-80 transition-opacity block"
                        >
                          <img
                            src={url}
                            alt={`Work site ${pIdx + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
