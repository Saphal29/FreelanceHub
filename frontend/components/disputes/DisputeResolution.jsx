"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { resolveDispute } from "@/lib/api";
import {
  AlertCircle,
  CheckCircle,
  Shield,
  DollarSign,
} from "lucide-react";

const RESOLUTION_TYPES = [
  { value: "release_to_freelancer", label: "Release Funds to Freelancer", description: "Release the disputed amount to the freelancer" },
  { value: "refund_to_client", label: "Refund to Client", description: "Refund the disputed amount to the client" },
  { value: "partial_settlement", label: "Partial Settlement", description: "Split the amount between both parties" },
  { value: "no_action", label: "No Action", description: "No financial action required" },
  { value: "other", label: "Other", description: "Custom resolution" },
];

export default function DisputeResolution({ disputeId, dispute, onResolved }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState({
    resolutionType: "",
    resolutionAmount: dispute.amountDisputed || "",
    resolutionNotes: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!confirm("Are you sure you want to resolve this dispute? This action cannot be undone.")) {
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      
      const resolutionData = {
        resolutionType: formData.resolutionType,
        resolutionAmount: formData.resolutionAmount ? parseFloat(formData.resolutionAmount) : null,
        resolutionNotes: formData.resolutionNotes,
      };
      
      const response = await resolveDispute(disputeId, resolutionData);
      
      if (response.success) {
        setSuccess("Dispute resolved successfully!");
        if (onResolved) {
          onResolved();
        }
      } else {
        setError(response.error || "Failed to resolve dispute");
      }
    } catch (err) {
      console.error("Error resolving dispute:", err);
      setError(err.message || "Failed to resolve dispute");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center font-display text-xl">
          <Shield className="h-5 w-5 mr-2 text-accent" />
          Resolve Dispute
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          As the assigned mediator, you can resolve this dispute by selecting a resolution type and providing details.
        </p>
      </CardHeader>
      
      <CardContent>
        {success && (
          <Alert className="mb-6 border-2 border-green-200 bg-green-50">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800 font-semibold">{success}</AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert className="mb-6 border-2 border-red-200 bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 font-semibold">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resolution Type */}
          <div className="space-y-3">
            <Label>Resolution Type *</Label>
            {RESOLUTION_TYPES.map((type) => (
              <div
                key={type.value}
                className={`p-3 border rounded-xl cursor-pointer transition-colors ${
                  formData.resolutionType === type.value
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-accent/50"
                }`}
                onClick={() => setFormData(prev => ({ ...prev, resolutionType: type.value }))}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="resolutionType"
                    value={type.value}
                    checked={formData.resolutionType === type.value}
                    onChange={handleInputChange}
                    className="mt-1"
                    required
                  />
                  <div>
                    <p className="font-semibold text-foreground">{type.label}</p>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Resolution Amount */}
          {formData.resolutionType && formData.resolutionType !== "no_action" && (
            <div className="space-y-2">
              <Label htmlFor="resolutionAmount">Resolution Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="resolutionAmount"
                  name="resolutionAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.resolutionAmount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="pl-10 border-border bg-background"
                />
              </div>
              {dispute.amountDisputed && (
                <p className="text-xs text-muted-foreground">
                  Disputed amount: ${dispute.amountDisputed.toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Resolution Notes */}
          <div className="space-y-2">
            <Label htmlFor="resolutionNotes">Resolution Notes *</Label>
            <textarea
              id="resolutionNotes"
              name="resolutionNotes"
              value={formData.resolutionNotes}
              onChange={handleInputChange}
              placeholder="Explain your decision and reasoning..."
              required
              rows={6}
              className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-vertical"
            />
            <p className="text-xs text-muted-foreground">
              Provide a detailed explanation of your decision. This will be visible to both parties.
            </p>
          </div>

          {/* Summary */}
          {formData.resolutionType && (
            <div className="p-4 border border-border rounded-xl bg-secondary/10">
              <h4 className="font-semibold text-foreground mb-2">Resolution Summary</h4>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Type:</span>{" "}
                  {RESOLUTION_TYPES.find(t => t.value === formData.resolutionType)?.label}
                </p>
                {formData.resolutionAmount && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Amount:</span>{" "}
                    ${parseFloat(formData.resolutionAmount).toLocaleString()}
                  </p>
                )}
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Filed By:</span>{" "}
                  {dispute.filedByName}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Respondent:</span>{" "}
                  {dispute.respondentName}
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              variant="accent"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Resolving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Resolve Dispute
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
