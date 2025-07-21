import React, { useMemo, useState } from "react";
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
  Switch,
} from "@medusajs/ui";
import { EllipsisHorizontal } from "@medusajs/icons";
import { sdk } from "../lib/sdk";
import {
  DetailWidgetProps,
  AdminProductVariant,
} from "@medusajs/framework/types";
import SectionRow from "../components/SectionRow";
import { Packaging } from "../types";

const PackagingWidget = ({ data }: DetailWidgetProps<AdminProductVariant>) => {
  const packaging = useMemo(() => {
    return data.metadata?.packaging as Record<string, unknown> | undefined;
  }, [data.metadata]);

  const [packagingData, setPackagingData] = useState<Packaging>({
    status: Boolean(packaging?.status) || false,
    price: (packaging?.price as number | null) || null,
    required: Boolean(packaging?.required) || null,
  } as Packaging);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    status: false,
    price: null as number | null,
    required: null,
  } as Packaging);

  const [errors, setErrors] = useState({
    price: false,
  });

  const handleEdit = () => {
    setFormData({
      status: packagingData.status,
      price: packagingData.price ?? null,
      required: packagingData.required,
    });
    setErrors({
      price: false,
    });
    setIsDrawerOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "price") {
      const numValue = value ? parseFloat(value) : null;
      setFormData((prev) => ({ ...prev, [name]: numValue }));

      const isValid = !formData.status || (value && parseFloat(value) >= 0);
      setErrors((prev) => ({ ...prev, price: !isValid }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));

    if (name === "status" && checked) {
      setFormData((prev) => ({ ...prev, price: null }));
      setErrors((prev) => ({ ...prev, price: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.product_id || !data.id) return;

    const newErrors = {
      price:
        !formData.status && (formData.price === null || formData.price < 0),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error)) {
      return;
    }

    try {
      const productVariant = await sdk.admin.product.retrieveVariant(
        data.product_id,
        data.id
      );
      await sdk.admin.product.updateVariant(data.product_id, data.id, {
        metadata: {
          ...productVariant.variant.metadata,
          packaging: {
            status: formData.status,
            price: formData.price,
            required: formData.required,
          },
        },
      });
      setPackagingData(formData);
      setIsDrawerOpen(false);
    } catch (error) {
      console.error("Error updating packaging state:", error);
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Packaging</Heading>
        <IconButton size="small" variant={"transparent"} onClick={handleEdit}>
          <EllipsisHorizontal />
        </IconButton>
      </div>
      <SectionRow
        title="State"
        value={
          <Text
            size="small"
            className={packagingData.status ? "text-green-600" : "text-red-600"}
          >
            {packagingData.status ? "Yes" : "No"}
          </Text>
        }
      />
      {!packagingData.status && packagingData.price !== null && (
        <SectionRow title="Price" value={`¥${packagingData.price} CNY`} />
      )}
      {!packagingData.status && packagingData.price !== null && (
        <SectionRow
          title="Required"
          value={
            <Text
              size="small"
              className={
                packagingData.required ? "text-green-600" : "text-gray-500"
              }
            >
              {packagingData.required ? "Yes" : "No"}
            </Text>
          }
        />
      )}

      {/* Drawer for editing */}
      <Drawer open={isDrawerOpen} onOpenChange={handleCloseDrawer}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Edit Packaging State</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <form onSubmit={handleSubmit}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div>
                  <Label htmlFor="status">Packaging</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Switch
                      id="status"
                      checked={formData.status}
                      onCheckedChange={(checked) =>
                        handleSwitchChange("status", checked)
                      }
                    />
                    <Text size="small">{formData.status ? "Yes" : "No"}</Text>
                  </div>
                </div>

                {!formData.status && (
                  <>
                    <div>
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        name="price"
                        value={formData.price ?? undefined}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        placeholder="E.g. 5.99"
                        className={errors.price ? "border-red-500" : ""}
                        required={!formData.status}
                      />
                      <Text size="small" color="secondary" className="mt-1">
                        Price in CNY (Chinese Yuan)
                      </Text>
                      {errors.price && (
                        <Text size="small" className="mt-1 text-red-500">
                          Must be a positive number
                        </Text>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="required">Required</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Switch
                          id="required"
                          checked={formData.required ?? false}
                          onCheckedChange={(checked) =>
                            handleSwitchChange("required", checked)
                          }
                        />
                        <Text size="small">
                          {formData.required ? "Yes" : "No"}
                        </Text>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </form>
          </Drawer.Body>
          <Drawer.Footer>
            <Button variant="secondary" onClick={handleCloseDrawer}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              Save changes
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product_variant.details.side.before",
});

export default PackagingWidget;
