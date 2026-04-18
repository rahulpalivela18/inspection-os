import { useState } from "react";
import Layout from "@/components/Layout";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Save, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { companyProfile, updateCompanyProfile } = useStore();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState(companyProfile);
  const [logoPreview, setLogoPreview] = useState(companyProfile.logoUrl || "");

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setProfile({ ...profile, logoUrl: base64 });
      setLogoPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateCompanyProfile(profile);
    toast({
      title: "Settings Saved",
      description: "Your company profile has been updated successfully.",
    });
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your workspace and company profile.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Company Profile
            </CardTitle>
            <CardDescription>
              This information will be displayed on the cover page and footer of all generated PDF reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="companyName" className="font-semibold">Company Name</Label>
                <Input 
                  id="companyName" 
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  placeholder="e.g. AP31_HOME INSPECTIONS"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email" className="font-semibold">Support Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={profile.email || ""}
                  onChange={(e) => setProfile({...profile, email: e.target.value})}
                  placeholder="info@yourcompany.com"
                />
              </div>

              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="address" className="font-semibold">Business Address</Label>
                <Input 
                  id="address" 
                  value={profile.address || ""}
                  onChange={(e) => setProfile({...profile, address: e.target.value})}
                  placeholder="123 Main St, City, State, ZIP"
                />
              </div>

              <div className="grid gap-2 md:col-span-2">
                <Label className="font-semibold">Company Logo</Label>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 shrink-0 overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-2" />
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
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload a square PNG or JPG. This will appear on your report headers and PDF covers.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" /> Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}