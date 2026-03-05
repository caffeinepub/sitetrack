import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Principal } from "@icp-sdk/core/principal";
import {
  Building2,
  Calendar,
  IndianRupee,
  Loader2,
  MapPin,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCreateSite } from "../hooks/useQueries";
import { generateId, getTodayDate } from "../utils/format";

interface CreateSitePageProps {
  onCreated: (siteId: string) => void;
}

export default function CreateSitePage({ onCreated }: CreateSitePageProps) {
  const { identity } = useInternetIdentity();
  const createSite = useCreateSite();

  const [form, setForm] = useState({
    name: "",
    clientName: "",
    location: "",
    totalContractValue: "",
    startDate: getTodayDate(),
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const validate = () => {
    const newErrors: Partial<typeof form> = {};
    if (!form.name.trim()) newErrors.name = "Site name is required";
    if (!form.clientName.trim())
      newErrors.clientName = "Client name is required";
    if (!form.location.trim()) newErrors.location = "Location is required";
    if (
      !form.totalContractValue ||
      Number.isNaN(Number(form.totalContractValue)) ||
      Number(form.totalContractValue) <= 0
    ) {
      newErrors.totalContractValue = "Enter a valid contract value";
    }
    if (!form.startDate) newErrors.startDate = "Start date is required";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const siteId = generateId();
    const principal = identity?.getPrincipal() ?? Principal.anonymous();

    try {
      await createSite.mutateAsync({
        id: siteId,
        site: {
          id: siteId,
          name: form.name.trim(),
          clientName: form.clientName.trim(),
          location: form.location.trim(),
          totalContractValue: BigInt(
            Math.round(Number(form.totalContractValue)),
          ),
          startDate: form.startDate,
          user: principal,
        },
      });
      toast.success("Site created successfully!");
      onCreated(siteId);
    } catch {
      toast.error("Failed to create site. Please try again.");
    }
  };

  const setField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-foreground">
                Create Your Site
              </h1>
              <p className="text-xs text-muted-foreground">
                Free plan — 1 site included
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-6">
        {/* Welcome banner */}
        <div className="construction-pattern bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-6">
          <h2 className="font-display text-xl font-bold text-foreground mb-1">
            Welcome to SiteTrack! 👷
          </h2>
          <p className="text-sm text-muted-foreground">
            Set up your construction site to start tracking daily logs,
            payments, and documents.
          </p>
        </div>

        {/* Form */}
        <div className="bg-card border border-border rounded-2xl shadow-card p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="site-name" className="text-sm font-semibold">
                Site Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="site-name"
                  data-ocid="create_site.name_input"
                  type="text"
                  placeholder="e.g. Sharma Residence - Phase 1"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  className="pl-9 h-11"
                />
              </div>
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-name" className="text-sm font-semibold">
                Client Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="client-name"
                  data-ocid="create_site.client_input"
                  type="text"
                  placeholder="e.g. Ravi Sharma"
                  value={form.clientName}
                  onChange={(e) => setField("clientName", e.target.value)}
                  className="pl-9 h-11"
                />
              </div>
              {errors.clientName && (
                <p className="text-xs text-destructive">{errors.clientName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-semibold">
                Location <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="location"
                  data-ocid="create_site.location_input"
                  type="text"
                  placeholder="e.g. Koramangala, Bengaluru"
                  value={form.location}
                  onChange={(e) => setField("location", e.target.value)}
                  className="pl-9 h-11"
                />
              </div>
              {errors.location && (
                <p className="text-xs text-destructive">{errors.location}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract-value" className="text-sm font-semibold">
                Total Contract Value (₹){" "}
                <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="contract-value"
                  data-ocid="create_site.contract_value_input"
                  type="number"
                  placeholder="e.g. 2500000"
                  value={form.totalContractValue}
                  onChange={(e) =>
                    setField("totalContractValue", e.target.value)
                  }
                  className="pl-9 h-11"
                  min="0"
                />
              </div>
              {errors.totalContractValue && (
                <p className="text-xs text-destructive">
                  {errors.totalContractValue}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-sm font-semibold">
                Start Date <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="start-date"
                  data-ocid="create_site.start_date_input"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setField("startDate", e.target.value)}
                  className="pl-9 h-11"
                />
              </div>
              {errors.startDate && (
                <p className="text-xs text-destructive">{errors.startDate}</p>
              )}
            </div>

            <Button
              data-ocid="create_site.submit_button"
              type="submit"
              disabled={createSite.isPending}
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground mt-2"
            >
              {createSite.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Site...
                </>
              ) : (
                "Create Site →"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
