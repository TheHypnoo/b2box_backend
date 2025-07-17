import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { AdminProductVariant } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { variant, option, sku } = req.body as {
    variant: AdminProductVariant;
    option: string;
    sku: string;
  };
  if (!variant && !option && !sku) {
    return res
      .status(400)
      .json({ message: "variant, option, sku are required" });
  }

  const serviceProduct = req.scope.resolve(Modules.PRODUCT);
  const pricingModuleService = req.scope.resolve(Modules.PRICING);

  if (!variant.options || variant.options.length === 0) {
    return res
      .status(400)
      .json({ message: "Variant has no options to duplicate" });
  }

  const optionId = variant.options[0].option_id;

  if (!optionId) {
    return res.status(400).json({ message: "Option ID is required" });
  }

  const listOptions = await serviceProduct.retrieveProductOption(optionId, {
    relations: ["values"],
  });

  await serviceProduct.updateProductOptions(optionId, {
    values: [...listOptions.values.map((value) => value.value), option],
  });

  const newVariant = await serviceProduct.createProductVariants({
    product_id: variant.product_id,
    sku,
    title: option,
    manage_inventory: false,
    metadata: {
      ...variant.metadata,
      pa_code: sku,
    },
    options: {
      [listOptions.title]: option,
    },
  });

  const newPriceSet = await pricingModuleService.createPriceSets({
    prices: variant.prices?.map((price) => ({
      ...price,
      variant_id: newVariant.id,
      price_set_id: undefined,
      id: undefined,
    })),
  });

  const link = req.scope.resolve("link");

  await link.create({
    [Modules.PRODUCT]: { variant_id: newVariant.id },
    [Modules.PRICING]: { price_set_id: newPriceSet.id },
  });

  return res.json({ variant: newVariant });
};
