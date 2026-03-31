"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import {
  getOrCreateConversation,
  getChatMessages,
  markConversationAsRead,
  uploadChatFile
} from "@/lib/api";
import {
  AlertCircle,
  Send,
  MessageSquare,
  Shield,
  Paperclip,
  Download,
  FileText,
  Image as ImageIcon,
  X
} from "lucide-react";

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString();
};

const formatBytes = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const Avatar = ({ name, size = "h-7 w-7" }) => (
  <div className={`${size} rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-xs shrink-0`}>
    {name?.charAt(0)?.toUpperCase() || "?"}
  </div>
);

const FileMessage = ({ msg, isOwn, onLightbox }) => {
  const fileUrl = msg.fileUrl?.startsWith('http') 
    ? msg.fileUrl 
    : `${BACKEND_URL}${msg.fileUrl?.startsWith('/') ? msg.fileUrl : '/' + msg.fileUrl}`;
  const isImage = msg.messageType === "image";
  const [imageSrc, setImageSrc] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    if (isImage) {
      const loadImage = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(fileUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
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
      
      return () => {
        if (imageSrc) URL.revokeObjectURL(imageSrc);
      };
    }
  }, [fileUrl, isImage]);

  const handleDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(fileUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
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

export default function DisputeMessages({ disputeId, isMediator = false }) {
  const { user } = useAuth();
  const socketContext = useSocket();
  const { socket, isConnected } = socketContext || {};

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Set());

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (disputeId && user) {
      initializeConversation();
    }
  }, [disputeId, user]);

  useEffect(() => {
    if (!socket || !conversation) return;

    socket.on("message:new", (message) => {
      if (message.conversationId === conversation.id) {
        setMessages(prev => {
          // Avoid duplicates - check if message already exists
          const exists = prev.find(m => m.id === message.id);
          if (exists) {
            console.log('Duplicate message prevented:', message.id);
            return prev;
          }
          return [...prev, message];
        });
        socket.emit("messages:read", { conversationId: message.conversationId });
      }
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
      if (conversationId === conversation.id) {
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
  }, [socket, conversation]);

  useEffect(() => {
    if (!socket || !conversation) return;
    socket.emit("conversation:join", conversation.id);
    return () => socket.emit("conversation:leave", conversation.id);
  }, [socket, conversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initializeConversation = async () => {
    try {
      setLoading(true);
      setError("");
      
      const convRes = await getOrCreateConversation(null, null, null, disputeId);
      if (convRes.success) {
        setConversation(convRes.conversation);
        
        const msgRes = await getChatMessages(convRes.conversation.id);
        if (msgRes.success) {
          setMessages(msgRes.messages || []);
          await markConversationAsRead(convRes.conversation.id);
        }
      }
    } catch (err) {
      console.error("Error initializing conversation:", err);
      setError(err.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation) return;
    if (!socket || !isConnected) {
      alert("Not connected. Please refresh.");
      return;
    }
    socket.emit("message:send", { conversationId: conversation.id, content: newMessage.trim() }, (res) => {
      if (res?.error) console.error("Send error:", res.error);
    });
    setNewMessage("");
    socket.emit("typing:stop", { conversationId: conversation.id });
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!socket || !conversation) return;
    socket.emit("typing:start", { conversationId: conversation.id });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", { conversationId: conversation.id });
    }, 1500);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !conversation || !socket || !isConnected) return;

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
        conversationId: conversation.id,
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

  const isTyping = typingUsers.size > 0;

  if (loading) {
    return (
      <Card className="border-border">
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between font-display text-xl">
            <div className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-accent" />
              Discussion Thread
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isConnected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {isConnected ? "● Live" : "● Offline"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert className="border-2 border-red-200 bg-red-50">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-800 font-semibold">{error}</AlertDescription>
            </Alert>
          )}

          {/* Messages List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto p-4 bg-secondary/10 rounded-xl">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                  No messages yet
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Start the conversation by sending a message
                </p>
              </div>
            ) : (
              <>
                {messages.map(msg => {
                  const isOwn = msg.senderId === user?.id;
                  const isFile = msg.messageType === "file" || msg.messageType === "image";
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      {!isOwn && <Avatar name={msg.senderName} size="h-7 w-7 mr-2 mt-1" />}
                      <div className="max-w-[70%]">
                        {msg.isDeleted ? (
                          <div className="rounded-2xl px-4 py-2 text-sm bg-muted text-muted-foreground italic">
                            This message was deleted
                          </div>
                        ) : isFile ? (
                          <div className={`rounded-2xl px-3 py-2 ${isOwn ? "bg-accent text-accent-foreground" : "bg-white border border-border"}`}>
                            <FileMessage msg={msg} isOwn={isOwn} onLightbox={setLightboxSrc} />
                            <span className={`block text-xs mt-1 ${isOwn ? "text-accent-foreground/60" : "text-muted-foreground"}`}>
                              {formatTime(msg.createdAt)}{isOwn && msg.isRead && " ✓✓"}
                            </span>
                          </div>
                        ) : (
                          <div className={`rounded-2xl px-4 py-2 text-sm ${isOwn ? "bg-accent text-accent-foreground" : "bg-white text-foreground border border-border"}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold">
                                {msg.senderName}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            <span className={`block text-xs mt-1 ${isOwn ? "text-accent-foreground/60" : "text-muted-foreground"}`}>
                              {formatTime(msg.createdAt)}{isOwn && msg.isRead && " ✓✓"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {isTyping && (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <div className="flex gap-1">
                      <span className="animate-bounce">●</span>
                      <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>●</span>
                      <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
                    </div>
                    Someone is typing...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
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

          {/* Message Input */}
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
              value={newMessage}
              onChange={handleTyping}
              placeholder="Type a message..."
              className="flex-1 rounded-xl bg-background border-border"
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) handleSend(e); }}
            />
            <Button type="submit" variant="accent" size="icon" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

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
    </>
  );
}
