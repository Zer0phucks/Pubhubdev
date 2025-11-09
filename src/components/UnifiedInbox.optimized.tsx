import { useState, useMemo, useCallback, memo } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { PlatformIcon } from "./PlatformIcon";
import { AITextGenerator } from "./AITextGenerator";
import {
  Search,
  Star,
  Reply,
  Heart,
  Archive
} from "lucide-react";

type Platform = "all" | "twitter" | "instagram" | "linkedin" | "facebook" | "youtube" | "tiktok" | "pinterest" | "reddit" | "blog";
type InboxView = "all" | "unread" | "comments" | "messages";

interface Message {
  id: string;
  platform: string;
  sender: string;
  message: string;
  time: string;
  isRead: boolean;
  type: "comment" | "dm" | "mention";
}

interface UnifiedInboxProps {
  inboxView: InboxView;
  selectedPlatform: Platform;
}

export const UnifiedInbox = memo(function UnifiedInbox({ inboxView, selectedPlatform }: UnifiedInboxProps) {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  // Messages will be loaded from connected platforms
  const allMessages: Message[] = useMemo(() => messages.length > 0 ? messages : [
    {
      id: "1",
      platform: "twitter",
      sender: "Sarah Chen",
      message: "Love this! Can you share more tips on content creation?",
      time: "5 min ago",
      isRead: false,
      type: "comment"
    },
    {
      id: "2",
      platform: "instagram",
      sender: "Mike Johnson",
      message: "This is exactly what I needed to see today. Thank you!",
      time: "15 min ago",
      isRead: false,
      type: "comment"
    },
    {
      id: "3",
      platform: "linkedin",
      sender: "Emily Rodriguez",
      message: "Great insights! Would love to collaborate on a project.",
      time: "1h ago",
      isRead: true,
      type: "dm"
    },
    {
      id: "4",
      platform: "twitter",
      sender: "Alex Kim",
      message: "Mentioned you in a post about content marketing strategies!",
      time: "2h ago",
      isRead: true,
      type: "mention"
    },
    {
      id: "5",
      platform: "instagram",
      sender: "Jordan Lee",
      message: "Your content always inspires me to create more!",
      time: "3h ago",
      isRead: true,
      type: "comment"
    },
    {
      id: "6",
      platform: "facebook",
      sender: "Alex Martinez",
      message: "Can you create more content like this? It's amazing!",
      time: "4h ago",
      isRead: false,
      type: "comment"
    },
    {
      id: "7",
      platform: "youtube",
      sender: "Taylor Swift",
      message: "Great video! Subscribed!",
      time: "5h ago",
      isRead: true,
      type: "comment"
    },
    {
      id: "8",
      platform: "tiktok",
      sender: "Chris Evans",
      message: "This trend is fire! 🔥",
      time: "6h ago",
      isRead: false,
      type: "comment"
    },
    {
      id: "9",
      platform: "linkedin",
      sender: "Morgan Davis",
      message: "I'd love to connect and discuss potential opportunities.",
      time: "7h ago",
      isRead: true,
      type: "dm"
    },
    {
      id: "10",
      platform: "pinterest",
      sender: "Jamie Parker",
      message: "Saved this to my inspiration board!",
      time: "8h ago",
      isRead: true,
      type: "comment"
    }
  ], [messages]);

  // Filter messages based on inbox view and platform
  const filteredMessages = useMemo(() => {
    let filtered = allMessages;

    // Filter by inbox view
    switch (inboxView) {
      case "unread":
        filtered = filtered.filter(m => !m.isRead);
        break;
      case "comments":
        filtered = filtered.filter(m => m.type === "comment" || m.type === "mention");
        break;
      case "messages":
        filtered = filtered.filter(m => m.type === "dm");
        break;
      // "all" shows everything, no filtering needed
    }

    // Filter by platform
    if (selectedPlatform !== "all") {
      filtered = filtered.filter(m => m.platform.toLowerCase() === selectedPlatform);
    }

    return filtered;
  }, [allMessages, inboxView, selectedPlatform]);

  const getPlatformIcon = useCallback((platform: string) => {
    return <PlatformIcon platform={platform} className="w-3 h-3" />;
  }, []);

  const getTypeColor = useCallback((type: string) => {
    switch (type) {
      case "comment": return "bg-blue-500/10 text-blue-500";
      case "dm": return "bg-purple-500/10 text-purple-500";
      case "mention": return "bg-green-500/10 text-green-500";
      default: return "";
    }
  }, []);

  const getViewTitle = useCallback(() => {
    switch (inboxView) {
      case "unread":
        return "Unread Messages";
      case "comments":
        return "Comments & Mentions";
      case "messages":
        return "Direct Messages";
      default:
        return "All Messages";
    }
  }, [inboxView]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="p-4">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search messages..." className="pl-10" />
              </div>
            </div>

            {filteredMessages.length > 0 ? (
              <div className="space-y-2">
                {filteredMessages.map(message => (
                  <button
                    key={message.id}
                    onClick={() => setSelectedMessage(message)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      selectedMessage?.id === message.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent'
                    } ${!message.isRead ? 'bg-accent/50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>{message.sender.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="truncate">{message.sender}</span>
                          {!message.isRead && <div className="w-2 h-2 bg-primary rounded-full" />}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{message.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="px-1.5 py-0.5 h-5">
                            {getPlatformIcon(message.platform)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{message.time}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No messages found</p>
              </Card>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedMessage ? (
            <Card className="p-6">
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback>{selectedMessage.sender.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3>{selectedMessage.sender}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">
                          {getPlatformIcon(selectedMessage.platform)}
                          <span className="ml-1 capitalize">{selectedMessage.platform}</span>
                        </Badge>
                        <Badge className={getTypeColor(selectedMessage.type)}>
                          {selectedMessage.type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{selectedMessage.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Star className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Archive className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <p>{selectedMessage.message}</p>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4>Reply</h4>
                    <AITextGenerator
                      onGenerate={(text) => setReplyText(text)}
                      context={selectedMessage.message}
                      contextType="reply"
                      variant="button"
                      buttonText="Generate Reply"
                      autoGenerate={true}
                    />
                  </div>
                  <div className="relative">
                    <Textarea
                      placeholder="Type your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="min-h-[120px] pr-12"
                    />
                    <div className="absolute top-2 right-2">
                      <AITextGenerator
                        onGenerate={(text) => setReplyText(text)}
                        context={selectedMessage.message}
                        contextType="reply"
                        placeholder="e.g., 'Write a friendly and professional reply'"
                        variant="icon"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-lg shadow-blue-500/20">
                      <Reply className="w-4 h-4 mr-2" />
                      Send Reply
                    </Button>
                    <Button variant="outline" className="border-pink-500/30 hover:bg-pink-500/10">
                      <Heart className="w-4 h-4 mr-2 text-pink-500" />
                      Like
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3>Select a message</h3>
                <p className="text-muted-foreground mt-2">Choose a message from the list to view and reply</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
});
