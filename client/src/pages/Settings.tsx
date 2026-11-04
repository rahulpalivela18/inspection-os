import { useState } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  Save,
  Image as ImageIcon,
  FileText,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isAdminRole, compressImageFile } from "@/lib/utils";
import { pdfFileToPageImages } from "@/lib/pdf";

export default function Settings() {
  const { user, workspace, refreshWorkspace } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAdmin = isAdminRole(user?.role);

  const [profile, setProfile] = useState({
    name: workspace?.name || "",
    email: workspace?.email || "",
    phone: workspace?.phone || "",
    address: workspace?.address || "",
    logoUrl: workspace?.logoUrl || "",
  });
  const [logoPreview, setLogoPreview] = useState(workspace?.logoUrl || "");
  const [introPages, setIntroPages] = useState<string[]>(
    workspace?.reportFrontPages || [],
  );
  const [uploadingPages, setUploadingPages] = useState(false);

  const saveMutation = useMutation({
    mutationFn: () => api.updateWorkspace(profile),
    onSuccess: (data: any) => {
      refreshWorkspace(data);
      toast({
        title: "Settings Saved",
        description: "Your company profile has been updated.",
      });
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { dataUrl } = await compressImageFile(file, 512, 0.85);
      setProfile({ ...profile, logoUrl: dataUrl });
      setLogoPreview(dataUrl);
    } catch {
      // compression failed — user can retry
    }
  };

  const saveIntroMutation = useMutation({
    mutationFn: () => api.updateWorkspace({ reportFrontPages: introPages }),
    onSuccess: (data: any) => {
      refreshWorkspace(data);
      if (Array.isArray(data?.reportFrontPages))
        setIntroPages(data.reportFrontPages);
      toast({
        title: "Report intro pages saved",
        description: "These pages will be added to the start of every report PDF.",
      });
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  const handleIntroPagesUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingPages(true);
    try {
      const added: string[] = [];
      for (const file of files) {
        const isPdf =
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf");
        if (isPdf) {
          added.push(...(await pdfFileToPageImages(file)));
        } else if (file.type.startsWith("image/")) {
          const { dataUrl } = await compressImageFile(file, 1600, 0.85);
          added.push(dataUrl);
        }
      }
      if (!added.length) {
        toast({
          title: "Nothing added",
          description: "Upload a PDF or image file.",
          variant: "destructive",
        });
        return;
      }
      setIntroPages((prev) => [...prev, ...added]);
      toast({
        title: `${added.length} page${added.length === 1 ? "" : "s"} added`,
        description: "Review the order, then save your changes.",
      });
    } catch (err: any) {
      toast({
        title: "Could not read file",
        description: err?.message || "Try exporting the pages as images.",
        variant: "destructive",
      });
    } finally {
      setUploadingPages(false);
      e.target.value = "";
    }
  };

  const moveIntroPage = (index: number, direction: -1 | 1) => {
    setIntroPages((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeIntroPage = (index: number) => {
    setIntroPages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your workspace and company profile.
          </p>
        </div>

        {/* Company Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Company Profile
            </CardTitle>
            <CardDescription>
              This information will be displayed on the cover page and footer of
              all generated PDF reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="companyName" className="font-semibold">
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  placeholder="Company Name"
                  disabled={!isAdmin}
                  data-testid="input-company-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone" className="font-semibold">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                  placeholder="+91 123 456 7890"
                  disabled={!isAdmin}
                  data-testid="input-company-phone"
                />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="address" className="font-semibold">
                  Business Address
                </Label>
                <Input
                  id="address"
                  value={profile.address}
                  onChange={(e) =>
                    setProfile({ ...profile, address: e.target.value })
                  }
                  placeholder="123 Main St, City, State, ZIP"
                  disabled={!isAdmin}
                  data-testid="input-company-address"
                />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label className="font-semibold">Company Logo</Label>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 shrink-0 overflow-hidden">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2 w-full">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="cursor-pointer max-w-sm"
                      disabled={!isAdmin}
                      data-testid="input-company-logo"
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload a square PNG or JPG. This will appear on your
                      report headers and PDF covers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {isAdmin && (
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="gap-2"
                  data-testid="button-save-settings"
                >
                  <Save className="h-4 w-4" />{" "}
                  {saveMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Intro Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Report Intro Pages
            </CardTitle>
            <CardDescription>
              These saved pages are added to the start of every exported report
              PDF, so you no longer have to merge them manually.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdmin && (
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="application/pdf,image/*"
                  multiple
                  onChange={handleIntroPagesUpload}
                  disabled={uploadingPages}
                  className="cursor-pointer max-w-md"
                  data-testid="input-report-intro-pages"
                />
                <p className="text-xs text-muted-foreground">
                  Upload one or more PDFs or images. PDF pages are converted to
                  images automatically. Use the arrows to reorder pages.
                </p>
              </div>
            )}

            {uploadingPages && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Converting pages…
              </div>
            )}

            {introPages.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-10 text-center text-sm text-muted-foreground">
                No intro pages added yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {introPages.map((page, index) => (
                  <div
                    key={`${index}-${page.slice(-16)}`}
                    className="relative overflow-hidden rounded-lg border bg-white"
                  >
                    <img
                      src={page}
                      alt={`Intro page ${index + 1}`}
                      className="aspect-[210/297] w-full object-contain bg-white"
                    />
                    <div className="absolute left-1 top-1 rounded bg-slate-900/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {index + 1}
                    </div>
                    {isAdmin && (
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-slate-900/60 p-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          className="h-6 w-6"
                          onClick={() => moveIntroPage(index, -1)}
                          disabled={index === 0}
                          aria-label="Move page up"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          className="h-6 w-6"
                          onClick={() => moveIntroPage(index, 1)}
                          disabled={index === introPages.length - 1}
                          aria-label="Move page down"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          className="h-6 w-6"
                          onClick={() => removeIntroPage(index)}
                          aria-label="Remove page"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isAdmin && (
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={() => saveIntroMutation.mutate()}
                  disabled={saveIntroMutation.isPending || uploadingPages}
                  className="gap-2"
                  data-testid="button-save-intro-pages"
                >
                  {saveIntroMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save Intro Pages
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
