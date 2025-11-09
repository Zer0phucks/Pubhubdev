import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { 
  BookOpen, 
  Sparkles, 
  FileText, 
  Download, 
  Edit3, 
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  Loader2,
  Check,
  Plus,
  Trash2,
  Eye,
  Save,
  Wand2,
  RotateCw
} from "lucide-react";
import { toast } from "sonner";
import { useProject } from "./ProjectContext";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { getAuthToken } from "../utils/api";
import { logger } from "../utils/logger";

interface BookDetails {
  title: string;
  description: string;
  genre: string;
  customGenre?: string;
  subGenre: string;
  customSubGenre?: string;
  tone: string;
  customTone?: string;
  intendedLength: string;
  customLength?: string;
  targetAudience: string;
  customAudience?: string;
  writingStyle: string;
  customStyle?: string;
}

interface Chapter {
  id: string;
  title: string;
  description: string;
  content: string;
  wordCount: number;
  isGenerated: boolean;
}

interface BookOutline {
  chapters: Omit<Chapter, 'content' | 'isGenerated'>[];
  totalEstimatedWords: number;
}

const GENRES = [
  "Fiction",
  "Non-Fiction",
  "Mystery",
  "Romance",
  "Science Fiction",
  "Fantasy",
  "Horror",
  "Thriller",
  "Biography",
  "Self-Help",
  "Business",
  "History",
  "Travel",
  "Cookbook",
  "Poetry",
  "Children's",
  "Young Adult",
  "Other"
];

const SUB_GENRES: Record<string, string[]> = {
  "Fiction": ["Literary", "Historical", "Contemporary", "Adventure", "Crime", "Other"],
  "Non-Fiction": ["Memoir", "Essay", "Journalism", "Reference", "Textbook", "Other"],
  "Mystery": ["Cozy", "Hard-boiled", "Detective", "Police Procedural", "Noir", "Other"],
  "Romance": ["Contemporary", "Historical", "Paranormal", "Romantic Suspense", "Other"],
  "Science Fiction": ["Hard SF", "Space Opera", "Cyberpunk", "Dystopian", "Time Travel", "Other"],
  "Fantasy": ["High Fantasy", "Urban Fantasy", "Dark Fantasy", "Epic Fantasy", "Other"],
  "Horror": ["Gothic", "Psychological", "Supernatural", "Splatterpunk", "Other"],
  "Thriller": ["Legal", "Medical", "Political", "Psychological", "Techno", "Other"],
  "Business": ["Entrepreneurship", "Marketing", "Leadership", "Finance", "Management", "Other"],
  "Self-Help": ["Personal Development", "Productivity", "Relationships", "Health", "Spirituality", "Other"],
};

const TONES = [
  "Professional",
  "Casual",
  "Formal",
  "Friendly",
  "Inspirational",
  "Humorous",
  "Academic",
  "Conversational",
  "Authoritative",
  "Empathetic",
  "Motivational",
  "Educational",
  "Other"
];

const LENGTHS = [
  "Short (10-50 pages / 5,000-15,000 words)",
  "Medium (50-150 pages / 15,000-50,000 words)",
  "Long (150-300 pages / 50,000-100,000 words)",
  "Epic (300+ pages / 100,000+ words)",
  "Custom"
];

const TARGET_AUDIENCES = [
  "General Adult",
  "Young Adult (13-18)",
  "Children (8-12)",
  "Early Readers (5-7)",
  "Professionals",
  "Entrepreneurs",
  "Students",
  "Academics",
  "Enthusiasts",
  "Beginners",
  "Advanced",
  "Other"
];

const WRITING_STYLES = [
  "Descriptive",
  "Narrative",
  "Persuasive",
  "Expository",
  "Creative",
  "Technical",
  "Journalistic",
  "Poetic",
  "Minimalist",
  "Verbose",
  "Other"
];

type Step = "details" | "outline" | "content" | "cover" | "export";

export function EbookGenerator() {
  const { currentProject } = useProject();
  const [currentStep, setCurrentStep] = useState<Step>("details");
  const [bookDetails, setBookDetails] = useState<BookDetails>({
    title: "",
    description: "",
    genre: "",
    subGenre: "",
    tone: "",
    intendedLength: "",
    targetAudience: "",
    writingStyle: "",
  });
  const [outline, setOutline] = useState<BookOutline | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [coverArtUrl, setCoverArtUrl] = useState<string>("");
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isGeneratingChapter, setIsGeneratingChapter] = useState<string | null>(null);
  const [isGeneratingAllChapters, setIsGeneratingAllChapters] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [isGettingSuggestions, setIsGettingSuggestions] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [previewChapterId, setPreviewChapterId] = useState<string | null>(null);
  const [previousBooks, setPreviousBooks] = useState<{id: string; title: string; createdAt: string}[]>([]);

  useEffect(() => {
    // Load previous books from KV store
    loadPreviousBooks();
  }, [currentProject]);

  const loadPreviousBooks = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-19ccd85e/ebooks/previous`, {
        headers: {
          'Authorization': `Bearer ${token || publicAnonKey}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPreviousBooks(data.books || []);
      }
    } catch (error) {
      logger.error('Error loading previous books', error);
    }
  };

  const handleInputChange = (field: keyof BookDetails, value: string) => {
    setBookDetails(prev => ({ ...prev, [field]: value }));
  };

  const isFormComplete = () => {
    return (
      bookDetails.title.trim() !== "" &&
      bookDetails.description.trim() !== "" &&
      (bookDetails.genre !== "" && bookDetails.genre !== "Other" || bookDetails.customGenre) &&
      (bookDetails.subGenre !== "" && bookDetails.subGenre !== "Other" || bookDetails.customSubGenre) &&
      (bookDetails.tone !== "" && bookDetails.tone !== "Other" || bookDetails.customTone) &&
      (bookDetails.intendedLength !== "" && bookDetails.intendedLength !== "Custom" || bookDetails.customLength) &&
      (bookDetails.targetAudience !== "" && bookDetails.targetAudience !== "Other" || bookDetails.customAudience) &&
      (bookDetails.writingStyle !== "" && bookDetails.writingStyle !== "Other" || bookDetails.customStyle)
    );
  };

  const handleAISuggestions = async () => {
    setIsGettingSuggestions(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-19ccd85e/ebooks/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || publicAnonKey}`,
        },
        body: JSON.stringify({
          currentDetails: bookDetails,
          projectNiche: currentProject?.name || '',
          previousBooks: previousBooks,
        }),
      });

      if (!response.ok) throw new Error('Failed to get AI suggestions');

      const suggestions = await response.json();
      setBookDetails(prev => ({
        ...prev,
        ...suggestions,
      }));

      toast.success('AI suggestions applied!');
    } catch (error) {
      logger.error('Error getting AI suggestions', error);
      toast.error('Failed to get AI suggestions');
    } finally {
      setIsGettingSuggestions(false);
    }
  };

  const handleGenerateOutline = async () => {
    if (!isFormComplete()) {
      toast.error('Please complete all fields before generating outline');
      return;
    }

    setIsGeneratingOutline(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-19ccd85e/ebooks/outline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || publicAnonKey}`,
        },
        body: JSON.stringify({ bookDetails }),
      });

      if (!response.ok) throw new Error('Failed to generate outline');

      const generatedOutline = await response.json();
      setOutline(generatedOutline);
      
      // Initialize chapters with empty content
      const initialChapters: Chapter[] = generatedOutline.chapters.map((ch: { id: string; title: string; content?: string }) => ({
        ...ch,
        content: "",
        isGenerated: false,
      }));
      setChapters(initialChapters);
      
      setCurrentStep("outline");
      toast.success('Outline generated successfully!');
    } catch (error) {
      logger.error('Error generating outline', error);
      toast.error('Failed to generate outline');
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const handleGenerateChapter = async (chapterId: string) => {
    setIsGeneratingChapter(chapterId);
    try {
      const chapter = chapters.find(ch => ch.id === chapterId);
      if (!chapter) return;

      const token = getAuthToken();
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-19ccd85e/ebooks/chapter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || publicAnonKey}`,
        },
        body: JSON.stringify({
          bookDetails,
          chapter: {
            title: chapter.title,
            description: chapter.description,
          },
          previousChapters: chapters.filter(ch => ch.isGenerated).map(ch => ({
            title: ch.title,
            content: ch.content.substring(0, 500), // Send summary of previous chapters for context
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to generate chapter');

      const { content, wordCount } = await response.json();
      
      setChapters(prev => prev.map(ch => 
        ch.id === chapterId 
          ? { ...ch, content, wordCount, isGenerated: true }
          : ch
      ));

      toast.success(`Chapter "${chapter.title}" generated successfully!`);
    } catch (error) {
      logger.error('Error generating chapter', error);
      toast.error('Failed to generate chapter');
    } finally {
      setIsGeneratingChapter(null);
    }
  };

  const handleGenerateAllChapters = async () => {
    setIsGeneratingAllChapters(true);
    try {
      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        if (!chapter.isGenerated) {
          await handleGenerateChapter(chapter.id);
        }
      }
      setCurrentStep("content");
      toast.success('All chapters generated successfully!');
    } catch (error) {
      logger.error('Error generating all chapters', error);
      toast.error('Failed to generate all chapters');
    } finally {
      setIsGeneratingAllChapters(false);
    }
  };

  const handleEditChapter = (chapterId: string, newContent: string) => {
    setChapters(prev => prev.map(ch => 
      ch.id === chapterId 
        ? { ...ch, content: newContent, wordCount: newContent.split(/\s+/).length }
        : ch
    ));
  };

  const handleGenerateCoverArt = async () => {
    setIsGeneratingCover(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-19ccd85e/ebooks/cover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || publicAnonKey}`,
        },
        body: JSON.stringify({
          title: bookDetails.title,
          genre: bookDetails.genre === "Other" ? bookDetails.customGenre : bookDetails.genre,
          description: bookDetails.description,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate cover art');

      const { imageUrl } = await response.json();
      setCoverArtUrl(imageUrl);
      setCurrentStep("cover");
      toast.success('Cover art generated successfully!');
    } catch (error) {
      logger.error('Error generating cover art', error);
      toast.error('Failed to generate cover art');
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const handleExport = async (format: 'docx' | 'pdf') => {
    try {
      const token = getAuthToken();
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-19ccd85e/ebooks/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || publicAnonKey}`,
        },
        body: JSON.stringify({
          bookDetails,
          chapters,
          coverArtUrl,
          format,
        }),
      });

      if (!response.ok) throw new Error('Failed to export ebook');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${bookDetails.title}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Ebook exported as ${format.toUpperCase()}`);
    } catch (error) {
      logger.error('Error exporting ebook', error);
      toast.error('Failed to export ebook');
    }
  };

  const getStepProgress = () => {
    const steps = ["details", "outline", "content", "cover", "export"];
    return ((steps.indexOf(currentStep) + 1) / steps.length) * 100;
  };

  const allChaptersGenerated = chapters.every(ch => ch.isGenerated);
  const generatedChaptersCount = chapters.filter(ch => ch.isGenerated).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl tracking-tight">Ebook Generator</h1>
          <p className="text-muted-foreground">Create and export complete ebooks for Amazon KDP and more</p>
        </div>
        <Badge variant="outline" className="gap-2">
          <BookOpen className="w-4 h-4" />
          {previousBooks.length} Books Created
        </Badge>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span>{Math.round(getStepProgress())}%</span>
            </div>
            <Progress value={getStepProgress()} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className={currentStep === "details" ? "text-primary" : ""}>Details</span>
              <span className={currentStep === "outline" ? "text-primary" : ""}>Outline</span>
              <span className={currentStep === "content" ? "text-primary" : ""}>Content</span>
              <span className={currentStep === "cover" ? "text-primary" : ""}>Cover</span>
              <span className={currentStep === "export" ? "text-primary" : ""}>Export</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={currentStep} onValueChange={(value) => setCurrentStep(value as Step)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="details" disabled={false}>
            <FileText className="w-4 h-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="outline" disabled={!outline}>
            <BookOpen className="w-4 h-4 mr-2" />
            Outline
          </TabsTrigger>
          <TabsTrigger value="content" disabled={chapters.length === 0}>
            <Edit3 className="w-4 h-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="cover" disabled={!allChaptersGenerated}>
            <ImageIcon className="w-4 h-4 mr-2" />
            Cover
          </TabsTrigger>
          <TabsTrigger value="export" disabled={!coverArtUrl}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </TabsTrigger>
        </TabsList>

        {/* STEP 1: Book Details */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Book Details
              </CardTitle>
              <CardDescription>
                Fill out the details for your ebook or use AI suggestions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter your book title"
                  value={bookDetails.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide a brief description of your book"
                  value={bookDetails.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="genre">Genre *</Label>
                  <Select value={bookDetails.genre} onValueChange={(value) => handleInputChange('genre', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENRES.map(genre => (
                        <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {bookDetails.genre === "Other" && (
                    <Input
                      placeholder="Enter custom genre"
                      value={bookDetails.customGenre || ""}
                      onChange={(e) => handleInputChange('customGenre', e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subGenre">Sub-Genre *</Label>
                  <Select 
                    value={bookDetails.subGenre} 
                    onValueChange={(value) => handleInputChange('subGenre', value)}
                    disabled={!bookDetails.genre}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sub-genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {(SUB_GENRES[bookDetails.genre] || ["Other"]).map(subGenre => (
                        <SelectItem key={subGenre} value={subGenre}>{subGenre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {bookDetails.subGenre === "Other" && (
                    <Input
                      placeholder="Enter custom sub-genre"
                      value={bookDetails.customSubGenre || ""}
                      onChange={(e) => handleInputChange('customSubGenre', e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tone">Tone *</Label>
                  <Select value={bookDetails.tone} onValueChange={(value) => handleInputChange('tone', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map(tone => (
                        <SelectItem key={tone} value={tone}>{tone}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {bookDetails.tone === "Other" && (
                    <Input
                      placeholder="Enter custom tone"
                      value={bookDetails.customTone || ""}
                      onChange={(e) => handleInputChange('customTone', e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="length">Intended Length *</Label>
                  <Select value={bookDetails.intendedLength} onValueChange={(value) => handleInputChange('intendedLength', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select length" />
                    </SelectTrigger>
                    <SelectContent>
                      {LENGTHS.map(length => (
                        <SelectItem key={length} value={length}>{length}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {bookDetails.intendedLength === "Custom" && (
                    <Input
                      placeholder="e.g., 200 pages / 75,000 words"
                      value={bookDetails.customLength || ""}
                      onChange={(e) => handleInputChange('customLength', e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience *</Label>
                  <Select value={bookDetails.targetAudience} onValueChange={(value) => handleInputChange('targetAudience', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGET_AUDIENCES.map(audience => (
                        <SelectItem key={audience} value={audience}>{audience}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {bookDetails.targetAudience === "Other" && (
                    <Input
                      placeholder="Enter custom audience"
                      value={bookDetails.customAudience || ""}
                      onChange={(e) => handleInputChange('customAudience', e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="style">Writing Style *</Label>
                  <Select value={bookDetails.writingStyle} onValueChange={(value) => handleInputChange('writingStyle', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      {WRITING_STYLES.map(style => (
                        <SelectItem key={style} value={style}>{style}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {bookDetails.writingStyle === "Other" && (
                    <Input
                      placeholder="Enter custom style"
                      value={bookDetails.customStyle || ""}
                      onChange={(e) => handleInputChange('customStyle', e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex gap-3">
                <Button
                  onClick={handleAISuggestions}
                  variant="outline"
                  disabled={isGettingSuggestions}
                  className="flex-1"
                >
                  {isGettingSuggestions ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  AI Suggestions
                </Button>
                <Button
                  onClick={handleGenerateOutline}
                  disabled={!isFormComplete() || isGeneratingOutline}
                  className="flex-1"
                >
                  {isGeneratingOutline ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4 mr-2" />
                  )}
                  Generate Outline
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* STEP 2: Outline */}
        <TabsContent value="outline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Book Outline
                </span>
                <Badge variant="secondary">
                  {outline?.chapters.length || 0} Chapters
                </Badge>
              </CardTitle>
              <CardDescription>
                Review and edit your book outline before generating content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {outline && (
                <>
                  <div className="rounded-lg border p-4 bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{bookDetails.title}</h3>
                      <Badge>~{outline.totalEstimatedWords.toLocaleString()} words</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{bookDetails.description}</p>
                  </div>

                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {chapters.map((chapter, index) => (
                        <Card key={chapter.id} className={chapter.isGenerated ? "border-primary/50" : ""}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline">Chapter {index + 1}</Badge>
                                  {chapter.isGenerated && (
                                    <Badge variant="default" className="gap-1">
                                      <Check className="w-3 h-3" />
                                      Generated
                                    </Badge>
                                  )}
                                </div>
                                <h4 className="font-semibold">{chapter.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{chapter.description}</p>
                                {chapter.isGenerated && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {chapter.wordCount.toLocaleString()} words
                                  </p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleGenerateChapter(chapter.id)}
                                disabled={isGeneratingChapter !== null || chapter.isGenerated}
                              >
                                {isGeneratingChapter === chapter.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : chapter.isGenerated ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Sparkles className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>

                  <Separator />

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep("details")}
                      className="flex-1"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back to Details
                    </Button>
                    <Button
                      onClick={handleGenerateAllChapters}
                      disabled={isGeneratingAllChapters || allChaptersGenerated}
                      className="flex-1"
                    >
                      {isGeneratingAllChapters ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4 mr-2" />
                      )}
                      {allChaptersGenerated ? 'All Chapters Generated' : 'Generate All Chapters'}
                    </Button>
                    {allChaptersGenerated && (
                      <Button
                        onClick={() => setCurrentStep("content")}
                      >
                        Continue to Content
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>

                  {generatedChaptersCount > 0 && !allChaptersGenerated && (
                    <div className="text-center text-sm text-muted-foreground">
                      {generatedChaptersCount} of {chapters.length} chapters generated
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* STEP 3: Content Editing */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5" />
                  Edit Content
                </span>
                <Badge variant="secondary">
                  {chapters.reduce((sum, ch) => sum + ch.wordCount, 0).toLocaleString()} total words
                </Badge>
              </CardTitle>
              <CardDescription>
                Review and edit each chapter's content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {chapters.map((chapter, index) => (
                    <Card key={chapter.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <Badge variant="outline" className="mb-2">Chapter {index + 1}</Badge>
                            <CardTitle className="text-lg">{chapter.title}</CardTitle>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPreviewChapterId(chapter.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingChapterId(editingChapterId === chapter.id ? null : chapter.id)}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {editingChapterId === chapter.id ? (
                          <div className="space-y-3">
                            <Textarea
                              value={chapter.content}
                              onChange={(e) => handleEditChapter(chapter.id, e.target.value)}
                              rows={15}
                              className="font-mono text-sm"
                            />
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">
                                {chapter.wordCount.toLocaleString()} words
                              </span>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setEditingChapterId(null);
                                  toast.success('Changes saved');
                                }}
                              >
                                <Save className="w-4 h-4 mr-2" />
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {chapter.content}
                            </p>
                            <div className="text-xs text-muted-foreground">
                              {chapter.wordCount.toLocaleString()} words
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              <Separator />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep("outline")}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Outline
                </Button>
                <Button
                  onClick={() => setCurrentStep("cover")}
                  className="flex-1"
                >
                  Continue to Cover
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* STEP 4: Cover Art */}
        <TabsContent value="cover" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Cover Art
              </CardTitle>
              <CardDescription>
                Generate AI cover art for your ebook
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!coverArtUrl ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-64 h-96 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50">
                    <ImageIcon className="w-16 h-16 text-muted-foreground" />
                  </div>
                  <Button
                    onClick={handleGenerateCoverArt}
                    disabled={isGeneratingCover}
                    size="lg"
                  >
                    {isGeneratingCover ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Generate Cover Art
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4">
                  <img
                    src={coverArtUrl}
                    alt="Book Cover"
                    className="w-64 h-96 object-cover rounded-lg shadow-lg border"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleGenerateCoverArt}
                      disabled={isGeneratingCover}
                    >
                      {isGeneratingCover ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RotateCw className="w-4 h-4 mr-2" />
                      )}
                      Regenerate
                    </Button>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep("content")}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Content
                </Button>
                {coverArtUrl && (
                  <Button
                    onClick={() => setCurrentStep("export")}
                    className="flex-1"
                  >
                    Continue to Export
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* STEP 5: Export */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Ebook
              </CardTitle>
              <CardDescription>
                Download your completed ebook for Amazon KDP or other platforms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-2">
                  <CardContent className="pt-6 text-center space-y-4">
                    <FileText className="w-12 h-12 mx-auto text-primary" />
                    <div>
                      <h3 className="font-semibold">Microsoft Word</h3>
                      <p className="text-sm text-muted-foreground">Export as .DOCX</p>
                    </div>
                    <Button
                      onClick={() => handleExport('docx')}
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export DOCX
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardContent className="pt-6 text-center space-y-4">
                    <FileText className="w-12 h-12 mx-auto text-primary" />
                    <div>
                      <h3 className="font-semibold">PDF Document</h3>
                      <p className="text-sm text-muted-foreground">Export as .PDF</p>
                    </div>
                    <Button
                      onClick={() => handleExport('pdf')}
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">Book Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Title:</span>
                    <span className="font-medium">{bookDetails.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Genre:</span>
                    <span className="font-medium">
                      {bookDetails.genre === "Other" ? bookDetails.customGenre : bookDetails.genre}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chapters:</span>
                    <span className="font-medium">{chapters.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Words:</span>
                    <span className="font-medium">
                      {chapters.reduce((sum, ch) => sum + ch.wordCount, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Pages:</span>
                    <span className="font-medium">
                      {Math.round(chapters.reduce((sum, ch) => sum + ch.wordCount, 0) / 250)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              <Button
                variant="outline"
                onClick={() => setCurrentStep("cover")}
                className="w-full"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Cover
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Chapter Preview Dialog */}
      <Dialog open={previewChapterId !== null} onOpenChange={() => setPreviewChapterId(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {chapters.find(ch => ch.id === previewChapterId)?.title}
            </DialogTitle>
            <DialogDescription>
              {chapters.find(ch => ch.id === previewChapterId)?.wordCount.toLocaleString()} words
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {chapters.find(ch => ch.id === previewChapterId)?.content.split('\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
