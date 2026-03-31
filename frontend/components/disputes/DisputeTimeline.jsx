"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getDisputeTimeline } from "@/lib/api";
import {
  AlertCircle,
  FileText,
  MessageSquare,
  Paperclip,
  Shield,
  CheckCircle,
  Clock,
  User,
} from "lucide-react";

const ACTION_ICONS = {
  filed: FileText,
  status_changed: Clock,
  evidence_added: Paperclip,
  message_sent: MessageSquare,
  mediator_assigned: Shield,
  resolved: CheckCircle,
};

export default function DisputeTimeline({ disputeId }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (disputeId) {
      fetchTimeline();
    }
  }, [disputeId]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await getDisputeTimeline(disputeId);
      
      if (response.success) {
        setTimeline(response.timeline || []);
      } else {
        setError(response.error || "Failed to load timeline");
      }
    } catch (err) {
      console.error("Error fetching timeline:", err);
      setError(err.message || "Failed to load timeline");
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    const Icon = ACTION_ICONS[action] || User;
    return Icon;
  };

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

  if (error) {
    return (
      <Alert className="border-2 border-red-200 bg-red-50">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <AlertDescription className="text-red-800 font-semibold">{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-border">
      <CardContent className="p-6">
        {timeline.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
              No timeline entries
            </h3>
            <p className="mt-2 text-muted-foreground">
              Timeline events will appear here as the dispute progresses
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
            
            {/* Timeline entries */}
            <div className="space-y-6">
              {timeline.map((entry, index) => {
                const Icon = getActionIcon(entry.action);
                
                return (
                  <div key={entry.id} className="relative flex gap-4">
                    {/* Icon */}
                    <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-accent/10 border-2 border-accent">
                      <Icon className="h-4 w-4 text-accent" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 pb-6">
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-semibold text-foreground">{entry.description}</p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                          {new Date(entry.createdAt).toLocaleString()}
                        </span>
                      </div>
                      
                      {entry.userName && (
                        <p className="text-sm text-muted-foreground">
                          By {entry.userName}
                        </p>
                      )}
                      
                      {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                        <div className="mt-2 p-2 rounded-lg bg-secondary/30 text-xs">
                          {Object.entries(entry.metadata).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="text-muted-foreground capitalize">
                                {key.replace(/_/g, " ")}:
                              </span>
                              <span className="text-foreground">
                                {typeof value === "object" ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
