import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Sparkles, Send, X, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { cn } from "./ui/utils";

type View = "dashboard" | "compose" | "inbox" | "calendar" | "ai" | "connections";
type Platform = "twitter" | "instagram" | "linkedin" | "facebook" | "youtube" | "tiktok" | "pinterest" | "reddit" | "blog";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentView: View;
  selectedPlatform: Platform;
  initialQuery?: string;
}

export function AIChatDialog({
  open,
  onOpenChange,
  currentView,
  selectedPlatform,
  initialQuery = "",
}: AIChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    if (open && messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        role: "assistant",
        content: `Hi! I'm PubHub AI. I can help you with questions about your content, analytics, scheduling, and more. What would you like to know?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      
      // If there's an initial query, set it in the input
      if (initialQuery) {
        setInput(initialQuery);
      }
    }
  }, [open, initialQuery, messages.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Input will auto-focus using the autoFocus prop

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response (in production, this would call your AI backend)
    setTimeout(() => {
      const aiResponse = generateAIResponse(userMessage.content, currentView, selectedPlatform);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleClear = () => {
    setMessages([]);
    setInput("");
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
  };

  const exampleQueries = [
    "What's my engagement rate this week?",
    "When should I post on Instagram?",
    "Show me my best performing content",
    "Help me come up with content ideas",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[85vh] max-h-[700px] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border/50 bg-gradient-to-r from-emerald-500/10 to-teal-600/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle>Ask PubHub</DialogTitle>
                <DialogDescription>
                  Your AI-powered content assistant
                </DialogDescription>
              </div>
            </div>
            {messages.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-xs"
              >
                Clear Chat
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 min-h-0 px-6 py-4">
          <div className="space-y-4">
            {/* Example queries - shown only when conversation is fresh */}
            {messages.length === 1 && (
              <div className="space-y-2 pb-4">
                <p className="text-xs text-muted-foreground">Try asking:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {exampleQueries.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => handleExampleClick(query)}
                      className="text-left text-sm px-3 py-2 rounded-lg border border-border/50 bg-card/50 hover:bg-card hover:border-emerald-500/50 transition-colors"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                      <Sparkles className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 max-w-[80%]",
                    message.role === "user"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                      : "bg-card border border-border/50"
                  )}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <p
                    className={cn(
                      "text-xs mt-1",
                      message.role === "user"
                        ? "text-emerald-100"
                        : "text-muted-foreground"
                    )}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {message.role === "user" && (
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <Sparkles className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-2xl px-4 py-3 bg-card border border-border/50">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="px-6 py-4 border-t border-border/50 bg-card/50">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your content..."
              className="flex-1"
              disabled={isLoading}
              autoFocus
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            Currently viewing: {currentView === "ai" ? `${selectedPlatform} insights` : currentView}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Simulated AI response generator (replace with real API call)
function generateAIResponse(query: string, currentView: View, platform: Platform): string {
  const lowercaseQuery = query.toLowerCase();

  // Context-aware responses based on current view
  if (lowercaseQuery.includes("post") && lowercaseQuery.includes("composting")) {
    return `Based on your content history, your last post about composting was 12 days ago on Instagram. It received 342 likes and 28 comments. Would you like me to help you create a new composting-related post?`;
  }

  if (lowercaseQuery.includes("engagement") || lowercaseQuery.includes("analytics")) {
    return `Your average engagement rate across all platforms this month is 4.8%, which is 0.7% higher than last month. Twitter is performing best at 6.2%, followed by Instagram at 5.1%. Would you like a detailed breakdown by platform?`;
  }

  if (lowercaseQuery.includes("schedule") || lowercaseQuery.includes("when")) {
    return `Based on your audience analytics, the best times to post this week are:\n\n• Twitter: 9 AM and 5 PM EST\n• Instagram: 11 AM and 7 PM EST\n• LinkedIn: 8 AM and 12 PM EST\n\nWould you like me to schedule a post for one of these optimal times?`;
  }

  if (lowercaseQuery.includes("idea") || lowercaseQuery.includes("content")) {
    return `Here are 3 content ideas based on your recent performance:\n\n1. "5 Sustainability Hacks" - Tutorial style (similar posts got 450+ likes)\n2. Behind-the-scenes of your composting setup (visual content performs 40% better)\n3. Q&A about common composting mistakes (engagement-heavy format)\n\nWhich one interests you?`;
  }

  if (lowercaseQuery.includes("hashtag")) {
    return `For ${platform} posts about sustainability, I recommend:\n\n#SustainableLiving #EcoFriendly #ZeroWaste #GreenLiving #Composting\n\nThese hashtags have generated 35% more reach in your previous posts. Want me to add them to your next post?`;
  }

  if (currentView === "compose") {
    return `I see you're working on creating content. I can help you with:\n\n• Generating post ideas\n• Suggesting optimal posting times\n• Creating engaging captions\n• Recommending hashtags\n• Checking content performance predictions\n\nWhat would you like help with?`;
  }

  if (currentView === "calendar") {
    return `Your content calendar shows you have 8 posts scheduled for this week. You're posting most frequently on Monday and Wednesday. I notice a gap on Friday - would you like me to suggest content to fill that slot?`;
  }

  if (currentView === "inbox") {
    return `You have 15 unread messages across all platforms. 3 of them mention potential collaboration opportunities. Would you like me to help you draft responses or prioritize which ones to respond to first?`;
  }

  // Default helpful response
  return `I'm here to help! I can assist you with:\n\n• Finding specific posts and content\n• Analyzing your performance metrics\n• Suggesting content ideas and hashtags\n• Scheduling posts at optimal times\n• Answering questions about your audience\n• Drafting engaging captions\n\nWhat would you like to know more about?`;
}
