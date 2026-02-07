"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  User,
  Circle,
} from "lucide-react";

// Dummy chat data
const conversations = [
  {
    id: 1,
    name: "Sarah Chen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    lastMessage: "Thanks for the update! Looking forward to it.",
    timestamp: "2m ago",
    unread: 2,
    online: true,
  },
  {
    id: 2,
    name: "Alex Morgan",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    lastMessage: "I'll send you the files by tomorrow.",
    timestamp: "1h ago",
    unread: 0,
    online: true,
  },
  {
    id: 3,
    name: "Emma Davis",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    lastMessage: "Perfect! Let's schedule a call.",
    timestamp: "3h ago",
    unread: 0,
    online: false,
  },
  {
    id: 4,
    name: "Mike Johnson",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    lastMessage: "Can you review the design mockups?",
    timestamp: "5h ago",
    unread: 1,
    online: false,
  },
  {
    id: 5,
    name: "Lisa Zhang",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
    lastMessage: "Great work on the project!",
    timestamp: "1d ago",
    unread: 0,
    online: true,
  },
];

const messages = [
  {
    id: 1,
    senderId: 1,
    text: "Hi! I saw your profile and I'm interested in working with you on my project.",
    timestamp: "10:30 AM",
    isOwn: false,
  },
  {
    id: 2,
    senderId: "me",
    text: "Hello! Thank you for reaching out. I'd be happy to discuss your project.",
    timestamp: "10:32 AM",
    isOwn: true,
  },
  {
    id: 3,
    senderId: 1,
    text: "Great! I need a modern website for my business. Do you have experience with e-commerce?",
    timestamp: "10:33 AM",
    isOwn: false,
  },
  {
    id: 4,
    senderId: "me",
    text: "Yes, I have extensive experience building e-commerce platforms. I've worked with Shopify, WooCommerce, and custom solutions.",
    timestamp: "10:35 AM",
    isOwn: true,
  },
  {
    id: 5,
    senderId: 1,
    text: "That sounds perfect! Can we schedule a call to discuss the details?",
    timestamp: "10:36 AM",
    isOwn: false,
  },
  {
    id: 6,
    senderId: "me",
    text: "Absolutely! I'm available tomorrow afternoon. What time works best for you?",
    timestamp: "10:38 AM",
    isOwn: true,
  },
  {
    id: 7,
    senderId: 1,
    text: "Thanks for the update! Looking forward to it.",
    timestamp: "10:40 AM",
    isOwn: false,
  },
];

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState(conversations[0]);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  
  // Determine user type based on referrer or default to client
  // Check if we came from a freelancer page
  const isFreelancer = typeof window !== 'undefined' && 
    (document.referrer.includes('/freelancer') || 
     document.referrer.includes('/projects') || 
     document.referrer.includes('/time-tracking') ||
     sessionStorage.getItem('userType') === 'freelancer');
  
  const userType = isFreelancer ? 'freelancer' : 'client';

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageText.trim()) {
      // Handle sending message
      console.log("Sending message:", messageText);
      setMessageText("");
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType={userType} />

      {/* Main Chat Container */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex h-[calc(100vh-140px)] gap-4 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          {/* Conversations Sidebar */}
          <div className="flex w-80 flex-col border-r border-border">
            {/* Sidebar Header */}
            <div className="border-b border-border p-4">
              <h2 className="mb-3 font-display text-xl font-bold text-foreground">
                Messages
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-xl border-border bg-secondary pl-10 pr-4 text-sm"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedChat(conv)}
                  className={`flex w-full items-center gap-3 border-b border-border p-4 transition-colors hover:bg-secondary ${
                    selectedChat.id === conv.id ? "bg-secondary" : ""
                  }`}
                >
                  <div className="relative">
                    <img
                      src={conv.avatar}
                      alt={conv.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    {conv.online && (
                      <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-green-500 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">{conv.name}</h3>
                      <span className="text-xs text-muted-foreground">
                        {conv.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="line-clamp-1 text-sm text-muted-foreground">
                        {conv.lastMessage}
                      </p>
                      {conv.unread > 0 && (
                        <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex flex-1 flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={selectedChat.avatar}
                    alt={selectedChat.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  {selectedChat.online && (
                    <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-green-500 text-green-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {selectedChat.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedChat.online ? "Active now" : "Offline"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        message.isOwn
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary text-foreground"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <span
                        className={`mt-1 block text-xs ${
                          message.isOwn
                            ? "text-accent-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {message.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div className="border-t border-border p-4">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="icon">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Button type="button" variant="ghost" size="icon">
                  <Smile className="h-5 w-5" />
                </Button>
                <Input
                  type="text"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 rounded-xl border-border bg-secondary"
                />
                <Button
                  type="submit"
                  variant="accent"
                  size="icon"
                  disabled={!messageText.trim()}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
