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
import { Sparkles, Send, X, Loader2, CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { cn } from "./ui/utils";
import { aiAPI } from "../utils/api";
import { useProject } from "./ProjectContext";
import { toast } from "sonner";
import { logger } from "../utils/logger";

type View = "dashboard" | "compose" | "inbox" | "calendar" | "ai" | "connections";
type Platform = "twitter" | "instagram" | "linkedin" | "facebook" | "youtube" | "tiktok" | "pinterest" | "reddit" | "blog";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  functionsCalled?: string[];
}

interface AIChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentView: View;
  selectedPlatform: Platform;
  initialQuery?: string;
  autoSubmit?: boolean;
}

export function AIChatDialog({
  open,
  onOpenChange,
  currentView,
  selectedPlatform,
  initialQuery = "",
  autoSubmit = false,
}: AIChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentProject } = useProject();

  // Initialize with welcome message
  useEffect(() => {
    if (open && messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        role: "assistant",
        content: `Hi! I'm PubHub AI, your intelligent content repurposing assistant. I can help you:

• Repurpose your content across different platforms
• Create and schedule new posts for multiple platforms
• View and analyze your posts across all platforms
• Get content ideas and brainstorm new topics
• Check which platforms you're connected to
• Parse natural language date/time (e.g., "Tuesday at 8am")

Try asking me to repurpose content or create a new post!`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      
      // If there's an initial query, set it in the input
      if (initialQuery) {
        setInput(initialQuery);
      }
      
      // Reset auto-submit flag when dialog opens
      setHasAutoSubmitted(false);
    }
  }, [open, initialQuery, messages.length]);

  // Auto-submit the initial query if autoSubmit is true
  useEffect(() => {
    if (open && autoSubmit && initialQuery && messages.length > 0 && !hasAutoSubmitted && !isLoading) {
      setHasAutoSubmitted(true);
      // Trigger the submission
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: initialQuery,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      // Call AI API
      (async () => {
        try {
          const conversationMessages = [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }));

          const response = await aiAPI.chat(conversationMessages, currentProject?.id);

          if (response.success) {
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: response.message,
              timestamp: new Date(),
              functionsCalled: response.functionsCalled
            };
            setMessages((prev) => [...prev, assistantMessage]);

            if (response.functionsCalled && response.functionsCalled.length > 0) {
              toast.success(`Actions completed: ${response.functionsCalled.join(', ')}`);
            }
          } else {
            throw new Error(response.error || 'Failed to get AI response');
          }
        } catch (error: unknown) {
          const err = toAppError(error);
          logger.error('AI chat error during auto-submit', error);
          toast.error('Failed to get AI response: ' + err.message);

          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "I'm sorry, I encountered an error processing your request. Please try again.",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [open, autoSubmit, initialQuery, messages.length, hasAutoSubmitted, isLoading, currentProject]);

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

    try {
      // Call AI API with conversation history
      const conversationMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await aiAPI.chat(conversationMessages, currentProject?.id);

      if (response.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.message,
          timestamp: new Date(),
          functionsCalled: response.functionsCalled
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Show toast if functions were called
        if (response.functionsCalled && response.functionsCalled.length > 0) {
          toast.success(`Actions completed: ${response.functionsCalled.join(', ')}`);
        }
      } else {
        throw new Error(response.error || 'Failed to get AI response');
      }
    } catch (error: unknown) {
      const err = toAppError(error);
      logger.error('AI chat error during manual submit', error);
      toast.error('Failed to get AI response: ' + err.message);

      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setInput("");
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
  };

  const exampleQueries = [
    "Show me all my recent posts",
    "Create a post about our new product launch and schedule it for Tuesday at 8am on Twitter, LinkedIn, and Facebook",
    "What platforms am I connected to?",
    "Show me my drafts and scheduled posts",
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
                  {message.functionsCalled && message.functionsCalled.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {message.functionsCalled.map((fn, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs"
                        >
                          <CheckCircle className="w-3 h-3" />
                          {fn.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
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
