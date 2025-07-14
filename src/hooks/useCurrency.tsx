import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Currency = 'USD' | 'UGX';

interface CurrencySettings {
  id: string;
  base_currency: string;
  exchange_rate_usd_to_ugx: number;
  last_updated: string;
}

interface CurrencyContextType {
  currentCurrency: Currency;
  setCurrency: (currency: Currency) => void;
  exchangeRate: number;
  convertAmount: (amount: number, fromCurrency: Currency, toCurrency: Currency) => number;
  formatAmount: (amount: number, currency: Currency) => string;
  updateExchangeRate: (rate: number) => Promise<void>;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currentCurrency, setCurrentCurrency] = useState<Currency>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(3700);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrencySettings();
  }, []);

  const fetchCurrencySettings = async () => {
    try {
      const { data, error } = await supabase
        .from("currency_settings")
        .select("*")
        .single();

      if (error) throw error;

      if (data) {
        setExchangeRate(data.exchange_rate_usd_to_ugx);
      }
    } catch (error) {
      console.error("Error fetching currency settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const setCurrency = (currency: Currency) => {
    setCurrentCurrency(currency);
    localStorage.setItem('preferredCurrency', currency);
  };

  const convertAmount = (amount: number, fromCurrency: Currency, toCurrency: Currency): number => {
    if (fromCurrency === toCurrency) return amount;
    
    if (fromCurrency === 'USD' && toCurrency === 'UGX') {
      return amount * exchangeRate;
    }
    
    if (fromCurrency === 'UGX' && toCurrency === 'USD') {
      return amount / exchangeRate;
    }
    
    return amount;
  };

  const formatAmount = (amount: number, currency: Currency): string => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'UGX' ? 0 : 2,
      maximumFractionDigits: currency === 'UGX' ? 0 : 2,
    });

    return formatter.format(amount);
  };

  const updateExchangeRate = async (rate: number) => {
    try {
      const { error } = await supabase
        .from("currency_settings")
        .update({
          exchange_rate_usd_to_ugx: rate,
          last_updated: new Date().toISOString(),
        })
        .eq("base_currency", "USD");

      if (error) throw error;

      setExchangeRate(rate);
      toast({
        title: "Exchange rate updated",
        description: `New rate: 1 USD = ${rate} UGX`,
      });
    } catch (error) {
      console.error("Error updating exchange rate:", error);
      toast({
        title: "Error",
        description: "Failed to update exchange rate",
        variant: "destructive",
      });
    }
  };

  // Load preferred currency from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('preferredCurrency') as Currency;
    if (saved && (saved === 'USD' || saved === 'UGX')) {
      setCurrentCurrency(saved);
    }
  }, []);

  const value = {
    currentCurrency,
    setCurrency,
    exchangeRate,
    convertAmount,
    formatAmount,
    updateExchangeRate,
    loading,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};