"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import {
  getConversations, getChatMessages, getOrCreateConversation,
  markConversationAsRead, deleteChatMessage, searchChatMessages, uploadChatFile
} from "@/lib/api";
import {
  Send, Search, Trash2, Circle, MessageSquare, X,
  Paperclip, Download, FileText, Image as ImageIcon, File
} from "lucide-react";

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800000) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const formatBytes = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const Avatar = ({ name, size = "h-10 w-10" }) => (
  <div className={`${size} rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-sm shrink-0`}>
    {name?.charAt(0)?.toUpperCase() || "?"}
  </div>
);

const FileMessage = ({ msg, isOwn, onLightbox }) => {
  // Construct proper file URL - msg.fileUrl is already a path like /uploads/...
  const fileUrl = msg.fileUrl?.startsWith('http') 
    ? msg.fileUrl 
    : `${BACKEND_URL}${msg.fileUrl?.startsWith('/') ? msg.fileUrl : '/' + msg.fileUrl}`;
  const isImage = msg.messageType === "image";
  const [imageSrc, setImageSrc] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);

  // Load image as blob to avoid mixed content issues
  useEffect(() => {
    if (isImage) {
      const loadImage = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(fileUrl, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setImageSrc(url);
          }
        } catch (error) {
          console.error('Error loading image:', error);
        } finally {
          setImageLoading(false);
        }
      };
      loadImage();
      
      // Cleanup
      return () => {
        if (imageSrc) {
          URL.revokeObjectURL(imageSrc);
        }
      };
    }
  }, [fileUrl, isImage]);

  const handleDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      // Fetch file with authentication
      const token = localStorage.getItem('token');
      const response = await fetch(fileUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = msg.fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  if (isImage) {
    return (
      <div className="space-y-1">
        {imageLoading ? (
          <div className="w-[240px] h-[200px] rounded-xl bg-muted animate-pulse flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        ) : imageSrc ? (
          <div className="relative group">
            <img
              src={imageSrc}
              alt={msg.fileName}
              className="max-w-[240px] max-h-[200px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => onLightbox(imageSrc)}
            />
            <button
              onClick={handleDownload}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Download image"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="p-4 border rounded-xl bg-muted text-center">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">{msg.fileName}</p>
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download Image
            </Button>
          </div>
        )}
        <p className={`text-xs ${isOwn ? "text-accent-foreground/70" : "text-muted-foreground"}`}>
          {msg.fileName}
        </p>
      </div>
    );
  }

  return (
    <a
      href="#"
      onClick={handleDownload}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors hover:opacity-80 ${
        isOwn ? "border-accent-foreground/20 bg-accent-foreground/10" : "border-border bg-muted"
      }`}
    >
      <FileText className="h-8 w-8 shrink-0 text-accent" />
      <div className="min-w-0">
        <p className={`text-sm font-medium truncate ${isOwn ? "text-accent-foreground" : "text-foreground"}`}>
          {msg.fileName}
        </p>
        <p className={`text-xs ${isOwn ? "text-accent-foreground/60" : "text-muted-foreground"}`}>
          {formatBytes(msg.fileSize)}
        </p>
      </div>
      <Download className="h-4 w-4 shrink-0" />
    </a>
  );
};

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const socketContext = useSocket();
  const { socket, isConnected, isUserOnline } = socketContext || {};

  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null); // { src, file } - pending send
  const [lightboxSrc, setLightboxSrc] = useState(null);  // full-size view of sent images

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const userType = user?.role === "CLIENT" ? "client" : "freelancer";

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchConversations().then((convs) => {
        const otherUserId = searchParams.get("userId");
        if (!otherUserId && convs.length > 0) selectConversation(convs[0]);
      });
    }
  }, [user]);

  // Handle ?userId= param
  useEffect(() => {
    const otherUserId = searchParams.get("userId");
    const contractId = searchParams.get("contractId");
    if (otherUserId && user) {
      getOrCreateConversation(otherUserId, contractId)
        .then(res => {
          if (res.success) {
            fetchConversations().then((convs) => {
              const full = convs.find(c => c.id === res.conversation.id);
              if (full) selectConversation(full);
            });
          }
        })
        .catch(() => {});
    }
  }, [searchParams, user]);

  // Socket events
  useEffect(() => {
    if (!socket) return;

    socket.on("message:new", (message) => {
      if (message.conversationId === selectedConv?.id) {
        setMessages(prev => [...prev, message]);
        socket.emit("messages:read", { conversationId: message.conversationId });
      }
      setConversations(prev => prev.map(c =>
        c.id === message.conversationId
          ? { ...c, lastMessage: { content: message.content, type: message.messageType }, lastMessageAt: message.createdAt, unreadCount: c.id === selectedConv?.id ? 0 : (c.unreadCount || 0) + 1 }
          : c
      ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)));
    });

    socket.on("message:deleted", ({ messageId }) => {
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, isDeleted: true, content: "This message was deleted" } : m
      ));
    });

    socket.on("typing:start", ({ userId: uid }) => {
      setTypingUsers(prev => new Set([...prev, uid]));
    });

    socket.on("typing:stop", ({ userId: uid }) => {
      setTypingUsers(prev => { const n = new Set(prev); n.delete(uid); return n; });
    });

    socket.on("messages:read", ({ conversationId }) => {
      if (conversationId === selectedConv?.id) {
        setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
      }
    });

    return () => {
      socket.off("message:new");
      socket.off("message:deleted");
      socket.off("typing:start");
      socket.off("typing:stop");
      socket.off("messages:read");
    };
  }, [socket, selectedConv]);

  useEffect(() => {
    if (!socket || !selectedConv) return;
    socket.emit("conversation:join", selectedConv.id);
    return () => socket.emit("conversation:leave", selectedConv.id);
  }, [socket, selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await getConversations();
      const convs = res.conversations || [];
      setConversations(convs);
      return convs;
    } catch { return []; } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conv) => {
    setSelectedConv(conv);
    setSearchResults(null);
    setMsgLoading(true);
    try {
      const res = await getChatMessages(conv.id);
      setMessages(res.messages || []);
      if (conv.unreadCount > 0) {
        await markConversationAsRead(conv.id);
        setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
        socket?.emit("messages:read", { conversationId: conv.id });
      }
    } catch {} finally {
      setMsgLoading(false);
    }
    inputRef.current?.focus();
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConv) return;
    if (!socket || !isConnected) {
      alert("Not connected. Please refresh.");
      return;
    }
    socket.emit("message:send", { conversationId: selectedConv.id, content: messageText.trim() }, (res) => {
      if (res?.error) console.error("Send error:", res.error);
    });
    setMessageText("");
    socket.emit("typing:stop", { conversationId: selectedConv.id });
  };

  const handleTyping = (e) => {
    setMessageText(e.target.value);
    if (!socket || !selectedConv) return;
    socket.emit("typing:start", { conversationId: selectedConv.id });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", { conversationId: selectedConv.id });
    }, 1500);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConv || !socket || !isConnected) return;

    // Show image preview before upload
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview({ src: ev.target.result, file });
      reader.readAsDataURL(file);
      return;
    }

    await sendFile(file);
    e.target.value = "";
  };

  const sendFile = async (file) => {
    setUploading(true);
    try {
      const res = await uploadChatFile(file);
      if (!res.success) throw new Error(res.error);

      const messageType = res.file.isImage ? "image" : "file";
      socket.emit("message:send", {
        conversationId: selectedConv.id,
        content: res.file.name,
        messageType,
        fileData: { url: res.file.url, name: res.file.name, size: res.file.size }
      }, (r) => {
        if (r?.error) console.error("File send error:", r.error);
      });
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteMessage = (messageId) => {
    if (!socket || !selectedConv) return;
    socket.emit("message:delete", { messageId, conversationId: selectedConv.id });
  };

  const filteredConversations = conversations.filter(c =>
    c.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.projectTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
    </div>
  );
  if (!user) return null;

  const otherUser = selectedConv?.otherUser;
  const isOtherOnline = otherUser ? isUserOnline(otherUser.id) : false;
  const isTyping = typingUsers.size > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar userType={userType} />

      <div className="flex-1 container mx-auto px-4 py-4">
        <div className="flex h-[calc(100vh-120px)] rounded-2xl border border-border bg-card overflow-hidden shadow-lg">

          {/* Sidebar */}
          <div className="w-80 flex flex-col border-r border-border shrink-0">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-xl font-bold text-foreground">Messages</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isConnected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {isConnected ? "● Live" : "● Offline"}
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-xl bg-secondary border-border text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
                  <MessageSquare className="h-8 w-8" />
                  <p className="text-sm">No conversations yet</p>
                </div>
              ) : (
                filteredConversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`w-full flex items-center gap-3 p-4 border-b border-border transition-colors hover:bg-secondary text-left ${selectedConv?.id === conv.id ? "bg-secondary" : ""}`}
                  >
                    <div className="relative">
                      <Avatar name={conv.otherUser?.name} size="h-11 w-11" />
                      {isUserOnline(conv.otherUser?.id) && (
                        <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-green-500 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground text-sm truncate">{conv.otherUser?.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0 ml-1">{formatTime(conv.lastMessageAt)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.lastMessage?.type === "image" ? "📷 Image" :
                           conv.lastMessage?.type === "file" ? "📎 File" :
                           conv.lastMessage?.content || conv.projectTitle || "No messages yet"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="ml-1 shrink-0 h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          {selectedConv ? (
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar name={otherUser?.name} size="h-9 w-9" />
                    {isOtherOnline && (
                      <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-green-500 text-green-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{otherUser?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {isTyping ? "typing..." : isOtherOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
                {searchResults !== null && (
                  <Button variant="ghost" size="icon" onClick={() => setSearchResults(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
                  </div>
                ) : (searchResults || messages).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                    <MessageSquare className="h-10 w-10" />
                    <p className="text-sm">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  (searchResults || messages).map(msg => {
                    const isOwn = msg.senderId === user.id;
                    const isFile = msg.messageType === "file" || msg.messageType === "image";
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}>
                        {!isOwn && <Avatar name={msg.senderName} size="h-7 w-7 mr-2 mt-1" />}
                        <div className="relative max-w-[70%]">
                          {msg.isDeleted ? (
                            <div className="rounded-2xl px-4 py-2 text-sm bg-muted text-muted-foreground italic">
                              This message was deleted
                            </div>
                          ) : isFile ? (
                            <div className={`rounded-2xl px-3 py-2 ${isOwn ? "bg-accent text-accent-foreground" : "bg-secondary"}`}>
                              <FileMessage msg={msg} isOwn={isOwn} onLightbox={setLightboxSrc} />
                              <span className={`block text-xs mt-1 ${isOwn ? "text-accent-foreground/60" : "text-muted-foreground"}`}>
                                {formatTime(msg.createdAt)}{isOwn && msg.isRead && " ✓✓"}
                              </span>
                            </div>
                          ) : (
                            <div className={`rounded-2xl px-4 py-2 text-sm ${isOwn ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground"}`}>
                              {msg.content}
                              <span className={`block text-xs mt-1 ${isOwn ? "text-accent-foreground/60" : "text-muted-foreground"}`}>
                                {formatTime(msg.createdAt)}{isOwn && msg.isRead && " ✓✓"}
                              </span>
                            </div>
                          )}
                          {isOwn && !msg.isDeleted && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="absolute -top-2 -right-2 hidden group-hover:flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border shadow-sm text-muted-foreground hover:text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                {isTyping && (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <div className="flex gap-1">
                      <span className="animate-bounce">●</span>
                      <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>●</span>
                      <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
                    </div>
                    {otherUser?.name} is typing...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Image preview before send */}
              {imagePreview && (
                <div className="px-4 py-2 border-t border-border bg-secondary flex items-center gap-3">
                  <img src={imagePreview.src} alt="preview" className="h-16 w-16 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{imagePreview.file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(imagePreview.file.size)}</p>
                  </div>
                  <Button variant="accent" size="sm" disabled={uploading} onClick={() => sendFile(imagePreview.file)}>
                    {uploading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : "Send"}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-border">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                    onChange={handleFileSelect}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach file"
                  >
                    {uploading
                      ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent" />
                      : <Paperclip className="h-4 w-4" />
                    }
                  </Button>
                  <Input
                    ref={inputRef}
                    value={messageText}
                    onChange={handleTyping}
                    placeholder="Type a message..."
                    className="flex-1 rounded-xl bg-secondary border-border"
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) handleSend(e); }}
                  />
                  <Button type="submit" variant="accent" size="icon" disabled={!messageText.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <MessageSquare className="h-16 w-16" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose from your existing conversations or start a new one</p>
            </div>
          )}
        </div>
      </div>

      {/* Full-size image lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img 
              src={lightboxSrc} 
              alt="preview" 
              className="max-w-full max-h-[90vh] rounded-2xl object-contain" 
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                className="text-white bg-black/50 rounded-full p-2 hover:bg-black/80 transition-colors"
                onClick={async () => {
                  try {
                    const response = await fetch(lightboxSrc);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'image';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Download error:', error);
                  }
                }}
                title="Download"
              >
                <Download className="h-5 w-5" />
              </button>
              <button
                className="text-white bg-black/50 rounded-full p-2 hover:bg-black/80 transition-colors"
                onClick={() => setLightboxSrc(null)}
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
