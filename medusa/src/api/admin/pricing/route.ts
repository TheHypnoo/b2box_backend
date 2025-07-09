import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { variantId } = req.query as { variantId: string };

  if (!variantId) {
    return res.status(400).json({ message: "variantId is required" });
  }

  // Get price_set_id for the variant
  const query = req.scope.resolve("query");
  const { data: variants } = await query.graph({
    entity: "variant",
    fields: ["price_set.*", "price_set.prices.*"],
    filters: { id: [variantId] },
  });
  const priceSetId = variants[0]?.price_set?.id;
  const prices = variants[0]?.price_set?.prices;

  return res.status(200).json({
    priceSetId,
    prices,
  });
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  //TODO: POST - CREATE OR UPDATE PRICING
  const { variantId, priceSetId, prices } = req.body as {
    variantId: string;
    priceSetId?: string;
    prices: any[];
  };

  // 1. Get price_set_id for the variant
  const query = req.scope.resolve("query");
  const { data: variants } = await query.graph({
    entity: "variant",
    fields: ["price_set.*"],
    filters: { id: [variantId] },
  });

  console.log(variants[0].price_set?.id);

  if (!variants[0]?.price_set?.id) {
    return res.status(404).json({ message: "Price set not found for variant" });
  }

  const pricingModuleService = req.scope.resolve(Modules.PRICING);

  if (priceSetId) {
    const updatePriceSet = await pricingModuleService.updatePriceSets(
      priceSetId,
      {
        prices: prices,
      }
    );

    return res.status(200).json({
      message: "Prices processed successfully",
      result: {
        data: updatePriceSet,
      },
    });
  }

  const result = await pricingModuleService.addPrices({
    priceSetId: variants[0]?.price_set?.id,
    prices: prices,
  });

  return res.status(200).json({
    message: "Prices processed successfully",
    result: {
      data: result,
    },
  });
};
