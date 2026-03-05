import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Loader2, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveUserProfile } from "../hooks/useQueries";

interface ProfileSetupProps {
  onComplete: () => void;
}

export default function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [nameError, setNameError] = useState("");

  const saveProfile = useSaveUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError("");

    if (!name.trim()) {
      setNameError("Name is required");
      return;
    }

    try {
      await saveProfile.mutateAsync({
        name: name.trim(),
        companyName: companyName.trim() || undefined,
      });
      toast.success("Profile saved!");
      onComplete();
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="h-1.5 bg-primary w-full" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-accent-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Set up your profile
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Tell us a bit about yourself to get started
            </p>
          </div>

          {/* Form */}
          <div className="bg-card border border-border rounded-2xl shadow-card p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="profile-name" className="text-sm font-medium">
                  Your Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="profile-name"
                    data-ocid="profile.name_input"
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameError) setNameError("");
                    }}
                    className="pl-9 h-11"
                    autoFocus
                  />
                </div>
                {nameError && (
                  <p className="text-xs text-destructive">{nameError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="profile-company"
                  className="text-sm font-medium"
                >
                  Company Name{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="profile-company"
                    data-ocid="profile.company_input"
                    type="text"
                    placeholder="e.g. Kumar Constructions"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="pl-9 h-11"
                  />
                </div>
              </div>

              <Button
                data-ocid="profile.save_button"
                type="submit"
                disabled={saveProfile.isPending}
                className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground mt-2"
              >
                {saveProfile.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Continue →"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
