"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReviewCard from "@/components/reviews/ReviewCard";
import { Star, AlertCircle, Loader2 } from "lucide-react";
import { getReceivedReviews, getGivenReviews } from "@/lib/api";

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState("received");
  const [receivedReviews, setReceivedReviews] = useState([]);
  const [givenReviews, setGivenReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError("");

      const [receivedData, givenData] = await Promise.all([
        getReceivedReviews(),
        getGivenReviews()
      ]);

      if (receivedData.success) {
        setReceivedReviews(receivedData.reviews || []);
      }

      if (givenData.success) {
        setGivenReviews(givenData.reviews || []);
      }
    } catch (err) {
      console.error("Error loading reviews:", err);
      setError("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Star className="h-8 w-8 text-yellow-400" />
          Reviews & Ratings
        </h1>
        <p className="text-muted-foreground">
          View reviews you've received and given
        </p>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="received">
            Received ({receivedReviews.length})
          </TabsTrigger>
          <TabsTrigger value="given">
            Given ({givenReviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="mt-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : receivedReviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No reviews received yet
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Complete projects to receive reviews from clients
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {receivedReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  canRespond={!review.response}
                  onUpdate={loadReviews}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="given" className="mt-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : givenReviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No reviews given yet
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Complete projects to leave reviews
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {givenReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  canRespond={false}
                  onUpdate={loadReviews}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
