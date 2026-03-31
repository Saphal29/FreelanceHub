"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import ReviewForm from "@/components/reviews/ReviewForm";
import { ArrowLeft, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { canReviewContract, getContractById } from "@/lib/api";

export default function ContractReviewPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params.id;

  const [contract, setContract] = useState(null);
  const [canReview, setCanReview] = useState(false);
  const [checkMessage, setCheckMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    checkEligibility();
  }, [contractId]);

  const checkEligibility = async () => {
    try {
      setLoading(true);
      setError("");

      // Load contract details
      const contractResponse = await getContractById(contractId);
      if (contractResponse.success) {
        setContract(contractResponse.contract);
      }

      // Check if user can review
      const eligibilityResponse = await canReviewContract(contractId);
      
      if (eligibilityResponse.success) {
        setCanReview(eligibilityResponse.canReview);
        setCheckMessage(eligibilityResponse.reason || "");
      }
    } catch (err) {
      console.error("Error checking eligibility:", err);
      setError("Failed to load review page");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSuccess = () => {
    router.push(`/contracts/${contractId}`);
  };

  const handleCancel = () => {
    router.push(`/contracts/${contractId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button
        variant="ghost"
        onClick={handleCancel}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Contract
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Leave a Review</h1>
        {contract && (
          <p className="text-muted-foreground">
            Contract: {contract.projectTitle}
          </p>
        )}
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {!canReview ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Cannot Submit Review</p>
            <p className="text-muted-foreground">{checkMessage}</p>
            <Button
              onClick={handleCancel}
              className="mt-6"
            >
              Back to Contract
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ReviewForm
          contractId={contractId}
          onSuccess={handleReviewSuccess}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
