import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ChevronLeft, ChevronRight, Bookmark, BookmarkCheck, Loader2, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { useProject } from "./ProjectContext";

type Platform = "all" | "twitter" | "instagram" | "linkedin" | "facebook" | "youtube" | "tiktok" | "pinterest" | "reddit" | "blog";

interface ContentIdea {
  id: string;
  number: number;
  summary: string;
  details: string;
  niche?: string;
  contentType?: string;
}

interface BrainstormProps {
  selectedPlatform: Platform;
}

export function Brainstorm({ selectedPlatform }: BrainstormProps) {
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedIdeas, setSavedIdeas] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { currentProject } = useProject();

  useEffect(() => {
    loadIdeas();
    loadSavedIdeas();
  }, [selectedPlatform, currentProject?.id]);

  const loadIdeas = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // For now, using mock data
      const mockIdeas: ContentIdea[] = Array.from({ length: 10 }, (_, i) => ({
        id: `idea-${i + 1}`,
        number: i + 1,
        summary: `Content idea ${i + 1}: Create engaging ${selectedPlatform === 'all' ? 'multi-platform' : selectedPlatform} content that resonates with your audience.`,
        details: `This idea focuses on creating content that works well across platforms. Consider adapting the core message to fit each platform's unique format and audience expectations. Think about how you can repurpose this content into different formats like videos, carousels, or blog posts.`,
        niche: "general",
        contentType: "educational"
      }));
      setIdeas(mockIdeas);
    } catch (error) {
      toast.error("Failed to load content ideas");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedIdeas = () => {
    // Load saved ideas from localStorage or API
    const saved = localStorage.getItem(`saved-ideas-${currentProject?.id || 'default'}`);
    if (saved) {
      try {
        setSavedIdeas(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error("Failed to load saved ideas", e);
      }
    }
  };

  const saveSavedIdeas = (newSaved: Set<string>) => {
    localStorage.setItem(`saved-ideas-${currentProject?.id || 'default'}`, JSON.stringify(Array.from(newSaved)));
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : ideas.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < ideas.length - 1 ? prev + 1 : 0));
  };

  const handleSaveIdea = (ideaId: string) => {
    const newSaved = new Set(savedIdeas);
    if (newSaved.has(ideaId)) {
      newSaved.delete(ideaId);
      toast.success("Idea removed from saved");
    } else {
      newSaved.add(ideaId);
      toast.success("Idea saved for later");
    }
    setSavedIdeas(newSaved);
    saveSavedIdeas(newSaved);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (ideas.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="mb-2 flex items-center gap-2">
            <Lightbulb className="w-6 h-6" />
            Brainstorm
          </h1>
          <p className="text-muted-foreground">
            Get AI-powered content ideas aligned with your niche and content type
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Lightbulb className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No ideas yet</h3>
            <p className="text-muted-foreground mb-4">
              We're generating content ideas tailored to your niche. Check back soon!
            </p>
            <Button onClick={loadIdeas}>Refresh Ideas</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentIdea = ideas[currentIndex];
  const isSaved = savedIdeas.has(currentIdea.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 flex items-center gap-2">
          <Lightbulb className="w-6 h-6" />
          Brainstorm
        </h1>
        <p className="text-muted-foreground">
          Get AI-powered content ideas aligned with your niche and content type
        </p>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-lg px-3 py-1">
              Idea {currentIdea.number} of {ideas.length}
            </Badge>
            {currentIdea.niche && (
              <Badge variant="secondary">{currentIdea.niche}</Badge>
            )}
            {currentIdea.contentType && (
              <Badge variant="secondary">{currentIdea.contentType}</Badge>
            )}
          </div>
          <Button
            variant={isSaved ? "default" : "outline"}
            size="sm"
            onClick={() => handleSaveIdea(currentIdea.id)}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-4 h-4 mr-2" />
                Saved
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4 mr-2" />
                Save Idea
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold leading-tight">
              {currentIdea.summary}
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              {currentIdea.details}
            </p>
          </div>

          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <div className="flex gap-2">
              {ideas.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex
                      ? "bg-primary"
                      : "bg-muted hover:bg-muted-foreground/50"
                  }`}
                  aria-label={`Go to idea ${index + 1}`}
                />
              ))}
            </div>
            <Button
              variant="outline"
              onClick={handleNext}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {savedIdeas.size > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BookmarkCheck className="w-5 h-5" />
              Saved Ideas ({savedIdeas.size})
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ideas
                .filter((idea) => savedIdeas.has(idea.id))
                .map((idea) => (
                  <div
                    key={idea.id}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">#{idea.number}</Badge>
                        <span className="font-semibold">{idea.summary}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSaveIdea(idea.id)}
                    >
                      <BookmarkCheck className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

