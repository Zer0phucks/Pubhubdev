import { useState, useEffect } from 'react';
import { Upload, Palette, Type, Plus, X, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { Brand, CreateBrandInput, UpdateBrandInput } from '@/types';
import { fetchBrand, upsertBrand, uploadLogo, deleteLogo } from '@/utils/brandAPI';

// Font options (Google Fonts + Web-Safe fonts)
const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' },
  { value: 'Arial', label: 'Arial (System)' },
  { value: 'Helvetica', label: 'Helvetica (System)' },
  { value: 'Georgia', label: 'Georgia (System)' },
  { value: 'Times New Roman', label: 'Times New Roman (System)' },
];

interface BrandSettingsProps {
  projectId: string;
}

export default function BrandSettings({ projectId }: BrandSettingsProps) {
  const [brand, setBrand] = useState<Partial<Brand>>({
    project_id: projectId,
    primary_color: '#10b981',
    secondary_color: '#3b82f6',
    accent_color: '#f59e0b',
    palette_keywords: [],
    logo_keywords: [],
    primary_font: 'Inter',
    secondary_font: 'Roboto',
    pillars: [],
    values: [],
    positioning_statement: '',
    taglines: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Temporary input states for adding items
  const [newPillar, setNewPillar] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newTagline, setNewTagline] = useState('');
  const [newPaletteKeyword, setNewPaletteKeyword] = useState('');
  const [newLogoKeyword, setNewLogoKeyword] = useState('');

  // Load brand data
  useEffect(() => {
    loadBrand();
  }, [projectId]);

  const loadBrand = async () => {
    setIsLoading(true);
    try {
      const data = await fetchBrand(projectId);
      if (data) {
        setBrand(data);
      } else {
        // No brand exists yet, keep defaults
        console.log('No existing brand for project:', projectId);
      }
    } catch (error) {
      console.error('Failed to load brand:', error);
      toast.error('Failed to load brand settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { id, created_at, updated_at, ...brandData } = brand as Brand;
      await upsertBrand({ ...brandData, project_id: projectId });
      setHasChanges(false);
      toast.success('Brand settings saved successfully');
    } catch (error) {
      console.error('Failed to save brand:', error);
      toast.error('Failed to save brand settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    loadBrand();
    setHasChanges(false);
  };

  const handleFileUpload = async (type: 'light' | 'dark' | 'square', file: File) => {
    try {
      toast.loading(`Uploading ${type} logo...`, { id: 'logo-upload' });

      // Delete old logo if exists
      const oldLogoUrl = brand[`logo_${type}_url` as keyof Brand];
      if (oldLogoUrl && typeof oldLogoUrl === 'string') {
        try {
          await deleteLogo(oldLogoUrl);
        } catch (err) {
          console.warn('Failed to delete old logo:', err);
        }
      }

      // Upload new logo
      const url = await uploadLogo(projectId, file, type);
      updateBrand({ [`logo_${type}_url`]: url });

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} logo uploaded successfully`, { id: 'logo-upload' });
    } catch (error) {
      console.error(`Failed to upload ${type} logo:`, error);
      toast.error(`Failed to upload ${type} logo`, { id: 'logo-upload' });
    }
  };

  const updateBrand = (updates: Partial<Brand>) => {
    setBrand({ ...brand, ...updates });
    setHasChanges(true);
  };

  const addItem = (field: keyof Brand, value: string) => {
    if (!value.trim()) return;
    const currentItems = (brand[field] as string[]) || [];
    updateBrand({ [field]: [...currentItems, value.trim()] });
  };

  const removeItem = (field: keyof Brand, index: number) => {
    const currentItems = (brand[field] as string[]) || [];
    updateBrand({ [field]: currentItems.filter((_, i) => i !== index) });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Brand Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Define your brand identity, colors, logos, and visual style
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleReset} disabled={isSaving}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="logos">Logos</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="identity">Brand Identity</TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Color Palette
              </CardTitle>
              <CardDescription>
                Define your brand's primary, secondary, and accent colors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Color Pickers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      id="primary-color"
                      type="color"
                      value={brand.primary_color}
                      onChange={(e) => updateBrand({ primary_color: e.target.value })}
                      className="h-10 w-20 rounded cursor-pointer border border-gray-300"
                    />
                    <Input
                      value={brand.primary_color}
                      onChange={(e) => updateBrand({ primary_color: e.target.value })}
                      placeholder="#10b981"
                      className="flex-1"
                    />
                  </div>
                  <div
                    className="h-16 rounded-md"
                    style={{ backgroundColor: brand.primary_color }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      id="secondary-color"
                      type="color"
                      value={brand.secondary_color}
                      onChange={(e) => updateBrand({ secondary_color: e.target.value })}
                      className="h-10 w-20 rounded cursor-pointer border border-gray-300"
                    />
                    <Input
                      value={brand.secondary_color}
                      onChange={(e) => updateBrand({ secondary_color: e.target.value })}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                  <div
                    className="h-16 rounded-md"
                    style={{ backgroundColor: brand.secondary_color }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accent-color">Accent Color</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      id="accent-color"
                      type="color"
                      value={brand.accent_color}
                      onChange={(e) => updateBrand({ accent_color: e.target.value })}
                      className="h-10 w-20 rounded cursor-pointer border border-gray-300"
                    />
                    <Input
                      value={brand.accent_color}
                      onChange={(e) => updateBrand({ accent_color: e.target.value })}
                      placeholder="#f59e0b"
                      className="flex-1"
                    />
                  </div>
                  <div
                    className="h-16 rounded-md"
                    style={{ backgroundColor: brand.accent_color }}
                  />
                </div>
              </div>

              {/* Palette Keywords */}
              <div className="space-y-2">
                <Label>Palette Keywords</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Descriptive words for your color palette (e.g., "vibrant", "minimal", "earthy")
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newPaletteKeyword}
                    onChange={(e) => setNewPaletteKeyword(e.target.value)}
                    placeholder="Add keyword..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addItem('palette_keywords', newPaletteKeyword);
                        setNewPaletteKeyword('');
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      addItem('palette_keywords', newPaletteKeyword);
                      setNewPaletteKeyword('');
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {brand.palette_keywords?.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {keyword}
                      <button
                        onClick={() => removeItem('palette_keywords', index)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logos Tab */}
        <TabsContent value="logos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Logo Uploads
              </CardTitle>
              <CardDescription>
                Upload different variations of your logo for various use cases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Light Mode Logo */}
                <div className="space-y-2">
                  <Label>Light Mode Logo</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-emerald-500 transition-colors">
                    {brand.logo_light_url ? (
                      <div className="space-y-2">
                        <img src={brand.logo_light_url} alt="Light logo" className="mx-auto max-h-24" />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateBrand({ logo_light_url: undefined })}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Click to upload</p>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload('light', file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Dark Mode Logo */}
                <div className="space-y-2">
                  <Label>Dark Mode Logo</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-emerald-500 transition-colors bg-gray-900">
                    {brand.logo_dark_url ? (
                      <div className="space-y-2">
                        <img src={brand.logo_dark_url} alt="Dark logo" className="mx-auto max-h-24" />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateBrand({ logo_dark_url: undefined })}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-400">Click to upload</p>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload('dark', file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Square/Avatar Logo */}
                <div className="space-y-2">
                  <Label>Square Logo (Avatar)</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-emerald-500 transition-colors">
                    {brand.logo_square_url ? (
                      <div className="space-y-2">
                        <img src={brand.logo_square_url} alt="Square logo" className="mx-auto max-h-24" />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateBrand({ logo_square_url: undefined })}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Click to upload</p>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload('square', file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Logo Keywords */}
              <div className="space-y-2">
                <Label>Logo Keywords</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Descriptive words for your logo style (e.g., "modern", "playful", "professional")
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newLogoKeyword}
                    onChange={(e) => setNewLogoKeyword(e.target.value)}
                    placeholder="Add keyword..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addItem('logo_keywords', newLogoKeyword);
                        setNewLogoKeyword('');
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      addItem('logo_keywords', newLogoKeyword);
                      setNewLogoKeyword('');
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {brand.logo_keywords?.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {keyword}
                      <button
                        onClick={() => removeItem('logo_keywords', index)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Typography
              </CardTitle>
              <CardDescription>
                Choose your brand's primary and secondary fonts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Primary Font */}
                <div className="space-y-2">
                  <Label htmlFor="primary-font">Primary Font</Label>
                  <Select
                    value={brand.primary_font}
                    onValueChange={(value) => updateBrand({ primary_font: value })}
                  >
                    <SelectTrigger id="primary-font">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          <span style={{ fontFamily: font.value }}>{font.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div
                    className="p-4 border rounded-md text-xl"
                    style={{ fontFamily: brand.primary_font }}
                  >
                    The quick brown fox jumps over the lazy dog
                  </div>
                </div>

                {/* Secondary Font */}
                <div className="space-y-2">
                  <Label htmlFor="secondary-font">Secondary Font</Label>
                  <Select
                    value={brand.secondary_font}
                    onValueChange={(value) => updateBrand({ secondary_font: value })}
                  >
                    <SelectTrigger id="secondary-font">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          <span style={{ fontFamily: font.value }}>{font.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div
                    className="p-4 border rounded-md text-xl"
                    style={{ fontFamily: brand.secondary_font }}
                  >
                    The quick brown fox jumps over the lazy dog
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Brand Identity Tab */}
        <TabsContent value="identity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand Identity</CardTitle>
              <CardDescription>
                Define the core elements that make your brand unique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Brand Pillars */}
              <div className="space-y-2">
                <Label>Brand Pillars</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  3-5 core themes your brand stands for
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newPillar}
                    onChange={(e) => setNewPillar(e.target.value)}
                    placeholder="e.g., Innovation, Community, Quality"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addItem('pillars', newPillar);
                        setNewPillar('');
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      addItem('pillars', newPillar);
                      setNewPillar('');
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {brand.pillars?.map((pillar, index) => (
                    <Badge key={index} variant="default" className="gap-1">
                      {pillar}
                      <button
                        onClick={() => removeItem('pillars', index)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Brand Values */}
              <div className="space-y-2">
                <Label>Brand Values</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Core values that guide your brand
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="e.g., Transparency, Sustainability, Excellence"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addItem('values', newValue);
                        setNewValue('');
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      addItem('values', newValue);
                      setNewValue('');
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {brand.values?.map((value, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {value}
                      <button
                        onClick={() => removeItem('values', index)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Positioning Statement */}
              <div className="space-y-2">
                <Label htmlFor="positioning">Positioning Statement</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  A concise statement of what your brand stands for and who it serves
                </p>
                <Textarea
                  id="positioning"
                  value={brand.positioning_statement}
                  onChange={(e) => updateBrand({ positioning_statement: e.target.value })}
                  placeholder="For [target audience] who [need/opportunity], [brand name] is a [category] that [benefit/solution]. Unlike [competition], [brand name] [key differentiation]."
                  rows={4}
                />
              </div>

              {/* Taglines */}
              <div className="space-y-2">
                <Label>Taglines</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Short, memorable phrases that capture your brand essence
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newTagline}
                    onChange={(e) => setNewTagline(e.target.value)}
                    placeholder="e.g., Just Do It, Think Different"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addItem('taglines', newTagline);
                        setNewTagline('');
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      addItem('taglines', newTagline);
                      setNewTagline('');
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 mt-2">
                  {brand.taglines?.map((tagline, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded"
                    >
                      <span className="flex-1 italic">"{tagline}"</span>
                      <button
                        onClick={() => removeItem('taglines', index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
