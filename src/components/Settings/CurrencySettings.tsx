import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/hooks/useAuth";
import { RefreshCw, Save } from "lucide-react";

export const CurrencySettings = () => {
  const { exchangeRate, updateExchangeRate, loading } = useCurrency();
  const { profile } = useAuth();
  const [newRate, setNewRate] = useState(exchangeRate.toString());
  const [updating, setUpdating] = useState(false);

  const handleUpdateRate = async () => {
    setUpdating(true);
    await updateExchangeRate(parseFloat(newRate));
    setUpdating(false);
  };

  if (profile?.role !== 'superadmin') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Currency Exchange Rate
        </CardTitle>
        <CardDescription>
          Manage the USD to UGX exchange rate for accurate conversions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currentRate">Current Rate (1 USD = X UGX)</Label>
            <Input
              id="currentRate"
              value={exchangeRate.toLocaleString()}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newRate">New Rate</Label>
            <Input
              id="newRate"
              type="number"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              placeholder="Enter new exchange rate"
            />
          </div>
        </div>

        <Button 
          onClick={handleUpdateRate} 
          disabled={updating || loading || !newRate}
          className="w-full md:w-auto"
        >
          <Save className="h-4 w-4 mr-2" />
          {updating ? "Updating..." : "Update Exchange Rate"}
        </Button>

        <div className="text-sm text-muted-foreground">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p>This rate affects all currency conversions in the system.</p>
        </div>
      </CardContent>
    </Card>
  );
};