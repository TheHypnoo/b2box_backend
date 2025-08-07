import React, { useState, useEffect, useMemo } from "react";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import {
  Input,
  Label,
  Button,
  Drawer,
  Heading,
  Text,
  Container,
  IconButton,
  Badge,
  Alert,
} from "@medusajs/ui";
import { EllipsisHorizontal } from "@medusajs/icons";
import { sdk } from "../lib/sdk";
import {
  DetailWidgetProps,
  AdminProductVariant,
  AdminStoreCurrency,
  AdminRegion,
} from "@medusajs/framework/types";
import SectionRow from "../components/SectionRow";
import { Packaging, Pricing, PricingData } from "../types";

const PricingWidget = ({ data }: DetailWidgetProps<AdminProductVariant>) => {
  const [currencies, setCurrencies] = useState<AdminStoreCurrency[]>([]);
  const [regions, setRegions] = useState<AdminRegion[]>([]);
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [formData, setFormData] = useState<Pricing>(() => {
    const pricing = data.metadata?.pricing as Pricing | undefined;
    const packaging = data.metadata?.packaging as Packaging | undefined;

    return {
      purchasePrices: {
        tier1: (pricing?.purchasePrices?.tier1 as number) ?? null,
        tier2: (pricing?.purchasePrices?.tier2 as number) ?? null,
        tier3: (pricing?.purchasePrices?.tier3 as number) ?? null,
      },
      minQuantities: {
        tier1: (pricing?.minQuantities?.tier1 as number) ?? null,
        tier2: (pricing?.minQuantities?.tier2 as number) ?? null,
        tier3: (pricing?.minQuantities?.tier3 as number) ?? null,
      },
      margins: pricing?.margins || {},
      includePackaging: Boolean(packaging?.status),
    } as Pricing;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Añadir estados de error para los inputs
  const [inputErrors, setInputErrors] = useState({
    purchasePrices: { tier1: false, tier2: false, tier3: false },
    minQuantities: { tier1: false, tier2: false, tier3: false },
    margins: {} as Record<
      string,
      { tier1: boolean; tier2: boolean; tier3: boolean }
    >,
  });

  // Añadir estado para errores de lógica de cantidades
  const [quantityLogicErrors, setQuantityLogicErrors] = useState({
    tier1: false,
    tier2: false,
  });

  const packaging = useMemo(() => {
    return data.metadata?.packaging as Packaging | undefined;
  }, [data.metadata]);

  // Validar lógica de minQuantities cada vez que cambian
  useEffect(() => {
    const min1 = formData.minQuantities.tier1 ?? 0;
    const min2 = formData.minQuantities.tier2 ?? 0;
    const min3 = formData.minQuantities.tier3 ?? 0;
    setQuantityLogicErrors({
      tier1: min1 >= min2 && min2 !== 0,
      tier2: min2 >= min3 && min3 !== 0,
    });
  }, [formData.minQuantities]);

  // Load currencies and current pricing data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load available currencies
        const storeResponse = await sdk.admin.store.list();
        const regionsResponse = await sdk.admin.region.list();

        setRegions(regionsResponse.regions || []);

        console.log("regionsResponse", regionsResponse);

        setCurrencies(storeResponse.stores?.[0]?.supported_currencies || []);

        // Load current pricing data
        const pricingResponse = (await sdk.client.fetch(
          `/admin/pricing/?variantId=${data.id}`
        )) as any;

        if (pricingResponse.priceSetId) {
          setPricingData({
            priceSetId: pricingResponse.priceSetId,
            prices: pricingResponse.prices || [],
          });
          console.log("pricingResponse", pricingResponse);
        } else {
          setPricingData(null);
        }

        // Initialize margins for currencies that don't exist in formData yet
        const currentMargins = formData.margins;
        currencies.forEach((currency: AdminStoreCurrency) => {
          if (!currentMargins[currency.currency_code]) {
            setFormData((prev) => ({
              ...prev,
              margins: {
                ...prev.margins,
                [currency.currency_code]: {
                  tier1: null,
                  tier2: null,
                  tier3: null,
                },
              },
            }));
          }
        });
      } catch (error) {
        console.error("Error loading pricing data:", error);
        setError("Error loading pricing data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [data.id, data.metadata]);

  const handleEdit = () => {
    setIsDrawerOpen(true);
  };

  // 3. Update handlers for purchase price, min quantity, and margin
  const updatePurchasePrice = (tier: string, amount: number | null) => {
    setInputErrors((prev) => ({
      ...prev,
      purchasePrices: {
        ...prev.purchasePrices,
        [tier]: amount !== null && amount < 0,
      },
    }));
    setFormData((prev) => ({
      ...prev,
      purchasePrices: {
        ...prev.purchasePrices,
        [tier]: amount,
      },
    }));
  };

  const updateMinQuantity = (tier: string, quantity: number | null) => {
    setInputErrors((prev) => ({
      ...prev,
      minQuantities: {
        ...prev.minQuantities,
        [tier]: quantity !== null && quantity < 0,
      },
    }));
    setFormData((prev) => ({
      ...prev,
      minQuantities: {
        ...prev.minQuantities,
        [tier]: quantity,
      },
    }));
  };

  const updateMargin = (
    currency: string,
    tier: number,
    margin: number | null
  ) => {
    setInputErrors((prev) => ({
      ...prev,
      margins: {
        ...prev.margins,
        [currency]: {
          ...(prev.margins[currency] || {
            tier1: false,
            tier2: false,
            tier3: false,
          }),
          [`tier${tier}`]: margin !== null && margin < 0,
        },
      },
    }));
    setFormData((prev) => ({
      ...prev,
      margins: {
        ...prev.margins,
        [currency]: {
          ...prev.margins[currency],
          [`tier${tier}`]: margin,
        },
      },
    }));
  };

  // 4. Sale price calculation
  const calculateSalePrice = (
    purchasePrice: number,
    margin: number,
    packagingPrice: number,
    includePackaging: boolean
  ) => {
    const totalCost = purchasePrice + (includePackaging ? packagingPrice : 0);
    return totalCost * (1 + margin / 100);
  };

  // 5. Update handleSubmit to save all pricing data in metadata.pricing
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.product_id || !data.id) return;
    try {
      const productVariant = await sdk.admin.product.retrieveVariant(
        data.product_id!,
        data.id
      );
      // Save all pricing data in metadata.pricing
      await sdk.admin.product.updateVariant(data.product_id!, data.id, {
        metadata: {
          ...productVariant.variant.metadata,
          pricing: {
            purchasePrices: formData.purchasePrices,
            minQuantities: formData.minQuantities,
            margins: formData.margins,
            includePackaging: formData.includePackaging,
          },
        },
      });
      // Calculate and save sale prices
      const salePrices = [];
      for (const currency of currencies) {
        const currencyCode = currency.currency_code;
        const marginObj = formData.margins[currencyCode] || {};
        for (let tier = 1; tier <= 3; tier++) {
          const purchasePrice =
            formData.purchasePrices[
              `tier${tier}` as keyof typeof formData.purchasePrices
            ];
          const margin =
            marginObj[`tier${tier}` as keyof typeof marginObj] || 0;

          if (purchasePrice !== null && purchasePrice > 0) {
            const salePrice = calculateSalePrice(
              purchasePrice,
              margin,
              (packaging?.price as number) || 0,
              formData.includePackaging
            );

            const minQty =
              formData.minQuantities[
                `tier${tier}` as keyof typeof formData.minQuantities
              ];

            const maxQty =
              tier < 3
                ? (formData.minQuantities?.[
                    `tier${tier + 1}` as keyof typeof formData.minQuantities
                  ] ?? 0) - 1 || null
                : null;

            // Add price with rules (region_id)
            salePrices.push({
              amount: Number(salePrice.toFixed(2)),
              currency_code: currencyCode,
              min_quantity: minQty,
              max_quantity: maxQty,
              rules: {
                /* region_id: regions.find(
                  (region) => region.currency_code === currencyCode
                )?.id, */
              },
            });

            // Add price without rules (no region_id)
            /* salePrices.push({
              amount: Number(salePrice.toFixed(2)),
              currency_code: currencyCode,
              min_quantity: minQty,
              max_quantity: maxQty,
              rules: {},
            }); */
          }
        }
      }
      // Save sale prices to pricing system
      if (salePrices.length > 0) {
        console.log("salePrices", JSON.stringify(salePrices, null, 2));
        await sdk.client.fetch(`/admin/pricing/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: {
            variantId: data.id,
            priceSetId: pricingData?.priceSetId,
            prices: salePrices,
          },
        });
      }
      // Reload pricing data
      const updatedPricingResponse = (await sdk.client.fetch(
        `/admin/pricing/?variantId=${data.id}`
      )) as any;
      setPricingData({
        priceSetId: updatedPricingResponse.priceSetId,
        prices: updatedPricingResponse.prices || [],
      });
      setIsDrawerOpen(false);
      setError(null);
    } catch (error) {
      console.error("Error updating pricing:", error);
      setError("Error updating pricing");
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setError(null);
  };

  if (loading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Pricing</Heading>
        </div>
        <div className="px-6 py-4">
          <Text>Loading pricing data...</Text>
        </div>
      </Container>
    );
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Pricing</Heading>
        <IconButton size="small" variant="transparent" onClick={handleEdit}>
          <EllipsisHorizontal />
        </IconButton>
      </div>

      {error && (
        <div className="px-6 py-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {/* Purchase Prices Section */}
      <div className="px-6 py-4">
        {!formData.includePackaging && (packaging?.price as number) > 0 && (
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <Text size="small" className="text-gray-600">
              📦 Packaging price: ¥{Number(packaging?.price ?? 0).toFixed(2)}{" "}
              CNY (included in calculations)
            </Text>
          </div>
        )}
        {Object.entries(formData.purchasePrices).map(([tier, amount]) => {
          const packagingPrice = (packaging?.price as number) || 0;
          const totalWithPackaging = Number(
            ((amount || 0) + packagingPrice).toFixed(2)
          );

          return (
            <div key={tier} className="border rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge>{tier.toUpperCase().replace("TIER", "TIER ")}</Badge>
                <Text size="small" color="secondary">
                  min:{" "}
                  {formData.minQuantities[
                    tier as keyof typeof formData.minQuantities
                  ] === null
                    ? "—"
                    : formData.minQuantities[
                        tier as keyof typeof formData.minQuantities
                      ]}
                </Text>
                {tier !== "tier3" &&
                  (() => {
                    const nextTier = `tier${
                      parseInt(tier.replace("tier", "")) + 1
                    }` as keyof typeof formData.minQuantities;
                    const maxQty = formData.minQuantities?.[nextTier];
                    return maxQty ? (
                      <Text size="small" color="secondary">
                        • max: {maxQty - 1}
                      </Text>
                    ) : null;
                  })()}
              </div>
              <SectionRow
                title="Base Purchase Price"
                value={
                  amount !== null ? `¥${Number(amount).toFixed(2)} CNY` : "—"
                }
              />
              {!formData.includePackaging && packagingPrice > 0 && (
                <SectionRow
                  title="Total (Base + Packaging)"
                  value={`¥${totalWithPackaging.toFixed(2)} CNY`}
                />
              )}

              {/* Sale Prices by Currency */}
              {amount !== null && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge size="small">Sale Prices</Badge>
                    <Text size="small" color="secondary">
                      Calculated with margins
                    </Text>
                  </div>
                  {currencies.map((storeCurrency) => {
                    const currencyCode = storeCurrency.currency_code;
                    const margin =
                      formData.margins[currencyCode]?.[
                        tier as keyof {
                          tier1: number | null;
                          tier2: number | null;
                          tier3: number | null;
                        }
                      ] ?? null;

                    // Solo mostrar el salePrice si amount y margin son válidos
                    if (
                      amount === null ||
                      margin === null ||
                      isNaN(amount) ||
                      isNaN(margin)
                    ) {
                      return (
                        <div key={currencyCode} className="mb-2 last:mb-0">
                          <div className="flex justify-between items-center py-2">
                            <div className="flex items-center gap-2">
                              <Text size="small" className="font-medium">
                                {currencyCode.toUpperCase()}
                              </Text>
                            </div>
                            <div className="text-right">
                              <Text size="xsmall" color="secondary">
                                Complete all fields to see sale price
                              </Text>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    const salePrice = calculateSalePrice(
                      amount,
                      margin,
                      packagingPrice,
                      formData.includePackaging
                    );

                    return (
                      <div key={currencyCode} className="mb-2 last:mb-0">
                        <div className="flex justify-between items-center py-2">
                          <div className="flex items-center gap-2">
                            <Text size="small" className="font-medium">
                              {currencyCode.toUpperCase()}
                            </Text>
                            <Text size="xsmall" color="secondary">
                              ({margin}% margin)
                            </Text>
                          </div>
                          <div className="text-right">
                            <Text size="small" className="font-semibold">
                              {salePrice.toFixed(2)}{" "}
                              {storeCurrency.currency.symbol}
                            </Text>
                            <Text size="xsmall" color="secondary">
                              per unit
                            </Text>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Drawer for editing */}
      <Drawer open={isDrawerOpen} onOpenChange={handleCloseDrawer}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Edit Pricing Configuration</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body style={{ overflowY: "auto" }}>
            <form onSubmit={handleSubmit}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 24 }}
              >
                {/* Purchase Prices */}
                <div>
                  <Heading level="h3" className="mb-4">
                    Purchase Prices (CNY)
                  </Heading>
                  {Object.entries(formData.purchasePrices).map(
                    ([tier, amount]) => {
                      return (
                        <div key={tier} className="border rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between mb-4">
                            <Badge>
                              {tier.toUpperCase().replace("TIER", "TIER ")}
                            </Badge>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 16,
                            }}
                          >
                            <div>
                              <Label>Base Purchase Price (CNY)</Label>
                              <Input
                                type="number"
                                value={amount ?? ""}
                                onChange={(e) =>
                                  updatePurchasePrice(
                                    tier,
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value)
                                  )
                                }
                                min="0"
                                step="0.01"
                                placeholder="Enter purchase price"
                              />
                              {inputErrors.purchasePrices[
                                tier as keyof typeof inputErrors.purchasePrices
                              ] && (
                                <Text size="xsmall" color="danger">
                                  Price cannot be negative
                                </Text>
                              )}
                            </div>
                            <div>
                              <Label>Minimum Quantity</Label>
                              <Input
                                type="number"
                                value={
                                  formData.minQuantities?.[
                                    `${tier}` as keyof typeof formData.minQuantities
                                  ] ?? ""
                                }
                                onChange={(e) => {
                                  updateMinQuantity(
                                    tier,
                                    e.target.value === ""
                                      ? null
                                      : parseInt(e.target.value) || null
                                  );
                                }}
                                min="1"
                                placeholder="Minimum quantity"
                              />
                              {inputErrors.minQuantities[
                                tier as keyof typeof inputErrors.minQuantities
                              ] && (
                                <Text size="xsmall" color="danger">
                                  Quantity cannot be negative
                                </Text>
                              )}
                              {tier === "tier1" &&
                                quantityLogicErrors.tier1 && (
                                  <Text size="xsmall" color="danger">
                                    Tier 1 minimum must be less than Tier 2
                                    minimum
                                  </Text>
                                )}
                              {tier === "tier2" &&
                                quantityLogicErrors.tier2 && (
                                  <Text size="xsmall" color="danger">
                                    Tier 2 minimum must be less than Tier 3
                                    minimum
                                  </Text>
                                )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                {/* Margins Configuration */}
                <div>
                  <Heading level="h3" className="mb-4">
                    Margins (%)
                  </Heading>
                  {currencies.map((currency) => (
                    <div
                      key={currency.currency_code}
                      className="border rounded-lg p-4 mb-4"
                    >
                      <Badge className="mb-3">
                        {currency.currency_code.toUpperCase()}
                      </Badge>
                      {[1, 2, 3].map((tier) => {
                        const margin =
                          formData.margins[currency.currency_code]?.[
                            `tier${tier}` as keyof {
                              tier1: number | null;
                              tier2: number | null;
                              tier3: number | null;
                            }
                          ] || null;
                        const minQty =
                          formData.minQuantities[
                            `tier${tier}` as keyof typeof formData.minQuantities
                          ];
                        return (
                          <div key={tier} className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Text size="small">
                                Tier {tier} (Min: {minQty}+ units)
                              </Text>
                            </div>
                            <div>
                              <Label>
                                Margin ({currency.currency_code.toUpperCase()})
                              </Label>
                              <Input
                                type="number"
                                value={margin ?? ""}
                                onChange={(e) => {
                                  updateMargin(
                                    currency.currency_code,
                                    tier,
                                    e.target.value === ""
                                      ? null
                                      : parseFloat(e.target.value) || null
                                  );
                                }}
                                min="0"
                                step="0.01"
                                placeholder="25"
                              />
                              {inputErrors.margins[currency.currency_code]?.[
                                `tier${tier}` as keyof {
                                  tier1: boolean;
                                  tier2: boolean;
                                  tier3: boolean;
                                }
                              ] && (
                                <Text size="xsmall" color="danger">
                                  Margin cannot be negative
                                </Text>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </Drawer.Body>
          <Drawer.Footer>
            <Button variant="secondary" onClick={handleCloseDrawer}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={
                Object.values(inputErrors.purchasePrices).some(Boolean) ||
                Object.values(inputErrors.minQuantities).some(Boolean) ||
                Object.values(inputErrors.margins).some(
                  (m) => m && Object.values(m).some(Boolean)
                ) ||
                Object.values(quantityLogicErrors).some(Boolean)
              }
            >
              Save Changes
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product_variant.details.after",
});

export default PricingWidget;
