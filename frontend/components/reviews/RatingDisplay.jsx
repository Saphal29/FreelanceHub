"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StarRating from "./StarRating";
import { Star, TrendingUp } from "lucide-react";
import { getUserRatingStats } from "@/lib/api";

export default function RatingDisplay({ userId, showDetails = true }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await getUserRatingStats(userId);
      
      if (response.success) {
        setStats(response.stats);
      }
    } catch (err) {
      console.error("Error loading rating stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-accent/20 rounded w-32 mb-2"></div>
        <div className="h-4 bg-accent/20 rounded w-24"></div>
      </div>
    );
  }

  if (!stats || stats.totalReviews === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No reviews yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Rating */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <StarRating rating={stats.averageRating} size="lg" showNumber />
          <span className="text-sm text-muted-foreground">
            ({stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'})
          </span>
        </div>
      </div>

      {showDetails && (
        <>
          {/* Category Ratings */}
          {(stats.avgCommunication > 0 || stats.avgQuality > 0 || stats.avgTimeliness > 0 || stats.avgProfessionalism > 0) && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              {stats.avgCommunication > 0 && (
                <div>
                  <p className="text-muted-foreground mb-1">Communication</p>
                  <StarRating rating={stats.avgCommunication} size="sm" showNumber />
                </div>
              )}
              {stats.avgQuality > 0 && (
                <div>
                  <p className="text-muted-foreground mb-1">Quality</p>
                  <StarRating rating={stats.avgQuality} size="sm" showNumber />
                </div>
              )}
              {stats.avgTimeliness > 0 && (
                <div>
                  <p className="text-muted-foreground mb-1">Timeliness</p>
                  <StarRating rating={stats.avgTimeliness} size="sm" showNumber />
                </div>
              )}
              {stats.avgProfessionalism > 0 && (
                <div>
                  <p className="text-muted-foreground mb-1">Professionalism</p>
                  <StarRating rating={stats.avgProfessionalism} size="sm" showNumber />
                </div>
              )}
            </div>
          )}

          {/* Rating Distribution */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Rating Distribution</p>
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats[`rating${rating}Count`];
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center gap-2 text-sm">
                  <span className="w-8">{rating} ★</span>
                  <div className="flex-1 h-2 bg-accent/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
