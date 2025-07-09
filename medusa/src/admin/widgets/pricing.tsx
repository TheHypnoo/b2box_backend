import React, { useState, useEffect } from "react";
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
  Select,
} from "@medusajs/ui";
import { EllipsisHorizontal, Plus, Trash } from "@medusajs/icons";
import { sdk } from "../lib/sdk";
import {
  DetailWidgetProps,
  AdminProductVariant,
  AdminStoreCurrency,
} from "@medusajs/framework/types";

interface PricingPrice {
  id: string;
  amount: number;
  currency_code: string;
  min_quantity?: number;
  max_quantity?: number;
  price_set_id: string;
}

interface PricingData {
  priceSetId: string;
  prices: PricingPrice[];
}

interface FormPrice {
  amount: number;
  currency_code: string;
  min_quantity?: number;
  max_quantity?: number;
}

const SectionRow = ({ title, value }: { title: string; value: string }) => (
  <div className="flex items-center justify-between px-6 py-4">
    <Text size="small" color="secondary">
      {title}
    </Text>
    <Text size="small">{value || "—"}</Text>
  </div>
);

const PricingWidget = ({ data }: DetailWidgetProps<AdminProductVariant>) => {
  const [currencies, setCurrencies] = useState<AdminStoreCurrency[]>([]);
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formPrices, setFormPrices] = useState<FormPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load currencies and current pricing data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load available currencies
        const storeResponse = await sdk.admin.store.list();
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
        } else {
          setPricingData(null);
        }
      } catch (error) {
        console.error("Error loading pricing data:", error);
        setError("Error loading pricing data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [data.id]);

  const handleEdit = () => {
    // Initialize form with current prices
    const currentPrices: FormPrice[] =
      pricingData?.prices.map((price) => ({
        amount: price.amount,
        currency_code: price.currency_code,
        min_quantity: price.min_quantity,
        max_quantity: price.max_quantity,
      })) || [];

    setFormPrices(currentPrices);
    setIsDrawerOpen(true);
  };

  const addPrice = (e?: React.MouseEvent) => {
    // Prevent form submission if this is called from a button click
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const newCurrency =
      currencies.find(
        (c) => !formPrices.some((p) => p.currency_code === c.currency_code)
      )?.currency_code ||
      currencies[0]?.currency_code ||
      "eur";

    setFormPrices((prev) => [
      ...prev,
      {
        amount: 0,
        currency_code: newCurrency,
        min_quantity: undefined,
        max_quantity: undefined,
      },
    ]);
  };

  const removePrice = (index: number) => {
    setFormPrices((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePrice = (index: number, field: keyof FormPrice, value: any) => {
    setFormPrices((prev) =>
      prev.map((price, i) =>
        i === index ? { ...price, [field]: value } : price
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Filter out prices with zero amount
      const validPrices = formPrices.filter((price) => price.amount > 0);

      // Convert prices to the format expected by the API
      const apiPrices = validPrices.map((price) => ({
        amount: price.amount,
        currency_code: price.currency_code,
        min_quantity: price.min_quantity || null,
        max_quantity: price.max_quantity || null,
      }));

      const response = (await sdk.client.fetch(`/admin/pricing/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          variantId: data.id,
          priceSetId: pricingData?.priceSetId,
          prices: apiPrices,
        },
      })) as any;

      if (response?.result?.data) {
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
      }
    } catch (error) {
      console.error("Error updating prices:", error);
      setError("Error updating prices");
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

      {pricingData ? (
        <div className="px-6 py-4">
          {pricingData.prices.length > 0 ? (
            pricingData.prices.map((price) => (
              <div key={price.id} className="border rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge>{price.currency_code.toUpperCase()}</Badge>
                </div>
                <SectionRow
                  title="Amount"
                  value={`${price.amount} ${price.currency_code.toUpperCase()}`}
                />
                {price.min_quantity && (
                  <SectionRow
                    title="Min Quantity"
                    value={price.min_quantity.toString()}
                  />
                )}
                {price.max_quantity && (
                  <SectionRow
                    title="Max Quantity"
                    value={price.max_quantity.toString()}
                  />
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <Heading level="h3" className="mb-2 text-gray-600">
                No Pricing Configured
              </Heading>
              <Text size="small" color="secondary" className="mb-4 max-w-sm">
                This product variant doesn't have any pricing set up yet. Add
                pricing to make it available for purchase.
              </Text>
              <Button
                variant="secondary"
                size="small"
                onClick={handleEdit}
                className="flex items-center gap-2"
              >
                <Plus />
                Configure Pricing
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="px-6 py-4">
          <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
            <Text size="small" color="secondary" className="mb-3">
              No pricing data available
            </Text>
            <Button
              variant="secondary"
              size="small"
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Plus />
              Set Up Pricing
            </Button>
          </div>
        </div>
      )}

      {/* Drawer for editing */}
      <Drawer open={isDrawerOpen} onOpenChange={handleCloseDrawer}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Edit Pricing</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body style={{ overflowY: "auto" }}>
            <form onSubmit={handleSubmit}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 24 }}
              >
                {formPrices.map((price, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <Badge>{price.currency_code.toUpperCase()}</Badge>
                      <IconButton
                        size="small"
                        variant="transparent"
                        onClick={() => removePrice(index)}
                      >
                        <Trash />
                      </IconButton>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                      }}
                    >
                      <div>
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          value={price.amount}
                          onChange={(e) =>
                            updatePrice(index, "amount", e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                            }
                          }}
                          required
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <Label>Currency</Label>
                        <Select
                          value={price.currency_code}
                          onValueChange={(value) =>
                            updatePrice(index, "currency_code", value)
                          }
                        >
                          <Select.Trigger>
                            <Select.Value placeholder="Select currency" />
                          </Select.Trigger>
                          <Select.Content>
                            {currencies.map((currency) => (
                              <Select.Item
                                key={currency.currency_code}
                                value={currency.currency_code}
                              >
                                {currency.currency_code.toUpperCase()}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select>
                      </div>

                      <div>
                        <Label>Min Quantity (optional)</Label>
                        <Input
                          type="number"
                          value={price.min_quantity || ""}
                          onChange={(e) =>
                            updatePrice(
                              index,
                              "min_quantity",
                              e.target.value
                                ? parseInt(e.target.value)
                                : undefined
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                            }
                          }}
                          min="1"
                          placeholder="Leave empty for no minimum"
                        />
                      </div>

                      <div>
                        <Label>Max Quantity (optional)</Label>
                        <Input
                          type="number"
                          value={price.max_quantity || ""}
                          onChange={(e) =>
                            updatePrice(
                              index,
                              "max_quantity",
                              e.target.value
                                ? parseInt(e.target.value)
                                : undefined
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                            }
                          }}
                          min="1"
                          placeholder="Leave empty for no maximum"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="secondary"
                  onClick={(e) => addPrice(e)}
                  className="flex items-center gap-2"
                >
                  <Plus />
                  Add Price
                </Button>
              </div>
            </form>
          </Drawer.Body>
          <Drawer.Footer>
            <Button variant="secondary" onClick={handleCloseDrawer}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              Save Changes
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </Container>
  );
};

// The widget's configurations
export const config = defineWidgetConfig({
  zone: "product_variant.details.after",
});

export default PricingWidget;
