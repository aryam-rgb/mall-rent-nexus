import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: {
    id: number;
    tenant: string;
    property: string;
    amount: string;
    dueDate: string;
    status: string;
  } | null;
  onPaymentSubmit: (paymentData: any) => void;
}

export const PaymentModal = ({ isOpen, onClose, payment, onPaymentSubmit }: PaymentModalProps) => {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!payment) return null;

  // Extract numeric amount
  const totalAmount = parseFloat(payment.amount.replace(/[$,]/g, ""));
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amount = parseFloat(paymentAmount);
      if (amount <= 0 || amount > totalAmount) {
        toast({
          title: "Invalid Amount",
          description: `Payment amount must be between $1 and ${payment.amount}`,
          variant: "destructive",
        });
        return;
      }

      const paymentData = {
        paymentId: payment.id,
        amount,
        paymentMethod,
        paymentReference,
        notes,
        isPartial: amount < totalAmount,
        remainingAmount: totalAmount - amount,
      };

      await onPaymentSubmit(paymentData);
      
      toast({
        title: "Payment Processed",
        description: amount < totalAmount 
          ? `Partial payment of $${amount} recorded. Remaining: $${(totalAmount - amount).toFixed(2)}`
          : "Full payment processed successfully",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (value: string) => {
    setPaymentAmount(value);
    const amount = parseFloat(value);
    setIsPartialPayment(amount > 0 && amount < totalAmount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Make Payment
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Payment Details */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Property:</span>
              <span className="text-sm font-medium">{payment.property}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Due:</span>
              <span className="text-lg font-bold text-primary">{payment.amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Due Date:</span>
              <span className="text-sm font-medium">{payment.dueDate}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Payment Amount
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={totalAmount}
                value={paymentAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Enter payment amount"
                required
              />
              {isPartialPayment && (
                <p className="text-sm text-orange-600">
                  Partial payment: Remaining balance will be ${(totalAmount - parseFloat(paymentAmount || "0")).toFixed(2)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Payment Reference</Label>
              <Input
                id="reference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Transaction ID, Receipt #, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional payment notes..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Processing..." : "Submit Payment"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};