export interface Packaging {
  status: boolean;
  price: number | null;
  required: boolean | null;
}

export interface PricingData {
  priceSetId: string;
  prices: PricingTier[];
}

export interface PricingTier {
  id: string;
  amount: number;
  currency_code: string;
  min_quantity?: number;
  max_quantity?: number;
  price_set_id: string;
}

export interface PricingMargins {
  [currency: string]: {
    tier1: number | null;
    tier2: number | null;
    tier3: number | null;
  };
}

export interface Pricing {
  purchasePrices: {
    tier1: number | null;
    tier2: number | null;
    tier3: number | null;
  };
  minQuantities: {
    tier1: number | null;
    tier2: number | null;
    tier3: number | null;
  };
  margins: PricingMargins;
  includePackaging: boolean;
}

export interface ContentByLanguage {
  [language: string]: {
    title: string;
    description: string;
  };
}
