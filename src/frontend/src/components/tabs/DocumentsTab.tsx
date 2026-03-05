import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  File,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../../backend";
import type { Document } from "../../backend.d";
import {
  useAddDocument,
  useDeleteDocument,
  useGetDocumentsForSite,
} from "../../hooks/useQueries";
import { formatDate, generateId } from "../../utils/format";

interface DocumentsTabProps {
  siteId: string;
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return <FileText className="w-5 h-5 text-destructive" />;
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext ?? "")) {
    return <FileText className="w-5 h-5 text-primary" />;
  }
  return <File className="w-5 h-5 text-muted-foreground" />;
}

export default function DocumentsTab({ siteId }: DocumentsTabProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documents, isLoading } = useGetDocumentsForSite(siteId);
  const addDocument = useAddDocument();
  const deleteDocument = useDeleteDocument(siteId);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
        setUploadProgress(pct);
      });
      const blobId = blob.getDirectURL();

      const docId = generateId();
      const today = new Date().toISOString().split("T")[0];

      const doc: Document = {
        id: docId,
        siteId,
        name: file.name,
        blobId,
        uploadedDate: today,
      };

      await addDocument.mutateAsync({ id: docId, doc });
      toast.success("Document uploaded!");
    } catch {
      toast.error("Failed to upload document. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      await deleteDocument.mutateAsync(id);
      toast.success("Document deleted");
    } catch {
      toast.error("Failed to delete document");
    }
  };

  const sortedDocs = [...(documents ?? [])].sort((a, b) =>
    b.uploadedDate.localeCompare(a.uploadedDate),
  );

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <button
        type="button"
        className="w-full border-2 border-dashed border-primary/30 rounded-2xl p-6 text-center hover:border-primary/60 hover:bg-primary/5 transition-colors cursor-pointer"
        onClick={() => !uploading && fileInputRef.current?.click()}
        data-ocid="document.dropzone"
        disabled={uploading}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
          className="hidden"
          onChange={handleFileSelect}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm font-medium text-foreground">Uploading...</p>
            <div className="w-full max-w-xs bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-1">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <p className="font-semibold text-sm text-foreground">
              Tap to upload document
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, Word, Excel — any file
            </p>
          </div>
        )}
      </button>

      <Button
        data-ocid="document.upload_button"
        onClick={() => !uploading && fileInputRef.current?.click()}
        disabled={uploading}
        variant="outline"
        className="w-full h-11 border-primary/30 text-primary hover:bg-primary/5 font-semibold"
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Choose File
          </>
        )}
      </Button>

      {/* Document list */}
      <div className="space-y-2" data-ocid="document.list">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-semibold text-sm text-foreground">
            Uploaded Documents
          </h3>
          {documents && (
            <span className="text-xs text-muted-foreground">
              {documents.length} files
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : sortedDocs.length === 0 ? (
          <div
            data-ocid="document.empty_state"
            className="text-center py-10 text-muted-foreground"
          >
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No documents uploaded yet.</p>
            <p className="text-xs mt-1 opacity-70">
              Upload agreements, bills, and other files
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedDocs.map((doc, idx) => {
              const blob = ExternalBlob.fromURL(doc.blobId);
              const downloadUrl = blob.getDirectURL();
              return (
                <div
                  key={doc.id}
                  data-ocid={`document.item.${idx + 1}`}
                  className="bg-card border border-border rounded-2xl p-4 shadow-xs flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    {getFileIcon(doc.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {doc.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(doc.uploadedDate)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Download / View"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete"
                      data-ocid={`document.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
