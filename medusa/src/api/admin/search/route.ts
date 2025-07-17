import {
  MedusaRequest,
  MedusaResponse,
  pgConnectionLoader,
} from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { bxCode, sku } = req.query as {
    bxCode: string | undefined;
    sku: string | undefined;
  };

  if (!bxCode && !sku) {
    return res.status(400).json({ message: "bxCode or sku are required" });
  }

  const connection = await pgConnectionLoader();
  const LIMIT = 20;

  if (bxCode && sku) {
    // Buscar por BXCODE
    const productsByBxCode = await connection("product")
      .select("id", "title")
      .whereRaw("metadata->>'bx_code' ILIKE ?", [`%${bxCode}%`])
      .limit(LIMIT);
    const productsByBxCodeTyped = productsByBxCode.map((p) => ({ ...p, type: "product" }));

    // Buscar por SKU
    const productsBySku = await connection("product_variant")
      .select("product_id", "id", "title")
      .whereRaw("sku ILIKE ?", [`%${sku}%`])
      .limit(LIMIT);
    const productsBySkuTyped = productsBySku.map((v) => ({ ...v, type: "variant" }));

    // Unir resultados por product_id y id (evitar duplicados exactos)
    const allProducts = [
      ...productsByBxCodeTyped,
      ...productsBySkuTyped.filter(
        (skuProd) =>
          !productsByBxCode.some((bxProd) => bxProd.id === skuProd.product_id)
      ),
    ];

    return res.status(200).json({
      products: allProducts,
    });
  }

  if (bxCode) {
    const products = await connection("product")
      .select("id", "title")
      .whereRaw("metadata->>'bx_code' ILIKE ?", [`%${bxCode}%`])
      .limit(LIMIT);
    const productsTyped = products.map((p) => ({ ...p, type: "product" }));
    return res.status(200).json({
      products: productsTyped,
    });
  }

  if (sku) {
    const products = await connection("product_variant")
      .select("product_id", "id", "title")
      .whereRaw("sku ILIKE ?", [`%${sku}%`])
      .limit(LIMIT);
    const productsTyped = products.map((v) => ({ ...v, type: "variant" }));
    return res.status(200).json({
      products: productsTyped,
    });
  }
};
