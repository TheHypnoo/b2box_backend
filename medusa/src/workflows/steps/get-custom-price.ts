import { ProductVariantDTO } from "@medusajs/framework/types";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

export type GetCustomPriceStepInput = {
  variant: ProductVariantDTO & {
    calculated_price?: {
      calculated_amount: number;
    };
    prices?: Array<{
      amount: number;
      currency_code: string;
      min_quantity?: number;
      max_quantity?: number;
    }>;
  };
  quantity: number;
  metadata?: Record<string, unknown>;
  region: any; //TODO: fix this
};

// Servicios con precio fijo
const FIXED_PRICE_SERVICES = [
  "extra_barcode_registration",
  "extra_commercial_photos",
];

// Servicios con precio calculado por porcentaje del tier3
const PERCENTAGE_SERVICES = [
  "extra_labelling_for_marketplaces",
  "extra_optimized_packaging",
];

export const getCustomPriceStep = createStep(
  "get-custom-price",
  async ({
    variant,
    metadata = {},
    region,
    quantity,
  }: GetCustomPriceStepInput): Promise<StepResponse<string, number>> => {
    // Check if metadata has any additional service
    const allServices = [...FIXED_PRICE_SERVICES, ...PERCENTAGE_SERVICES];
    const hasAdditionalServices = allServices.some(
      (serviceKey) => metadata[serviceKey] === true
    );

    const getProductPriceFromQuantity = () => {
      if (!variant.prices || variant.prices.length === 0) {
        return 0;
      }

      // Ordenar precios por min_quantity para encontrar el tier correcto
      const sortedPrices = [...variant.prices].sort(
        (a, b) => (a.min_quantity ?? 0) - (b.min_quantity ?? 0)
      );

      // Encontrar el precio que corresponda a la cantidad
      let selectedPrice = sortedPrices[0]; // precio por defecto

      for (const price of sortedPrices) {
        const minQty = price.min_quantity ?? 0;
        const maxQty = price.max_quantity ?? Infinity;

        if (quantity >= minQty && quantity <= maxQty) {
          selectedPrice = price;
          break;
        }
      }

      return selectedPrice?.amount || 0;
    };

    const pricePerUnit = getProductPriceFromQuantity();

    if (!hasAdditionalServices) {
      return new StepResponse((pricePerUnit * quantity).toFixed(2));
    }

    // Buscar el precio con amount más bajo (mejor tier) solo para servicios con porcentaje
    const bestPrice = variant.prices?.reduce((best, current) => {
      return current.amount < best.amount ? current : best;
    }, variant.prices[0]);

    const tier3PricePerUnit = bestPrice?.amount || pricePerUnit;

    // Ahora multiplicar por la cantidad
    const originalPrice = pricePerUnit * quantity;

    const regionMetadata = region.metadata as Record<string, unknown>;

    // Calcular precio de servicios con precio fijo
    const fixedPriceServices = FIXED_PRICE_SERVICES.reduce(
      (acc, serviceKey) => {
        if (metadata[serviceKey] === true) {
          return acc + (regionMetadata[serviceKey] as number);
        }
        return acc;
      },
      0
    );

    // Calcular precio de servicios con porcentaje del tier3
    const percentageServices = PERCENTAGE_SERVICES.reduce((acc, serviceKey) => {
      if (metadata[serviceKey] === true) {
        const percentage = regionMetadata[serviceKey] as number;
        return acc + tier3PricePerUnit * (1 + percentage / 100) * quantity;
      }
      return acc;
    }, 0);

    const additionalServicesPrice = fixedPriceServices + percentageServices;

    const totalPrice = originalPrice + additionalServicesPrice;

    return new StepResponse(totalPrice.toFixed(2));
  }
);
