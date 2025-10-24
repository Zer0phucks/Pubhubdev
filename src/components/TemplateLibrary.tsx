import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { PlatformIcon } from "./PlatformIcon";
import { CreateTemplateDialog } from "./CreateTemplateDialog";
import { 
  Search, 
  Sparkles, 
  TrendingUp, 
  Megaphone, 
  BookOpen,
  Users,
  Camera,
  Heart,
  Zap,
  Star,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Crown
} from "lucide-react";
import type { Platform, ContentTemplate, TemplateCategory } from "../types";
import { getCustomTemplates, saveCustomTemplate, deleteCustomTemplate } from "../utils/customTemplates";
import { toast } from "sonner@2.0.3";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

const templates: ContentTemplate[] = [
  // Announcement Templates
  {
    id: "ann-1",
    title: "Product Launch",
    category: "announcement",
    content: "🚀 Exciting news! We're thrilled to announce [Product/Feature Name] is now live!\n\n[Brief description of what it does and why it matters]\n\nThis is a game-changer because [key benefit].\n\nTry it out and let us know what you think! 👇",
    platforms: ["twitter", "linkedin", "facebook"],
    hashtags: ["#ProductLaunch", "#Innovation", "#NewRelease"],
    emoji: "🚀"
  },
  {
    id: "ann-2",
    title: "Event Announcement",
    category: "announcement",
    content: "📅 Mark your calendars! Join us for [Event Name] on [Date].\n\n✨ What to expect:\n• [Highlight 1]\n• [Highlight 2]\n• [Highlight 3]\n\nRegister now (link in bio) and be part of something special!",
    platforms: ["instagram", "facebook", "linkedin"],
    hashtags: ["#Event", "#JoinUs", "#Community"],
    emoji: "📅"
  },
  {
    id: "ann-3",
    title: "Milestone Celebration",
    category: "announcement",
    content: "🎉 We just hit [Milestone Number]!\n\nThis wouldn't be possible without YOU. Thank you for being part of this incredible journey.\n\nHere's to the next chapter! 🙌",
    platforms: ["twitter", "instagram", "linkedin", "facebook"],
    hashtags: ["#Milestone", "#ThankYou", "#Grateful"],
    emoji: "🎉"
  },

  // Educational Templates
  {
    id: "edu-1",
    title: "Tips & Tricks",
    category: "educational",
    content: "💡 5 [Topic] Tips That Changed My [Process/Life]:\n\n1. [Tip 1] - [Brief explanation]\n2. [Tip 2] - [Brief explanation]\n3. [Tip 3] - [Brief explanation]\n4. [Tip 4] - [Brief explanation]\n5. [Tip 5] - [Brief explanation]\n\nWhich one resonates with you most? 👇",
    platforms: ["twitter", "linkedin", "instagram"],
    hashtags: ["#Tips", "#Learning", "#GrowthMindset"],
    emoji: "💡"
  },
  {
    id: "edu-2",
    title: "How-To Guide",
    category: "educational",
    content: "📚 How to [Achieve Goal] in [Timeframe]:\n\nStep 1: [Action]\nStep 2: [Action]\nStep 3: [Action]\nStep 4: [Action]\n\nBonus tip: [Extra insight]\n\nSave this for later! 🔖",
    platforms: ["linkedin", "instagram", "pinterest"],
    hashtags: ["#HowTo", "#Tutorial", "#LearnWithMe"],
    emoji: "📚"
  },
  {
    id: "edu-3",
    title: "Common Mistakes",
    category: "educational",
    content: "🚫 [Number] [Topic] Mistakes I Made (So You Don't Have To):\n\nMistake #1: [Description]\nThe fix: [Solution]\n\nMistake #2: [Description]\nThe fix: [Solution]\n\nMistake #3: [Description]\nThe fix: [Solution]\n\nWhat would you add to this list?",
    platforms: ["twitter", "linkedin", "reddit"],
    hashtags: ["#LessonsLearned", "#Mistakes", "#Growth"],
    emoji: "🚫"
  },
  {
    id: "edu-4",
    title: "Industry Insights",
    category: "educational",
    content: "📊 [Industry/Topic] Trend Alert:\n\nWhat's happening: [Current trend]\n\nWhy it matters: [Impact and significance]\n\nWhat you should do: [Actionable advice]\n\nStay ahead of the curve! 🚀",
    platforms: ["linkedin", "twitter", "blog"],
    hashtags: ["#Trends", "#Industry", "#Insights"],
    emoji: "📊"
  },

  // Promotional Templates
  {
    id: "promo-1",
    title: "Limited Offer",
    category: "promotional",
    content: "⏰ LIMITED TIME ONLY!\n\nGet [X]% off [Product/Service] for the next [Timeframe].\n\n✨ Why you'll love it:\n• [Benefit 1]\n• [Benefit 2]\n• [Benefit 3]\n\nDon't miss out! Link in bio 🔗",
    platforms: ["instagram", "facebook", "twitter"],
    hashtags: ["#Sale", "#LimitedOffer", "#DontMissOut"],
    emoji: "⏰"
  },
  {
    id: "promo-2",
    title: "Feature Highlight",
    category: "promotional",
    content: "✨ Spotlight on [Feature/Product]:\n\nThe problem it solves: [Pain point]\n\nHow it helps you: [Solution]\n\nWhat makes it special: [Unique value]\n\nReady to experience the difference? 👉 [CTA]",
    platforms: ["linkedin", "facebook", "instagram"],
    hashtags: ["#ProductSpotlight", "#Features", "#Solution"],
    emoji: "✨"
  },
  {
    id: "promo-3",
    title: "Customer Testimonial",
    category: "promotional",
    content: "💬 Real results from real people:\n\n\"[Customer quote about their experience]\"\n- [Customer Name], [Title/Role]\n\n[Product/Service] helped them achieve [specific result].\n\nWant similar results? Let's chat! 👇",
    platforms: ["linkedin", "facebook", "instagram"],
    hashtags: ["#Testimonial", "#CustomerSuccess", "#Results"],
    emoji: "💬"
  },

  // Engagement Templates
  {
    id: "eng-1",
    title: "Question Poll",
    category: "engagement",
    content: "🤔 Quick question for you:\n\n[Engaging question about your audience's preferences/opinions]\n\nA) [Option 1]\nB) [Option 2]\nC) [Option 3]\nD) [Something else - tell us below!]\n\nDrop your answer in the comments! 👇",
    platforms: ["twitter", "instagram", "facebook", "linkedin"],
    hashtags: ["#Poll", "#YourOpinion", "#LetsTalk"],
    emoji: "🤔"
  },
  {
    id: "eng-2",
    title: "Fill in the Blank",
    category: "engagement",
    content: "Complete this sentence:\n\n\"The best part of [topic/experience] is ___________.\"\n\nNo wrong answers! Let's see what everyone says 💭",
    platforms: ["twitter", "instagram", "facebook"],
    hashtags: ["#Engagement", "#Community", "#YourTurn"],
    emoji: "💭"
  },
  {
    id: "eng-3",
    title: "This or That",
    category: "engagement",
    content: "🆚 [Option A] or [Option B]?\n\nTeam [A] says: [Reason]\nTeam [B] says: [Reason]\n\nWhere do you stand? Comment below! 👇\n\n(Bonus points if you explain why!)",
    platforms: ["twitter", "instagram", "tiktok", "facebook"],
    hashtags: ["#ThisOrThat", "#Debate", "#TeamA #TeamB"],
    emoji: "🆚"
  },
  {
    id: "eng-4",
    title: "Caption This",
    category: "engagement",
    content: "📸 Caption this [photo/image]:\n\n[Add your image]\n\nFunniest/most creative caption wins bragging rights! 🏆\n\nGo! 👇",
    platforms: ["instagram", "facebook", "twitter"],
    hashtags: ["#CaptionThis", "#Contest", "#Creative"],
    emoji: "📸"
  },

  // Behind the Scenes Templates
  {
    id: "bts-1",
    title: "Day in the Life",
    category: "behind-scenes",
    content: "☕ A typical day in my life:\n\n6:00 AM - [Activity]\n9:00 AM - [Activity]\n12:00 PM - [Activity]\n3:00 PM - [Activity]\n6:00 PM - [Activity]\n\nIt's not always glamorous, but it's real! What does your day look like? 👇",
    platforms: ["instagram", "tiktok", "twitter"],
    hashtags: ["#DayInTheLife", "#BehindTheScenes", "#RealLife"],
    emoji: "☕"
  },
  {
    id: "bts-2",
    title: "Process Reveal",
    category: "behind-scenes",
    content: "🎬 How we create [Product/Content]:\n\nMost people see the final result, but here's what really goes into it:\n\n→ [Step/Stage 1]\n→ [Step/Stage 2]\n→ [Step/Stage 3]\n→ [Final touches]\n\nThe magic is in the process! ✨",
    platforms: ["instagram", "youtube", "linkedin", "tiktok"],
    hashtags: ["#BehindTheScenes", "#Process", "#HowItsMade"],
    emoji: "🎬"
  },
  {
    id: "bts-3",
    title: "Team Spotlight",
    category: "behind-scenes",
    content: "👋 Meet [Team Member Name]!\n\nRole: [Job Title]\nAt [Company] for: [Duration]\nFavorite thing about the job: [Quote]\n\nFun fact: [Interesting detail]\n\nOur team makes everything possible! Who should we feature next? 💙",
    platforms: ["linkedin", "instagram", "facebook"],
    hashtags: ["#TeamSpotlight", "#MeetTheTeam", "#CompanyCulture"],
    emoji: "👋"
  },

  // Storytelling Templates
  {
    id: "story-1",
    title: "Origin Story",
    category: "storytelling",
    content: "🌱 How it all started:\n\n[Years] ago, I [situation/problem you faced].\n\nI realized [insight/turning point].\n\nToday, [current situation and achievement].\n\nThe journey hasn't been easy, but every step was worth it.\n\nWhat's your origin story? 💫",
    platforms: ["linkedin", "instagram", "blog", "facebook"],
    hashtags: ["#OriginStory", "#Journey", "#StartupStory"],
    emoji: "🌱"
  },
  {
    id: "story-2",
    title: "Lesson Learned",
    category: "storytelling",
    content: "💡 A lesson that changed everything:\n\n[Describe the situation]\n\nWhat I learned: [Key takeaway]\n\nHow it changed my approach: [Impact]\n\nNow I always [new behavior/mindset].\n\nWhat's a lesson that changed your life?",
    platforms: ["linkedin", "twitter", "instagram"],
    hashtags: ["#LessonsLearned", "#Growth", "#Wisdom"],
    emoji: "💡"
  },
  {
    id: "story-3",
    title: "Challenge Overcome",
    category: "storytelling",
    content: "🏔️ The challenge: [Describe obstacle]\n\nThe struggle: [How it felt/what made it hard]\n\nThe breakthrough: [Turning point]\n\nThe outcome: [Result]\n\nKey lesson: [What you'd tell others]\n\nYou're stronger than you think. Keep going! 💪",
    platforms: ["linkedin", "instagram", "facebook", "blog"],
    hashtags: ["#Overcome", "#Inspiration", "#NeverGiveUp"],
    emoji: "🏔️"
  }
];

const categoryIcons: Record<TemplateCategory, any> = {
  announcement: Megaphone,
  educational: BookOpen,
  promotional: TrendingUp,
  engagement: Users,
  "behind-scenes": Camera,
  storytelling: Heart
};

const categoryLabels: Record<TemplateCategory, string> = {
  announcement: "Announcement",
  educational: "Educational",
  promotional: "Promotional",
  engagement: "Engagement",
  "behind-scenes": "Behind the Scenes",
  storytelling: "Storytelling"
};

interface TemplateLibraryProps {
  onUseTemplate: (template: ContentTemplate) => void;
}

export const TEMPLATE_COUNT = templates.length;

export function TemplateLibrary({ onUseTemplate }: TemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [customTemplates, setCustomTemplates] = useState<ContentTemplate[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContentTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<ContentTemplate | null>(null);

  // Load custom templates on mount
  useEffect(() => {
    setCustomTemplates(getCustomTemplates());
  }, []);

  // Combine built-in and custom templates
  const allTemplates = [...customTemplates, ...templates];

  const handleSaveTemplate = (template: ContentTemplate) => {
    try {
      saveCustomTemplate(template);
      setCustomTemplates(getCustomTemplates());
      setEditingTemplate(null);
    } catch (error) {
      toast.error("Failed to save template");
    }
  };

  const handleEditTemplate = (template: ContentTemplate) => {
    setEditingTemplate(template);
    setCreateDialogOpen(true);
  };

  const handleDeleteClick = (template: ContentTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (templateToDelete) {
      try {
        deleteCustomTemplate(templateToDelete.id);
        setCustomTemplates(getCustomTemplates());
        toast.success("Template deleted");
      } catch (error) {
        toast.error("Failed to delete template");
      }
      setTemplateToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const isCustomTemplate = (template: ContentTemplate) => {
    return template.id.startsWith('custom-');
  };

  const filteredTemplates = allTemplates.filter(template => {
    const matchesSearch = 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Separate custom and built-in templates for display
  const customFiltered = filteredTemplates.filter(isCustomTemplate);
  const builtInFiltered = filteredTemplates.filter(t => !isCustomTemplate(t));

  const categories = [
    { value: "all", label: "All Templates", icon: FileText },
    { value: "announcement", label: "Announcement", icon: Megaphone },
    { value: "educational", label: "Educational", icon: BookOpen },
    { value: "promotional", label: "Promotional", icon: TrendingUp },
    { value: "engagement", label: "Engagement", icon: Users },
    { value: "behind-scenes", label: "Behind the Scenes", icon: Camera },
    { value: "storytelling", label: "Storytelling", icon: Heart },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-emerald-400 mb-2">Content Templates</h2>
        <p className="text-muted-foreground">
          Start with proven templates and customize them for your audience
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => {
            setEditingTemplate(null);
            setCreateDialogOpen(true);
          }}
          className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg shadow-purple-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="grid grid-cols-3 lg:grid-cols-7 w-full">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <TabsTrigger key={category.value} value={category.value} className="gap-2">
                <Icon className="w-4 h-4" />
                <span className="hidden lg:inline">{category.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6 space-y-8">
          {filteredTemplates.length === 0 ? (
            <Card className="p-12 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="mb-2">No templates found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or browse a different category
              </p>
            </Card>
          ) : (
            <>
              {/* Custom Templates Section */}
              {customFiltered.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-emerald-400">Your Custom Templates</h3>
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                      {customFiltered.length}
                    </Badge>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {customFiltered.map((template) => {
                      const CategoryIcon = categoryIcons[template.category];
                      return (
                        <Card key={template.id} className="p-6 flex flex-col border-purple-500/20">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 flex-shrink-0">
                                <CategoryIcon className="w-5 h-5 text-purple-400" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-base truncate">{template.title}</h3>
                                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[10px] px-1 py-0 flex-shrink-0">
                                    <Star className="w-2.5 h-2.5 mr-0.5" />
                                    Custom
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {categoryLabels[template.category]}
                                </p>
                              </div>
                            </div>
                            <span className="text-2xl flex-shrink-0">{template.emoji}</span>
                          </div>

                          <div className="flex-1 mb-4">
                            <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                              <p className="text-sm text-muted-foreground line-clamp-6 whitespace-pre-wrap">
                                {template.content}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                              {template.platforms.slice(0, 6).map((platform) => (
                                <div 
                                  key={platform}
                                  className="flex items-center gap-1 px-2 py-1 bg-muted/30 border border-border/50 rounded text-xs"
                                >
                                  <PlatformIcon platform={platform} className="w-3 h-3" size={12} />
                                </div>
                              ))}
                              {template.platforms.length > 6 && (
                                <div className="px-2 py-1 bg-muted/30 border border-border/50 rounded text-xs text-muted-foreground">
                                  +{template.platforms.length - 6}
                                </div>
                              )}
                            </div>

                            {template.hashtags && template.hashtags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {template.hashtags.slice(0, 3).map((tag, idx) => (
                                  <Badge 
                                    key={idx} 
                                    variant="outline" 
                                    className="text-xs bg-blue-500/5 text-blue-400 border-blue-500/20"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Button
                                onClick={() => onUseTemplate(template)}
                                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg shadow-purple-500/20"
                              >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Use
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEditTemplate(template)}
                                className="hover:bg-emerald-500/10 hover:border-emerald-500/30"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDeleteClick(template)}
                                className="hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Built-in Templates Section */}
              {builtInFiltered.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-emerald-400">Built-in Templates</h3>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                      <Crown className="w-3 h-3 mr-1" />
                      {builtInFiltered.length}
                    </Badge>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {builtInFiltered.map((template) => {
                      const CategoryIcon = categoryIcons[template.category];
                      return (
                        <Card key={template.id} className="p-6 flex flex-col">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                                <CategoryIcon className="w-5 h-5 text-emerald-400" />
                              </div>
                              <div>
                                <h3 className="text-base">{template.title}</h3>
                                <p className="text-xs text-muted-foreground">
                                  {categoryLabels[template.category]}
                                </p>
                              </div>
                            </div>
                            <span className="text-2xl">{template.emoji}</span>
                          </div>

                          <div className="flex-1 mb-4">
                            <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                              <p className="text-sm text-muted-foreground line-clamp-6 whitespace-pre-wrap">
                                {template.content}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                              {template.platforms.slice(0, 6).map((platform) => (
                                <div 
                                  key={platform}
                                  className="flex items-center gap-1 px-2 py-1 bg-muted/30 border border-border/50 rounded text-xs"
                                >
                                  <PlatformIcon platform={platform} className="w-3 h-3" size={12} />
                                </div>
                              ))}
                              {template.platforms.length > 6 && (
                                <div className="px-2 py-1 bg-muted/30 border border-border/50 rounded text-xs text-muted-foreground">
                                  +{template.platforms.length - 6}
                                </div>
                              )}
                            </div>

                            {template.hashtags && template.hashtags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {template.hashtags.slice(0, 3).map((tag, idx) => (
                                  <Badge 
                                    key={idx} 
                                    variant="outline" 
                                    className="text-xs bg-blue-500/5 text-blue-400 border-blue-500/20"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            <Button
                              onClick={() => onUseTemplate(template)}
                              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/20"
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                              Use Template
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      <Card className="p-6 bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Star className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h4 className="mb-1">Pro Tip</h4>
            <p className="text-sm text-muted-foreground">
              Templates are starting points! Personalize them with your unique voice, add specific details, and adapt them to your audience for best results.
            </p>
          </div>
        </div>
      </Card>

      {/* Create/Edit Template Dialog */}
      <CreateTemplateDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) setEditingTemplate(null);
        }}
        onSave={handleSaveTemplate}
        editingTemplate={editingTemplate}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{templateToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}