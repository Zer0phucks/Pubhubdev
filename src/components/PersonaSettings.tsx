import { useState, useEffect } from 'react';
import {
  Save,
  RotateCcw,
  Plus,
  X,
  Upload,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import type { CreatorPersona, ContentSource, ContentPlatform } from '@/types';
import {
  fetchPersona,
  upsertPersona,
  generatePersona,
  createDefaultPersona,
} from '@/utils/personaAPI';
import {
  fetchContentSources,
  deleteContentSource,
  batchCreateContentSources,
  validateURL,
} from '@/utils/contentAPI';

interface PersonaSettingsProps {
  projectId: string;
}

export default function PersonaSettings({ projectId }: PersonaSettingsProps) {
  // State management
  const [persona, setPersona] = useState<Partial<CreatorPersona>>({
    identity: {
      display_name: '',
      aliases: [],
      bio_summary: '',
      expertise_domains: [],
      audience_profile: {
        primary_audience: '',
        audience_needs: [],
        reading_level: 'intermediate',
      },
    },
    voice: {
      tone_axes: {
        formal: 0.5,
        playful: 0.5,
        confident: 0.5,
        empathetic: 0.5,
        direct: 0.5,
        provocative: 0.5,
      },
      lexical_preferences: {
        signature_phrases: [],
        preferred_terms: [],
        avoid_terms: [],
        jargon_level: 'medium',
        emoji_usage: 'moderate',
        punctuation_style: '',
      },
      rhetorical_moves: [],
      humor_style: '',
    },
    topics: {
      core_topics: [],
      edge_topics: [],
      taboo_topics: [],
      stances: [],
    },
    dos_and_donts: {
      do: [],
      dont: [],
    },
    safety_and_ethics: {
      consent_status: 'granted',
      attribution_rules: '',
      refusal_conditions: [],
      disclosure_rules: '',
    },
    provenance: {
      created_at: new Date().toISOString(),
      data_summary: '',
      notes: '',
    },
  });

  const [contentSources, setContentSources] = useState<ContentSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // URL ingestion modal state
  const [isAddContentOpen, setIsAddContentOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urls, setUrls] = useState<string[]>([]);
  const [isIngesting, setIsIngesting] = useState(false);

  // Collapsible section states
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Load persona data
  useEffect(() => {
    loadPersona();
    loadContentSources();
  }, [projectId]);

  const loadPersona = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPersona(projectId);
      if (data) {
        setPersona(data);
      } else {
        // No persona exists yet, use defaults
        console.log('No existing persona for project:', projectId);
      }
    } catch (error) {
      console.error('Failed to load persona:', error);
      toast.error('Failed to load persona settings');
    } finally {
      setIsLoading(false);
    }
  };

  const loadContentSources = async () => {
    try {
      const data = await fetchContentSources(projectId);
      setContentSources(data);
    } catch (error) {
      console.error('Failed to load content sources:', error);
      toast.error('Failed to load content sources');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await upsertPersona(projectId, persona as any);
      setHasChanges(false);
      toast.success('Persona settings saved successfully');
    } catch (error) {
      console.error('Failed to save persona:', error);
      toast.error('Failed to save persona settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    loadPersona();
    setHasChanges(false);
  };

  const handleGeneratePersona = async () => {
    setIsGenerating(true);
    try {
      toast.loading('Generating persona from your content...', { id: 'generate-persona' });

      const result = await generatePersona({
        project_id: projectId,
        analyze_all: true,
      });

      setPersona(result.persona);
      setHasChanges(true);

      toast.success(
        `Persona generated from ${result.sources_analyzed} content sources (${(result.confidence_score * 100).toFixed(0)}% confidence)`,
        { id: 'generate-persona' }
      );
    } catch (error) {
      console.error('Failed to generate persona:', error);
      toast.error('Failed to generate persona. Please try again.', { id: 'generate-persona' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleIngestURLs = async () => {
    if (urls.length === 0) return;

    // Validate all URLs
    const invalidURLs = urls.filter(url => !validateURL(url));
    if (invalidURLs.length > 0) {
      toast.error(`Invalid URLs: ${invalidURLs.join(', ')}`);
      return;
    }

    setIsIngesting(true);
    try {
      toast.loading(`Ingesting ${urls.length} URLs...`, { id: 'ingest-urls' });

      // Create content sources in database
      await batchCreateContentSources(projectId, urls);

      toast.success(`Successfully added ${urls.length} URLs for processing`, { id: 'ingest-urls' });

      // Clear modal state
      setUrls([]);
      setUrlInput('');
      setIsAddContentOpen(false);

      // Reload content sources
      await loadContentSources();

      // Note: Actual content fetching and embedding generation happens via Edge Function
      toast.info('Content will be processed in the background. Check back in a few minutes.');
    } catch (error) {
      console.error('Failed to ingest URLs:', error);
      toast.error('Failed to ingest URLs. Please try again.', { id: 'ingest-urls' });
    } finally {
      setIsIngesting(false);
    }
  };

  const addURL = () => {
    if (urlInput.trim() && urls.length < 20) {
      setUrls([...urls, urlInput.trim()]);
      setUrlInput('');
    }
  };

  const removeURL = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const updatePersona = (updates: Partial<CreatorPersona>) => {
    setPersona({ ...persona, ...updates });
    setHasChanges(true);
  };

  const updateNestedField = (path: string[], value: any) => {
    const newPersona = { ...persona };
    let current: any = newPersona;

    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) current[path[i]] = {};
      current = current[path[i]];
    }

    current[path[path.length - 1]] = value;
    setPersona(newPersona);
    setHasChanges(true);
  };

  const addArrayItem = (path: string[], value: any) => {
    const currentArray = getNestedValue(persona, path) || [];
    updateNestedField(path, [...currentArray, value]);
  };

  const removeArrayItem = (path: string[], index: number) => {
    const currentArray = getNestedValue(persona, path) || [];
    updateNestedField(path, currentArray.filter((_: any, i: number) => i !== index));
  };

  const getNestedValue = (obj: any, path: string[]): any => {
    return path.reduce((current, key) => current?.[key], obj);
  };

  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
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
          <h1 className="text-3xl font-bold">Persona Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Define your creator persona for AI-powered content generation
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddContentOpen} onOpenChange={setIsAddContentOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Content
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Content Sources</DialogTitle>
                <DialogDescription>
                  Add URLs to analyze and update your persona (max 20 URLs)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/article"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addURL();
                      }
                    }}
                    disabled={urls.length >= 20}
                  />
                  <Button onClick={addURL} disabled={urls.length >= 20}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {urls.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {urls.map((url, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded"
                      >
                        <LinkIcon className="h-4 w-4 text-gray-500" />
                        <span className="flex-1 text-sm truncate">{url}</span>
                        <button
                          onClick={() => removeURL(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center pt-4">
                  <p className="text-sm text-gray-600">
                    {urls.length}/20 URLs added
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUrls([]);
                        setUrlInput('');
                        setIsAddContentOpen(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleIngestURLs}
                      disabled={urls.length === 0 || isIngesting}
                    >
                      {isIngesting ? 'Ingesting...' : 'Ingest & Analyze'}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            onClick={handleGeneratePersona}
            disabled={isGenerating || contentSources.length === 0}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Regenerate Persona'}
          </Button>

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

      <Tabs defaultValue="identity" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="identity">Identity</TabsTrigger>
          <TabsTrigger value="voice">Voice</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
          <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
          <TabsTrigger value="sources">Content Sources</TabsTrigger>
        </TabsList>

        {/* Identity Tab */}
        <TabsContent value="identity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Creator Identity</CardTitle>
              <CardDescription>
                Basic information about you and your audience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name *</Label>
                <Input
                  id="display-name"
                  value={persona.identity?.display_name}
                  onChange={(e) =>
                    updateNestedField(['identity', 'display_name'], e.target.value)
                  }
                  placeholder="Your public name"
                />
              </div>

              {/* Aliases */}
              <ArrayField
                label="Aliases"
                description="Other names or handles you're known by"
                items={persona.identity?.aliases || []}
                onAdd={(value) => addArrayItem(['identity', 'aliases'], value)}
                onRemove={(index) => removeArrayItem(['identity', 'aliases'], index)}
                placeholder="e.g., @username, nickname"
              />

              {/* Bio Summary */}
              <div className="space-y-2">
                <Label htmlFor="bio-summary">Bio Summary</Label>
                <Textarea
                  id="bio-summary"
                  value={persona.identity?.bio_summary}
                  onChange={(e) =>
                    updateNestedField(['identity', 'bio_summary'], e.target.value)
                  }
                  placeholder="A brief summary of who you are and what you do"
                  rows={3}
                />
              </div>

              {/* Expertise Domains */}
              <ArrayField
                label="Expertise Domains"
                description="Areas where you have expertise"
                items={persona.identity?.expertise_domains || []}
                onAdd={(value) => addArrayItem(['identity', 'expertise_domains'], value)}
                onRemove={(index) => removeArrayItem(['identity', 'expertise_domains'], index)}
                placeholder="e.g., Web Development, AI, Marketing"
              />

              {/* Audience Profile */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Audience Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary-audience">Primary Audience</Label>
                    <Input
                      id="primary-audience"
                      value={persona.identity?.audience_profile?.primary_audience}
                      onChange={(e) =>
                        updateNestedField(
                          ['identity', 'audience_profile', 'primary_audience'],
                          e.target.value
                        )
                      }
                      placeholder="e.g., Software developers, Marketing professionals"
                    />
                  </div>

                  <ArrayField
                    label="Audience Needs"
                    description="What your audience is looking for"
                    items={persona.identity?.audience_profile?.audience_needs || []}
                    onAdd={(value) =>
                      addArrayItem(['identity', 'audience_profile', 'audience_needs'], value)
                    }
                    onRemove={(index) =>
                      removeArrayItem(['identity', 'audience_profile', 'audience_needs'], index)
                    }
                    placeholder="e.g., Learn new skills, Stay updated, Solve problems"
                  />

                  <div className="space-y-2">
                    <Label htmlFor="reading-level">Reading Level</Label>
                    <Select
                      value={persona.identity?.audience_profile?.reading_level}
                      onValueChange={(value: 'casual' | 'intermediate' | 'advanced') =>
                        updateNestedField(
                          ['identity', 'audience_profile', 'reading_level'],
                          value
                        )
                      }
                    >
                      <SelectTrigger id="reading-level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voice Tab */}
        <TabsContent value="voice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Voice & Tone</CardTitle>
              <CardDescription>
                How your content sounds and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tone Axes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tone Characteristics</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Adjust sliders to define your communication style (0 = not at all, 1 = very)
                </p>

                {['formal', 'playful', 'confident', 'empathetic', 'direct', 'provocative'].map(
                  (axis) => (
                    <div key={axis} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="capitalize">{axis}</Label>
                        <span className="text-sm text-gray-600">
                          {persona.voice?.tone_axes?.[axis as keyof typeof persona.voice.tone_axes]?.toFixed(2)}
                        </span>
                      </div>
                      <Slider
                        value={[
                          (persona.voice?.tone_axes?.[axis as keyof typeof persona.voice.tone_axes] || 0.5) * 100,
                        ]}
                        onValueChange={([value]) =>
                          updateNestedField(['voice', 'tone_axes', axis], value / 100)
                        }
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  )
                )}
              </div>

              {/* Lexical Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Word Choice & Style</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ArrayField
                    label="Signature Phrases"
                    description="Catchphrases or expressions you frequently use"
                    items={persona.voice?.lexical_preferences?.signature_phrases || []}
                    onAdd={(value) =>
                      addArrayItem(['voice', 'lexical_preferences', 'signature_phrases'], value)
                    }
                    onRemove={(index) =>
                      removeArrayItem(['voice', 'lexical_preferences', 'signature_phrases'], index)
                    }
                    placeholder="e.g., Let's dive in, Here's the thing"
                  />

                  <ArrayField
                    label="Preferred Terms"
                    description="Words or terms you prefer to use"
                    items={persona.voice?.lexical_preferences?.preferred_terms || []}
                    onAdd={(value) =>
                      addArrayItem(['voice', 'lexical_preferences', 'preferred_terms'], value)
                    }
                    onRemove={(index) =>
                      removeArrayItem(['voice', 'lexical_preferences', 'preferred_terms'], index)
                    }
                    placeholder="e.g., utilize, leverage, implement"
                  />

                  <ArrayField
                    label="Avoid Terms"
                    description="Words or terms you avoid using"
                    items={persona.voice?.lexical_preferences?.avoid_terms || []}
                    onAdd={(value) =>
                      addArrayItem(['voice', 'lexical_preferences', 'avoid_terms'], value)
                    }
                    onRemove={(index) =>
                      removeArrayItem(['voice', 'lexical_preferences', 'avoid_terms'], index)
                    }
                    placeholder="e.g., synergy, disrupt, thought leader"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jargon-level">Jargon Level</Label>
                      <Select
                        value={persona.voice?.lexical_preferences?.jargon_level}
                        onValueChange={(value: 'low' | 'medium' | 'high') =>
                          updateNestedField(['voice', 'lexical_preferences', 'jargon_level'], value)
                        }
                      >
                        <SelectTrigger id="jargon-level">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low (Plain language)</SelectItem>
                          <SelectItem value="medium">Medium (Some technical terms)</SelectItem>
                          <SelectItem value="high">High (Industry-specific)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emoji-usage">Emoji Usage</Label>
                      <Select
                        value={persona.voice?.lexical_preferences?.emoji_usage}
                        onValueChange={(value: 'none' | 'light' | 'moderate' | 'heavy') =>
                          updateNestedField(['voice', 'lexical_preferences', 'emoji_usage'], value)
                        }
                      >
                        <SelectTrigger id="emoji-usage">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="light">Light (Occasional)</SelectItem>
                          <SelectItem value="moderate">Moderate (Regular)</SelectItem>
                          <SelectItem value="heavy">Heavy (Frequent)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="punctuation-style">Punctuation Style</Label>
                    <Input
                      id="punctuation-style"
                      value={persona.voice?.lexical_preferences?.punctuation_style}
                      onChange={(e) =>
                        updateNestedField(
                          ['voice', 'lexical_preferences', 'punctuation_style'],
                          e.target.value
                        )
                      }
                      placeholder="e.g., Oxford comma, em dashes, minimal commas"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Humor Style */}
              <div className="space-y-2">
                <Label htmlFor="humor-style">Humor Style</Label>
                <Input
                  id="humor-style"
                  value={persona.voice?.humor_style}
                  onChange={(e) => updateNestedField(['voice', 'humor_style'], e.target.value)}
                  placeholder="e.g., Deadpan, self-deprecating, witty, observational"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Topics Tab */}
        <TabsContent value="topics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Topics</CardTitle>
              <CardDescription>
                What you write about and your perspectives
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ArrayField
                label="Core Topics"
                description="Main subjects you regularly cover"
                items={persona.topics?.core_topics || []}
                onAdd={(value) => addArrayItem(['topics', 'core_topics'], value)}
                onRemove={(index) => removeArrayItem(['topics', 'core_topics'], index)}
                placeholder="e.g., Web Development, AI, Productivity"
              />

              <ArrayField
                label="Edge Topics"
                description="Occasional or emerging topics you explore"
                items={persona.topics?.edge_topics || []}
                onAdd={(value) => addArrayItem(['topics', 'edge_topics'], value)}
                onRemove={(index) => removeArrayItem(['topics', 'edge_topics'], index)}
                placeholder="e.g., Blockchain, Quantum Computing"
              />

              <ArrayField
                label="Taboo Topics"
                description="Topics you intentionally avoid"
                items={persona.topics?.taboo_topics || []}
                onAdd={(value) => addArrayItem(['topics', 'taboo_topics'], value)}
                onRemove={(index) => removeArrayItem(['topics', 'taboo_topics'], index)}
                placeholder="e.g., Politics, Religion"
                variant="destructive"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Style Tab */}
        <TabsContent value="style" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Style & Structure</CardTitle>
              <CardDescription>
                How your content is formatted and organized
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Advanced style settings coming soon. This section will include:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>Content structure templates (blog posts, videos, social media)</li>
                  <li>Story patterns and narrative frameworks</li>
                  <li>Formatting preferences (headings, lists, code blocks)</li>
                  <li>Length targets and cadence preferences</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guidelines Tab */}
        <TabsContent value="guidelines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Guidelines</CardTitle>
              <CardDescription>
                Rules and ethical considerations for content generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ArrayField
                label="Do's"
                description="Content practices you want to follow"
                items={persona.dos_and_donts?.do || []}
                onAdd={(value) => addArrayItem(['dos_and_donts', 'do'], value)}
                onRemove={(index) => removeArrayItem(['dos_and_donts', 'do'], index)}
                placeholder="e.g., Cite sources, Use inclusive language, Provide examples"
              />

              <ArrayField
                label="Don'ts"
                description="Content practices you want to avoid"
                items={persona.dos_and_donts?.dont || []}
                onAdd={(value) => addArrayItem(['dos_and_donts', 'dont'], value)}
                onRemove={(index) => removeArrayItem(['dos_and_donts', 'dont'], index)}
                placeholder="e.g., Make unverified claims, Use clickbait, Plagiarize"
                variant="destructive"
              />

              {/* Safety & Ethics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Safety & Ethics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="consent-status">Consent Status</Label>
                    <Select
                      value={persona.safety_and_ethics?.consent_status}
                      onValueChange={(value: 'granted' | 'revoked' | 'unknown') =>
                        updateNestedField(['safety_and_ethics', 'consent_status'], value)
                      }
                    >
                      <SelectTrigger id="consent-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="granted">Granted</SelectItem>
                        <SelectItem value="revoked">Revoked</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attribution-rules">Attribution Rules</Label>
                    <Textarea
                      id="attribution-rules"
                      value={persona.safety_and_ethics?.attribution_rules}
                      onChange={(e) =>
                        updateNestedField(['safety_and_ethics', 'attribution_rules'], e.target.value)
                      }
                      placeholder="How to attribute sources and give credit"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="disclosure-rules">Disclosure Rules</Label>
                    <Textarea
                      id="disclosure-rules"
                      value={persona.safety_and_ethics?.disclosure_rules}
                      onChange={(e) =>
                        updateNestedField(['safety_and_ethics', 'disclosure_rules'], e.target.value)
                      }
                      placeholder="When to disclose AI assistance, sponsorships, etc."
                      rows={3}
                    />
                  </div>

                  <ArrayField
                    label="Refusal Conditions"
                    description="Situations where content generation should be refused"
                    items={persona.safety_and_ethics?.refusal_conditions || []}
                    onAdd={(value) =>
                      addArrayItem(['safety_and_ethics', 'refusal_conditions'], value)
                    }
                    onRemove={(index) =>
                      removeArrayItem(['safety_and_ethics', 'refusal_conditions'], index)
                    }
                    placeholder="e.g., Medical advice, Legal advice, Financial recommendations"
                    variant="destructive"
                  />
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Sources</CardTitle>
              <CardDescription>
                Content used to train and refine your persona
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contentSources.length === 0 ? (
                <div className="text-center py-12">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No content sources yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Add content URLs to analyze and build your persona
                  </p>
                  <Button onClick={() => setIsAddContentOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Content
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Platform</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ingested</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contentSources.map((source) => (
                      <TableRow key={source.id}>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {source.platform}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {source.url}
                          </a>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{source.title || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              source.status === 'completed'
                                ? 'default'
                                : source.status === 'failed'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {source.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(source.ingested_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              try {
                                await deleteContentSource(source.id);
                                toast.success('Content source deleted');
                                await loadContentSources();
                              } catch (error) {
                                console.error('Failed to delete content source:', error);
                                toast.error('Failed to delete content source');
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Reusable ArrayField component for managing string arrays
interface ArrayFieldProps {
  label: string;
  description?: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  placeholder?: string;
  variant?: 'default' | 'destructive';
}

function ArrayField({
  label,
  description,
  items,
  onAdd,
  onRemove,
  placeholder,
  variant = 'default',
}: ArrayFieldProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      )}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button type="button" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {items.map((item, index) => (
          <Badge
            key={index}
            variant={variant === 'destructive' ? 'destructive' : 'secondary'}
            className="gap-1"
          >
            {item}
            <button
              onClick={() => onRemove(index)}
              className="ml-1 hover:text-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
