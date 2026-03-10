import { useState } from "react";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import Layout from "@/components/Layout";

export default function Templates() {
  const { reportTemplates, addReportTemplate, updateReportTemplate, deleteReportTemplate } = useStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    layout: "standard" as "standard" | "detailed" | "compact",
    includeLogoOnEveryPage: true,
    includeSignature: false,
    colorScheme: "indigo" as "indigo" | "blue" | "slate",
  });

  const handleCreate = () => {
    if (!formData.name) return;
    addReportTemplate({
      ...formData,
      id: Date.now().toString(),
      isDefault: false,
    });
    setFormData({
      name: "",
      description: "",
      layout: "standard",
      includeLogoOnEveryPage: true,
      includeSignature: false,
      colorScheme: "indigo",
    });
    setIsCreateOpen(false);
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setFormData(template);
  };

  const handleUpdate = () => {
    if (!editingTemplate) return;
    updateReportTemplate(editingTemplate.id, formData);
    setEditingTemplate(null);
    setFormData({
      name: "",
      description: "",
      layout: "standard",
      includeLogoOnEveryPage: true,
      includeSignature: false,
      colorScheme: "indigo",
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this template? This cannot be undone.")) {
      deleteReportTemplate(id);
    }
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">Report Templates</h1>
              <p className="text-slate-500 mt-2 text-lg">Create and manage custom PDF report layouts</p>
            </div>
            <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4" />
              New Template
            </Button>
          </div>
        </div>

        {/* Default Templates Info */}
        <Card className="mb-8 border-indigo-100 bg-indigo-50/30">
          <CardHeader>
            <CardTitle className="text-sm text-indigo-900">Standard Templates</CardTitle>
            <CardDescription>These are built-in templates. Create custom ones for your specific needs.</CardDescription>
          </CardHeader>
        </Card>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Default Template */}
          <Card className="border-slate-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">Professional Standard</CardTitle>
                  <CardDescription>Classic layout with indigo theme</CardDescription>
                </div>
                <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded">Default</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="text-indigo-600">✓</span> Logo on every page
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-indigo-600">✓</span> Professional formatting
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-indigo-600">✓</span> High contrast design
                </div>
              </div>
              <Button variant="outline" className="w-full" disabled>
                <Eye className="w-4 h-4 mr-2" />
                Currently Active
              </Button>
            </CardContent>
          </Card>

          {/* Custom Templates */}
          {reportTemplates.map((template) => (
            <Card key={template.id} className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-600">•</span> Layout: <span className="font-medium capitalize">{template.layout}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-600">•</span> Color: <span className="font-medium capitalize">{template.colorScheme}</span>
                  </div>
                  {template.includeLogoOnEveryPage && (
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-600">✓</span> Logo on every page
                    </div>
                  )}
                  {template.includeSignature && (
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-600">✓</span> Signature block
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {reportTemplates.length === 0 && (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <p className="text-slate-400 font-medium mb-4">No custom templates yet</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Template
            </Button>
          </div>
        )}
      </div>

      {/* Create Template Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>Design a custom report template for your needs</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name *</Label>
              <Input 
                id="template-name"
                placeholder="e.g., Client A Standard"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-desc">Description</Label>
              <Textarea 
                id="template-desc"
                placeholder="Describe this template..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-layout">Report Layout</Label>
              <Select value={formData.layout} onValueChange={(val: any) => setFormData({...formData, layout: val})}>
                <SelectTrigger id="template-layout">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (Full Detail)</SelectItem>
                  <SelectItem value="detailed">Detailed (Extended)</SelectItem>
                  <SelectItem value="compact">Compact (Condensed)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-color">Color Scheme</Label>
              <Select value={formData.colorScheme} onValueChange={(val: any) => setFormData({...formData, colorScheme: val})}>
                <SelectTrigger id="template-color">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indigo">Indigo (Professional)</SelectItem>
                  <SelectItem value="blue">Blue (Corporate)</SelectItem>
                  <SelectItem value="slate">Slate (Minimal)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 pt-2 border-t">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={formData.includeLogoOnEveryPage}
                  onChange={(e) => setFormData({...formData, includeLogoOnEveryPage: e.target.checked})}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-medium">Include logo on every page</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={formData.includeSignature}
                  onChange={(e) => setFormData({...formData, includeSignature: e.target.checked})}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-medium">Add signature block</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700">Create Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>Update your template settings</DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-template-name">Template Name *</Label>
                <Input 
                  id="edit-template-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-template-desc">Description</Label>
                <Textarea 
                  id="edit-template-desc"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-template-layout">Report Layout</Label>
                <Select value={formData.layout} onValueChange={(val: any) => setFormData({...formData, layout: val})}>
                  <SelectTrigger id="edit-template-layout">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard (Full Detail)</SelectItem>
                    <SelectItem value="detailed">Detailed (Extended)</SelectItem>
                    <SelectItem value="compact">Compact (Condensed)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-template-color">Color Scheme</Label>
                <Select value={formData.colorScheme} onValueChange={(val: any) => setFormData({...formData, colorScheme: val})}>
                  <SelectTrigger id="edit-template-color">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indigo">Indigo (Professional)</SelectItem>
                    <SelectItem value="blue">Blue (Corporate)</SelectItem>
                    <SelectItem value="slate">Slate (Minimal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3 pt-2 border-t">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={formData.includeLogoOnEveryPage}
                    onChange={(e) => setFormData({...formData, includeLogoOnEveryPage: e.target.checked})}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium">Include logo on every page</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={formData.includeSignature}
                    onChange={(e) => setFormData({...formData, includeSignature: e.target.checked})}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium">Add signature block</span>
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>Cancel</Button>
            <Button onClick={handleUpdate} className="bg-indigo-600 hover:bg-indigo-700">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
