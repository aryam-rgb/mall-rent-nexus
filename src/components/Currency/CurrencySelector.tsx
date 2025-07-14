import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/hooks/useCurrency";
import { DollarSign, Coins } from "lucide-react";

export const CurrencySelector = () => {
  const { currentCurrency, setCurrency } = useCurrency();

  return (
    <Select value={currentCurrency} onValueChange={(value: 'USD' | 'UGX') => setCurrency(value)}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="USD">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            USD
          </div>
        </SelectItem>
        <SelectItem value="UGX">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
            UGX
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};