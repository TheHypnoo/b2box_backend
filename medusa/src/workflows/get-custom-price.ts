import { QueryContext } from "@medusajs/framework/utils";
import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import {
  getCustomPriceStep,
  GetCustomPriceStepInput,
} from "./steps/get-custom-price";

type WorkflowInput = {
  variant_id: string;
  region_id: string;
  quantity: number;
  metadata?: Record<string, unknown>;
};

export const getCustomPriceWorkflow = createWorkflow(
  "get-custom-price-workflow",
  (input: WorkflowInput) => {
    const { data: regions } = useQueryGraphStep({
      entity: "region",
      fields: ["currency_code", "metadata"],
      filters: {
        id: input.region_id,
      },
      options: {
        throwIfKeyNotFound: true,
      },
    });

    const { data: variants } = useQueryGraphStep({
      entity: "variant",
      fields: ["*", "calculated_price.*", "product.*", "prices.*"],
      filters: {
        id: input.variant_id,
      },
      options: {
        throwIfKeyNotFound: true,
      },
      context: {
        calculated_price: QueryContext({
          region_id: regions[0].id,
          currency_code: regions[0].currency_code,
          quantity: input.quantity,
        }),
      },
    }).config({ name: "get-custom-price-variant" });

    const price = getCustomPriceStep({
      variant: variants[0],
      metadata: input.metadata,
      region: regions[0],
      quantity: input.quantity,
    } as GetCustomPriceStepInput);

    return new WorkflowResponse(price);
  }
);
