"use client";

import { useState, useEffect, useRef } from "react";
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

const Avatar = ({ name }) => (
  <div className="w-8 h-8 bg-[var(--ink)] text-[var(--paper)] font-bold text-[12px] flex items-center justify-center shrink-0">
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
      <div className="space-y-1 font-mono-ledger">
        {imageLoading ? (
          <div className="w-[240px] h-[160px] bg-[var(--paper-2)] border border-[var(--line)] flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-[var(--muted)]" />
          </div>
        ) : imageSrc ? (
          <div className="relative group">
            <img
              src={imageSrc}
              alt={msg.fileName}
              className="max-w-[240px] max-h-[180px] border border-[var(--ink)] object-cover cursor-pointer"
              onClick={() => onLightbox(imageSrc)}
            />
            <button
              onClick={handleDownload}
              className="absolute top-2 right-2 bg-[var(--ink)] text-[var(--paper)] p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Download image"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="p-3 border border-[var(--line)] bg-[var(--paper-2)] text-center">
            <ImageIcon className="h-8 w-8 mx-auto mb-2 text-[var(--muted)]" />
            <p className="text-[11px] text-[var(--muted)] mb-2">{msg.fileName}</p>
            <button 
              onClick={handleDownload}
              className="px-3 py-1 bg-[var(--ink)] text-[var(--paper)] text-[10px] font-bold uppercase"
            >
              Download image
            </button>
          </div>
        )}
        <p className="text-[10px] text-[var(--muted)]">
          {msg.fileName}
        </p>
      </div>
    );
  }

  return (
    <a
      href="#"
      onClick={handleDownload}
      className={`flex items-center gap-3 p-3 border font-mono-ledger text-[11px] ${
        isOwn ? "border-[var(--ink)] bg-[var(--paper-2)]" : "border-[var(--line)] bg-[var(--paper)]"
      }`}
    >
      <FileText className="h-6 w-6 shrink-0 text-[var(--ink)]" />
      <div className="min-w-0 flex-1">
        <p className="font-bold truncate text-[var(--ink)]">
          {msg.fileName}
        </p>
        <p className="text-[10px] text-[var(--muted)]">
          {formatBytes(msg.fileSize)}
        </p>
      </div>
      <Download className="h-4 w-4 shrink-0 text-[var(--ink)]" />
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
          const exists = prev.find(m => m.id === message.id);
          if (exists) return prev;
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
      <div className="py-8 text-center font-mono-ledger text-[12px] text-[var(--muted)]">
        LOADING MEDIATION THREAD...
      </div>
    );
  }

  return (
    <div className="border border-[var(--ink)] bg-[var(--paper)] p-5 space-y-4 font-mono-ledger text-[12px] text-left">
      
      {/* Header */}
      <div className="border-b border-[var(--ink)] pb-3 flex items-center justify-between">
        <span className="font-bold text-[var(--ink)] uppercase tracking-wider text-[11px]">
          Mediation Thread & Case Dispatch
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 border ${
          isConnected ? "border-green-600 text-green-700 bg-green-50" : "border-[var(--signal)] text-[var(--signal-dark)] bg-red-50"
        }`}>
          [{isConnected ? "LIVE" : "OFFLINE"}]
        </span>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Messages List */}
      <div className="space-y-3 max-h-[420px] overflow-y-auto p-4 border border-[var(--line)] bg-[var(--paper-2)]">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-[var(--muted)] space-y-1">
            <span className="font-bold uppercase block text-[11px]">No messages on ledger</span>
            <span className="text-[10px]">Start discussion by posting a statement below</span>
          </div>
        ) : (
          <>
            {messages.map(msg => {
              const isOwn = msg.senderId === user?.id;
              const isFile = msg.messageType === "file" || msg.messageType === "image";
              return (
                <div key={msg.id} className={`flex gap-3 ${isOwn ? "justify-end" : "justify-start"}`}>
                  {!isOwn && <Avatar name={msg.senderName} />}
                  <div className="max-w-[75%] space-y-1">
                    <div className="flex items-center space-x-2 text-[10px] text-[var(--muted)]">
                      <span className="font-bold text-[var(--ink)]">{msg.senderName}</span>
                      <span>·</span>
                      <span>{formatTime(msg.createdAt)}</span>
                    </div>

                    {msg.isDeleted ? (
                      <div className="p-3 border border-[var(--line)] bg-[var(--paper)] text-[var(--muted)] italic text-[11px]">
                        This message was deleted
                      </div>
                    ) : isFile ? (
                      <div className="border border-[var(--ink)] bg-[var(--paper)] p-3">
                        <FileMessage msg={msg} isOwn={isOwn} onLightbox={setLightboxSrc} />
                      </div>
                    ) : (
                      <div className={`p-3 border text-[13px] font-sans-ledger leading-relaxed ${
                        isOwn ? "border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)] font-medium" : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]"
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="text-[10px] text-[var(--muted)] italic">
                Participant is typing message...
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Image preview before send */}
      {imagePreview && (
        <div className="p-3 border border-[var(--ink)] bg-[var(--paper-2)] flex items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center space-x-3">
            <img src={imagePreview.src} alt="preview" className="h-12 w-12 border border-[var(--ink)] object-cover" />
            <div>
              <p className="font-bold truncate text-[var(--ink)]">{imagePreview.file.name}</p>
              <p className="text-[10px] text-[var(--muted)]">{formatBytes(imagePreview.file.size)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => sendFile(imagePreview.file)}
              disabled={uploading}
              className="bg-[var(--signal)] text-[var(--paper)] font-bold px-4 py-2 uppercase"
            >
              {uploading ? "Uploading..." : "Send →"}
            </button>
            <button
              onClick={() => setImagePreview(null)}
              className="text-[var(--ink)] hover:text-[var(--signal)] font-bold p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Message Input Form */}
      <form onSubmit={handleSend} className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
          onChange={handleFileSelect}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="border border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--paper-2)] p-2.5 transition-colors shrink-0"
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <input
          value={newMessage}
          onChange={handleTyping}
          placeholder="Type message or mediation response..."
          className="flex-1 bg-[var(--paper)] border border-[var(--line)] p-2.5 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--ink)] font-sans-ledger"
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) handleSend(e); }}
        />

        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold px-5 py-2.5 uppercase transition-colors shrink-0 disabled:opacity-50"
        >
          Send →
        </button>
      </form>

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 bg-[var(--ink)]/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img 
              src={lightboxSrc} 
              alt="preview" 
              className="max-w-full max-h-[90vh] border-2 border-[var(--paper)] object-contain" 
            />
            <button
              className="absolute top-3 right-3 text-[var(--paper)] bg-[var(--ink)] p-2 hover:bg-[var(--signal)] transition-colors"
              onClick={() => setLightboxSrc(null)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
