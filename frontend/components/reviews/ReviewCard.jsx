"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import StarRating from "./StarRating";
import { User, Calendar, MessageSquare, Flag, CheckCircle, AlertCircle } from "lucide-react";
import { respondToReview, flagReview } from "@/lib/api";

export default function ReviewCard({ review, canRespond = false, onUpdate }) {
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [flagReason, setFlagReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRespond = async (e) => {
    e.preventDefault();
    
    if (!responseText.trim()) {
      setError("Please enter a response");
      return;
    }
    
    try {
      setSubmitting(true);
      setError("");
      
      const result = await respondToReview(review.id, responseText);
      
      if (result.success) {
        setSuccess("Response submitted successfully");
        setShowResponseForm(false);
        if (onUpdate) onUpdate();
      } else {
        setError(result.error || "Failed to submit response");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit response");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFlag = async (e) => {
    e.preventDefault();
    
    if (!flagReason.trim()) {
      setError("Please provide a reason for flagging");
      return;
    }
    
    try {
      setSubmitting(true);
      setError("");
      
      const result = await flagReview(review.id, flagReason);
      
      if (result.success) {
        setSuccess("Review flagged for moderation");
        setShowFlagForm(false);
      } else {
        setError(result.error || "Failed to flag review");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to flag review");
    } finally {
      setSubmitting(false);
    }
  };

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${baseUrl}${avatarPath}`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Reviewer Info */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden">
              {review.reviewerAvatar ? (
                <img 
                  src={getAvatarUrl(review.reviewerAvatar)} 
                  alt={review.reviewerName} 
                  className="w-12 h-12 rounded-full object-cover" 
                />
              ) : (
                <User className="h-6 w-6 text-accent" />
              )}
            </div>
            <div>
              <p className="font-semibold">{review.reviewerName}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(review.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowFlagForm(!showFlagForm)}
            title="Flag as inappropriate"
          >
            <Flag className="h-4 w-4" />
          </Button>
        </div>

        {/* Overall Rating */}
        <div className="mb-4">
          <StarRating rating={review.overallRating} size="lg" showNumber />
        </div>

        {/* Category Ratings */}
        {(review.communicationRating || review.qualityRating || review.timelinessRating || review.professionalismRating) && (
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            {review.communicationRating && (
              <div>
                <p className="text-muted-foreground mb-1">Communication</p>
                <StarRating rating={review.communicationRating} size="sm" />
              </div>
            )}
            {review.qualityRating && (
              <div>
                <p className="text-muted-foreground mb-1">Quality</p>
                <StarRating rating={review.qualityRating} size="sm" />
              </div>
            )}
            {review.timelinessRating && (
              <div>
                <p className="text-muted-foreground mb-1">Timeliness</p>
                <StarRating rating={review.timelinessRating} size="sm" />
              </div>
            )}
            {review.professionalismRating && (
              <div>
                <p className="text-muted-foreground mb-1">Professionalism</p>
                <StarRating rating={review.professionalismRating} size="sm" />
              </div>
            )}
          </div>
        )}

        {/* Feedback */}
        <p className="text-foreground mb-4 whitespace-pre-wrap">{review.feedback}</p>

        {/* Project Info */}
        {review.projectTitle && (
          <p className="text-sm text-muted-foreground mb-4">
            Project: <span className="font-medium">{review.projectTitle}</span>
          </p>
        )}

        {/* Response */}
        {review.response && (
          <div className="mt-4 p-4 bg-accent/5 rounded-lg border border-accent/20">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-accent" />
              <p className="text-sm font-semibold">Response from {review.revieweeName}</p>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">{review.response}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(review.responseAt).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Response Form */}
        {canRespond && !review.response && !showResponseForm && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowResponseForm(true)}
            className="mt-4"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Respond to Review
          </Button>
        )}

        {showResponseForm && (
          <form onSubmit={handleRespond} className="mt-4 space-y-3">
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xl bg-background min-h-[80px]"
              placeholder="Write your response..."
              required
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Response"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowResponseForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Flag Form */}
        {showFlagForm && (
          <form onSubmit={handleFlag} className="mt-4 space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm font-medium text-red-800">Flag this review</p>
            <textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xl bg-background min-h-[60px]"
              placeholder="Reason for flagging..."
              required
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={submitting} variant="destructive">
                {submitting ? "Flagging..." : "Flag Review"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowFlagForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
