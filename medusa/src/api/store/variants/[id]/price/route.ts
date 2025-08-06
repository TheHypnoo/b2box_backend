import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getCustomPriceWorkflow } from "../../../../../workflows/get-custom-price";
import { z } from "zod";

export const PostCustomPriceSchema = z.object({
  region_id: z.string(),
  metadata: z.object({
    extra_labelling_for_marketplaces: z.boolean(),
    extra_barcode_registration: z.boolean(),
    extra_commercial_photos: z.boolean(),
    extra_optimized_packaging: z.boolean(),
  }),
  quantity: z.number(),
});

type PostCustomPriceSchemaType = z.infer<typeof PostCustomPriceSchema>;

export async function POST(
  req: MedusaRequest<PostCustomPriceSchemaType>,
  res: MedusaResponse
) {
  const { id: variantId } = req.params;
  const { region_id, metadata, quantity } = req.validatedBody;

  const { result: price } = await getCustomPriceWorkflow(req.scope).run({
    input: {
      variant_id: variantId,
      region_id,
      metadata,
      quantity,
    },
  });

  res.json({
    price,
  });
}
