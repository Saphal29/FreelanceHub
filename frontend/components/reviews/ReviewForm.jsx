"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import StarRating from "./StarRating";
import { Star, AlertCircle, CheckCircle } from "lucide-react";
import { submitReview } from "@/lib/api";

export default function ReviewForm({ contractId, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    overallRating: 0,
    communicationRating: 0,
    qualityRating: 0,
    timelinessRating: 0,
    professionalismRating: 0,
    feedback: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.overallRating === 0) {
      setError("Please provide an overall rating");
      return;
    }
    
    if (!formData.feedback.trim()) {
      setError("Please provide written feedback");
      return;
    }
    
    try {
      setSubmitting(true);
      setError("");
      
      const response = await submitReview({
        contractId,
        ...formData
      });
      
      if (response.success) {
        setSuccess("Review submitted successfully!");
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1500);
      } else {
        setError(response.error || "Failed to submit review");
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      setError(err.response?.data?.error || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-400" />
          Submit Your Review
        </CardTitle>
      </CardHeader>
      <CardContent>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Overall Rating *
            </label>
            <StarRating
              rating={formData.overallRating}
              size="xl"
              interactive
              onChange={(rating) => setFormData({ ...formData, overallRating: rating })}
            />
          </div>

          {/* Category Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Communication
              </label>
              <StarRating
                rating={formData.communicationRating}
                size="lg"
                interactive
                onChange={(rating) => setFormData({ ...formData, communicationRating: rating })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Quality of Work
              </label>
              <StarRating
                rating={formData.qualityRating}
                size="lg"
                interactive
                onChange={(rating) => setFormData({ ...formData, qualityRating: rating })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Timeliness
              </label>
              <StarRating
                rating={formData.timelinessRating}
                size="lg"
                interactive
                onChange={(rating) => setFormData({ ...formData, timelinessRating: rating })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Professionalism
              </label>
              <StarRating
                rating={formData.professionalismRating}
                size="lg"
                interactive
                onChange={(rating) => setFormData({ ...formData, professionalismRating: rating })}
              />
            </div>
          </div>

          {/* Written Feedback */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Written Feedback *
            </label>
            <textarea
              value={formData.feedback}
              onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-xl bg-background min-h-[120px]"
              placeholder="Share your experience working on this project..."
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Your honest feedback helps build trust in the community
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
