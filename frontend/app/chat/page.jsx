"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import {
  getConversations, 
  getChatMessages, 
  getOrCreateConversation,
  markConversationAsRead, 
  deleteChatMessage, 
  uploadChatFile
} from "@/lib/api";
import {
  Send, 
  Search, 
  Trash2, 
  Circle, 
  MessageSquare, 
  X,
  Paperclip, 
  Download, 
  FileText, 
  Image as ImageIcon,
  ArrowLeft
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
      return () => { if (imageSrc) URL.revokeObjectURL(imageSrc); };
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
    }
  };

  if (isImage) {
    return (
      <div className="space-y-1 text-left font-mono-ledger">
        {imageLoading ? (
          <div className="w-[200px] h-[160px] bg-[var(--paper-2)] border border-[var(--ink)] animate-pulse flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-[var(--muted)]" />
          </div>
        ) : imageSrc ? (
          <div className="relative group">
            <img
              src={imageSrc}
              alt={msg.fileName}
              className="max-w-[240px] max-h-[180px] border-2 border-[var(--ink)] object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => onLightbox(imageSrc)}
            />
            <button
              onClick={handleDownload}
              className="absolute top-2 right-2 bg-[var(--ink)] text-[var(--paper)] p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Download image"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="p-3 border border-[var(--ink)] bg-[var(--paper-2)] text-center text-[11px]">
            <p className="text-[var(--ink)] mb-1 font-bold">{msg.fileName}</p>
            <button onClick={handleDownload} className="text-[var(--signal)] underline font-bold">
              DOWNLOAD SPECIMEN
            </button>
          </div>
        )}
        <p className="text-[10px] text-[var(--muted)]">{msg.fileName}</p>
      </div>
    );
  }

  return (
    <a
      href="#"
      onClick={handleDownload}
      className={`flex items-center gap-3 p-3 border border-[var(--ink)] transition-colors hover:bg-[var(--signal)]/10 font-mono-ledger ${
        isOwn ? "bg-[var(--paper-2)] text-[var(--ink)]" : "bg-[var(--paper)] text-[var(--ink)]"
      }`}
    >
      <FileText className="h-6 w-6 text-[var(--signal)] shrink-0" />
      <div className="min-w-0 flex-1 text-left">
        <p className="text-[12px] font-bold truncate">{msg.fileName}</p>
        <p className="text-[10px] text-[var(--muted)]">{formatBytes(msg.fileSize)}</p>
      </div>
      <Download className="h-4 w-4 shrink-0 text-[var(--ink)]" />
    </a>
  );
};

function ChatContent() {
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
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);

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

  // Socket listeners
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
      
      const uniqueConvs = [];
      const seenUsers = new Set();
      const sortedConvs = [...convs].sort((a, b) => {
        const timeA = a.last_message_at || a.created_at;
        const timeB = b.last_message_at || b.created_at;
        return new Date(timeB) - new Date(timeA);
      });
      
      for (const conv of sortedConvs) {
        const otherUserId = conv.other_user?.id || conv.other_user_id;
        if (!seenUsers.has(otherUserId)) {
          seenUsers.add(otherUserId);
          uniqueConvs.push(conv);
        }
      }
      
      setConversations(uniqueConvs);
      return uniqueConvs;
    } catch { return []; } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conv) => {
    setSelectedConv(conv);
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
      alert("Not connected. Please refresh connection.");
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
    <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center font-mono-ledger">
      <p className="text-[12px] text-[var(--muted)] uppercase">LOADING MESSAGING DISPATCH...</p>
    </div>
  );
  if (!user) return null;

  const otherUser = selectedConv?.otherUser;
  const isOtherOnline = otherUser ? isUserOnline(otherUser.id) : false;
  const isTyping = typingUsers.size > 0;

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar userType={userType} />

      {/* Main Messaging Canvas */}
      <main data-tour="chat-panel" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 flex-1 w-full flex flex-col space-y-6">
        
        {/* EDITORIAL HEADER */}
        <section className="space-y-2 text-left border-b border-[var(--ink)] pb-4">
          <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full inline-block ${isConnected ? 'bg-green-600 animate-pulse' : 'bg-[var(--signal)]'}`}></span>
            <span>FREELANCEHUB DISPATCH · REALTIME MESSAGING CONSOLE [{isConnected ? 'ONLINE' : 'CONNECTING'}]</span>
          </p>
          <h1 className="font-serif-ledger text-[28px] sm:text-[34px] font-medium text-[var(--ink)]">
            Deliverable & Operations Chat.
          </h1>
        </section>

        {/* WORKSPACE DISPATCH CONSOLE */}
        <div className="flex-1 flex flex-col lg:flex-row border-2 border-[var(--ink)] bg-[var(--paper)] min-h-[600px] shadow-xs text-left">

          {/* LEFT CONVERSATION SIDEBAR */}
          <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r-2 border-[var(--ink)] flex flex-col bg-[var(--paper-2)]">
            
            {/* Search Bar */}
            <div className="p-3 border-b border-[var(--ink)] font-mono-ledger">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted)]" />
                <input
                  type="text"
                  placeholder="Search dispatches..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--paper)] border border-[var(--ink)] py-2 pl-9 pr-3 text-[12px] text-[var(--ink)] focus:outline-none"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[var(--line)] font-mono-ledger">
              {loading ? (
                <div className="p-6 text-center text-[11px] text-[var(--muted)]">
                  LOADING DISPATCH LOGS...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-[11px] text-[var(--muted)]">
                  NO ACTIVE DISPATCHES FOUND
                </div>
              ) : (
                filteredConversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`w-full p-3.5 text-left transition-colors flex items-start space-x-3 ${
                      selectedConv?.id === conv.id 
                        ? "bg-[var(--paper)] border-l-4 border-l-[var(--signal)]" 
                        : "hover:bg-[var(--paper)]"
                    }`}
                  >
                    <div className="w-9 h-9 bg-[var(--ink)] text-[var(--paper)] font-bold text-[13px] flex items-center justify-center shrink-0">
                      {conv.otherUser?.name?.charAt(0) || 'U'}
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5 text-[11px]">
                      <div className="flex items-center justify-between font-bold">
                        <span className="truncate text-[var(--ink)]">{conv.otherUser?.name}</span>
                        <span className="text-[9px] text-[var(--muted)] font-normal">{formatTime(conv.lastMessageAt)}</span>
                      </div>
                      <p className="text-[10px] text-[var(--muted)] truncate">
                        {conv.lastMessage?.content || "No messages on record"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>

          </div>


          {/* RIGHT CHAT STREAM */}
          {selectedConv ? (
            <div className="flex-1 flex flex-col min-w-0 bg-[var(--paper)] font-mono-ledger">
              
              {/* Active Conversation Header */}
              <div className="p-4 border-b border-[var(--ink)] flex items-center justify-between bg-[var(--paper-2)]">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[var(--signal)] text-[var(--paper)] font-bold text-[12px] flex items-center justify-center">
                    {otherUser?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="font-bold text-[13px] text-[var(--ink)]">{otherUser?.name}</h3>
                    <p className="text-[10px] text-[var(--muted)] uppercase">
                      {isTyping ? "TYPING MESSAGE..." : isOtherOnline ? "ONLINE NOW" : "OFFLINE"}
                    </p>
                  </div>
                </div>

                <div className="text-[10px] text-[var(--signal)] font-bold uppercase">
                  DISPATCH ID / #{selectedConv.id?.slice(0, 8)}
                </div>
              </div>

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono-ledger text-[12px]">
                {msgLoading ? (
                  <div className="p-6 text-center text-[var(--muted)]">SYNCHRONIZING MESSAGES...</div>
                ) : messages.length === 0 ? (
                  <div className="p-12 text-center space-y-2">
                    <p className="font-serif-ledger text-[20px] text-[var(--ink)]">Start your operational dispatch.</p>
                    <p className="text-[11px] text-[var(--muted)]">Send messages, request scope updates, or share deliverable specs.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.senderId === user.id;
                    const isFile = msg.messageType === "file" || msg.messageType === "image";

                    return (
                      <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}>
                        <div className={`max-w-[80%] space-y-1 ${isOwn ? "text-right" : "text-left"}`}>
                          
                          <div className={`p-3.5 border-2 border-[var(--ink)] ${
                            isOwn 
                              ? "bg-[var(--ink)] text-[var(--paper)] font-sans-ledger" 
                              : "bg-[var(--paper-2)] text-[var(--ink)] font-sans-ledger"
                          }`}>
                            {msg.isDeleted ? (
                              <span className="italic text-[var(--muted)]">[THIS MESSAGE WAS DELETED]</span>
                            ) : isFile ? (
                              <FileMessage msg={msg} isOwn={isOwn} onLightbox={setLightboxSrc} />
                            ) : (
                              <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 text-[9px] text-[var(--muted)] uppercase font-mono-ledger px-1 justify-end">
                            <span>{formatTime(msg.createdAt)}</span>
                            {isOwn && !msg.isDeleted && (
                              <button 
                                onClick={() => handleDeleteMessage(msg.id)} 
                                className="text-[var(--signal)] hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                DELETE
                              </button>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Attachment Preview Banner */}
              {imagePreview && (
                <div className="p-3 border-t border-[var(--ink)] bg-[var(--paper-2)] flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img src={imagePreview.src} alt="preview" className="w-12 h-12 object-cover border border-[var(--ink)]" />
                    <div>
                      <p className="font-bold text-[11px] text-[var(--ink)]">{imagePreview.file.name}</p>
                      <p className="text-[10px] text-[var(--muted)]">{formatBytes(imagePreview.file.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => sendFile(imagePreview.file)}
                      className="px-4 py-1.5 bg-[var(--signal)] text-[var(--paper)] font-bold text-[10px] uppercase"
                    >
                      SEND IMAGE
                    </button>
                    <button 
                      onClick={() => setImagePreview(null)}
                      className="px-3 py-1.5 border border-[var(--ink)] text-[10px] uppercase"
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              )}

              {/* Message Input Controls */}
              <div className="p-3 border-t border-[var(--ink)] bg-[var(--paper-2)]">
                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                    onChange={handleFileSelect}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="p-3 border-2 border-[var(--ink)] bg-[var(--paper)] hover:bg-[var(--signal)] hover:text-[var(--paper)] transition-colors"
                    title="Attach File / Deliverable Specimen"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>

                  <input
                    ref={inputRef}
                    type="text"
                    value={messageText}
                    onChange={handleTyping}
                    placeholder="Type operational dispatch message..."
                    className="flex-1 bg-[var(--paper)] border-2 border-[var(--ink)] p-3 text-[13px] text-[var(--ink)] focus:outline-none focus:border-[var(--signal)] font-sans-ledger"
                  />

                  <button
                    type="submit"
                    disabled={!messageText.trim()}
                    className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold px-6 py-3 uppercase transition-colors"
                  >
                    SEND →
                  </button>
                </form>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center font-mono-ledger text-[12px] text-[var(--muted)] space-y-2">
              <MessageSquare className="h-10 w-10 text-[var(--ink)]" />
              <p className="font-bold text-[var(--ink)] text-[14px]">SELECT A DISPATCH CONVERSATION</p>
              <p>Choose an active engagement from the left sidebar log to enter messaging mode.</p>
            </div>
          )}

        </div>

      </main>

      {/* Lightbox Modal */}
      {lightboxSrc && (
        <div className="fixed inset-0 bg-[var(--ink)]/80 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setLightboxSrc(null)}>
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxSrc} alt="preview" className="max-w-full max-h-[85vh] border-2 border-[var(--paper)] object-contain" />
            <button 
              onClick={() => setLightboxSrc(null)}
              className="absolute top-2 right-2 bg-[var(--paper)] text-[var(--ink)] font-bold px-3 py-1 text-[11px] font-mono-ledger"
            >
              CLOSE ×
            </button>
          </div>
        </div>
      )}

      {/* Editorial Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center mt-12 font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Operations & Messaging Console</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center font-mono-ledger">
        <p className="text-[12px] text-[var(--muted)] uppercase">LOADING MESSAGING DISPATCH...</p>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
