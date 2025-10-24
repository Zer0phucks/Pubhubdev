import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Sparkles, Loader2, Wand2, Copy, Check, RotateCw } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface AITextGeneratorProps {
  onGenerate: (text: string) => void;
  context?: string;
  placeholder?: string;
  variant?: "icon" | "button";
  buttonText?: string;
  className?: string;
  contextType?: "reply" | "post" | "comment" | "template" | "general";
  autoGenerate?: boolean; // Automatically generate on open without requiring user input
}

export function AITextGenerator({
  onGenerate,
  context = "",
  placeholder = "Describe what you want to generate...",
  variant = "icon",
  buttonText = "Generate with AI",
  className = "",
  contextType = "general",
  autoGenerate = false,
}: AITextGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const getContextPrompt = () => {
    const contextPrompts: Record<string, string> = {
      reply: `You are helping write a reply to this message: "${context}". Generate a professional, friendly, and engaging response.`,
      post: `You are helping create social media content. Generate engaging and creative text.`,
      comment: `You are helping write a comment in response to: "${context}". Generate a thoughtful and engaging comment.`,
      template: `You are helping create a reusable content template. Generate versatile and professional text.`,
      general: `Generate helpful and relevant text based on the user's request.`,
    };
    return contextPrompts[contextType] || contextPrompts.general;
  };

  const getDefaultPrompt = () => {
    const defaultPrompts: Record<string, string> = {
      reply: "Write a friendly, professional, and engaging reply",
      post: "Create an engaging social media post",
      comment: "Write a thoughtful and engaging comment",
      template: "Create a versatile content template",
      general: "Generate helpful text",
    };
    return defaultPrompts[contextType] || defaultPrompts.general;
  };

  const generateText = async (useAutoPrompt = false) => {
    const effectivePrompt = useAutoPrompt ? getDefaultPrompt() : prompt;
    
    if (!effectivePrompt.trim()) {
      toast.error("Please enter a description");
      return;
    }

    setLoading(true);
    setGeneratedText("");

    try {
      // Simulate AI generation - replace with actual AI API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock generated text based on context type
      const mockGenerations: Record<string, string[]> = {
        reply: [
          "Thank you so much for reaching out! I'd be happy to help. Let me share some insights that might be useful for you.",
          "I really appreciate your message! That's a great question. Here's what I recommend...",
          "Thanks for your interest! I'm glad this resonated with you. Let me elaborate on that point.",
        ],
        post: [
          "🚀 Exciting news! We're thrilled to share something amazing with our community. Stay tuned for more updates!",
          "✨ Here's a quick tip that changed everything for me. Hope it helps you too! What's your experience with this?",
          "💡 Just learned something incredible and had to share it with you all. Let's discuss in the comments!",
        ],
        comment: [
          "This is spot on! I've experienced the same thing. Thanks for sharing your perspective!",
          "Great point! I'd love to add that this also works well when combined with...",
          "Absolutely agree! This is such an important topic. Would love to hear more about your approach.",
        ],
        template: [
          "🎯 [Template Name]\n\n📌 Key Point 1\n💡 Key Point 2\n✨ Key Point 3\n\nWhat are your thoughts? Let's discuss! 👇",
          "Hey everyone! 👋\n\nJust wanted to share [topic] with you all.\n\n[Main content here]\n\nLet me know what you think!",
        ],
        general: [
          "Here's a well-crafted response based on your requirements. Feel free to customize it further!",
        ],
      };

      const options = mockGenerations[contextType] || mockGenerations.general;
      const generated = options[Math.floor(Math.random() * options.length)];

      // Add context-aware customization
      let finalText = generated;
      if (effectivePrompt.toLowerCase().includes("professional")) {
        finalText = finalText.replace(/!/g, ".").replace(/✨|🚀|💡|🎯|📌|👇|👋/g, "");
      }

      setGeneratedText(finalText);
      toast.success("Text generated!");
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error("Failed to generate text. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate when popover opens if autoGenerate is true
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    
    if (newOpen && autoGenerate) {
      // Automatically generate with default prompt
      generateText(true);
    }
    
    // Reset state when closing
    if (!newOpen) {
      if (!autoGenerate) {
        setPrompt("");
      }
      setGeneratedText("");
      setCopied(false);
    }
  };

  const handleUseText = () => {
    if (generatedText) {
      onGenerate(generatedText);
      setOpen(false);
      setPrompt("");
      setGeneratedText("");
      toast.success("Text inserted!");
    }
  };

  const handleCopy = () => {
    if (generatedText) {
      navigator.clipboard.writeText(generatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard!");
    }
  };

  const handleRegenerate = () => {
    if (autoGenerate || prompt.trim()) {
      generateText(autoGenerate);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {variant === "icon" ? (
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${className}`}
            type="button"
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
          </Button>
        ) : (
          <Button
            variant="outline"
            className={`border-purple-500/30 hover:bg-purple-500/10 ${className}`}
            type="button"
          >
            <Wand2 className="w-4 h-4 mr-2 text-purple-500" />
            {buttonText}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[500px]" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <Label className="text-sm font-semibold">AI Text Generator</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              {getContextPrompt()}
            </p>
          </div>

          {!autoGenerate && (
            <>
              <div className="space-y-2">
                <Label htmlFor="ai-prompt">What do you want to generate?</Label>
                <Textarea
                  id="ai-prompt"
                  placeholder={placeholder}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[80px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      generateText(false);
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Press {navigator.platform.includes("Mac") ? "⌘" : "Ctrl"} + Enter to generate
                </p>
              </div>

              <Button
                onClick={() => generateText(false)}
                disabled={loading || !prompt.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </>
          )}

          {autoGenerate && loading && !generatedText && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500" />
                <p className="text-sm text-muted-foreground">Generating your reply...</p>
              </div>
            </div>
          )}

          {generatedText && (
            <div className="space-y-3 pt-3 border-t">
              <Label>Generated Text</Label>
              <div className="relative">
                <Textarea
                  value={generatedText}
                  onChange={(e) => setGeneratedText(e.target.value)}
                  className="min-h-[120px] pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={handleCopy}
                  type="button"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleUseText}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  Use This Text
                </Button>
                <Button
                  onClick={handleRegenerate}
                  variant="outline"
                  disabled={loading}
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
