import React, { useState } from "react";
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
} from "@medusajs/ui";
import { EllipsisHorizontal } from "@medusajs/icons";
import { sdk } from "../lib/sdk";
import {
  DetailWidgetProps,
  AdminProductVariant,
} from "@medusajs/framework/types";
import SectionRow from "../components/SectionRow";

const VariantAttributesWidget = ({
  data,
}: DetailWidgetProps<AdminProductVariant>) => {
  const [variantData, setVariantData] = useState({
    weight: (data.metadata?.product as any)?.weight || "",
    length: (data.metadata?.product as any)?.length || "",
    height: (data.metadata?.product as any)?.height || "",
    width: (data.metadata?.product as any)?.width || "",
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    weight: "",
    length: "",
    height: "",
    width: "",
  });

  const [errors, setErrors] = useState({
    weight: false,
    length: false,
    height: false,
    width: false,
  });

  const handleEdit = () => {
    setFormData({
      weight: variantData.weight,
      length: variantData.length,
      height: variantData.height,
      width: variantData.width,
    });
    setErrors({
      weight: false,
      length: false,
      height: false,
      width: false,
    });
    setIsDrawerOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (["weight", "length", "height", "width"].includes(name)) {
      const isValid =
        value === "" || (/^\d+(\.\d+)?$/.test(value) && parseFloat(value) >= 0);
      setErrors((prev) => ({ ...prev, [name]: !isValid }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.product_id || !data.id) return;

    const newErrors = {
      weight:
        formData.weight !== "" &&
        (!/^\d+(\.\d+)?$/.test(formData.weight) ||
          parseFloat(formData.weight) < 0),
      length:
        formData.length !== "" &&
        (!/^\d+(\.\d+)?$/.test(formData.length) ||
          parseFloat(formData.length) < 0),
      height:
        formData.height !== "" &&
        (!/^\d+(\.\d+)?$/.test(formData.height) ||
          parseFloat(formData.height) < 0),
      width:
        formData.width !== "" &&
        (!/^\d+(\.\d+)?$/.test(formData.width) ||
          parseFloat(formData.width) < 0),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error)) {
      return;
    }

    try {
      await sdk.admin.product.updateVariant(data.product_id, data.id, {
        metadata: {
          ...data.metadata,
          product: {
            weight: formData.weight ? parseFloat(formData.weight) : null,
            length: formData.length ? parseFloat(formData.length) : null,
            height: formData.height ? parseFloat(formData.height) : null,
            width: formData.width ? parseFloat(formData.width) : null,
          },
        },
      });
      setVariantData(formData);
      setIsDrawerOpen(false);
    } catch (error) {
      console.error("Error updating variant attributes:", error);
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Product Attributes</Heading>
        <IconButton size="small" variant={"transparent"} onClick={handleEdit}>
          <EllipsisHorizontal />
        </IconButton>
      </div>
      <SectionRow title="Width" value={`${variantData.width} cm`} />
      <SectionRow title="Length" value={`${variantData.length} cm`} />
      <SectionRow title="Height" value={`${variantData.height} cm`} />
      <SectionRow title="Weight" value={`${variantData.weight} kg`} />

      {/* Drawer for editing */}
      <Drawer open={isDrawerOpen} onOpenChange={handleCloseDrawer}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Edit Product Attributes</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <form onSubmit={handleSubmit}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="Weight in kg"
                    className={errors.weight ? "border-red-500" : ""}
                  />
                  {errors.weight && (
                    <Text size="small" className="mt-1 text-red-500">
                      Must be a positive number
                    </Text>
                  )}
                </div>
                <div>
                  <Label htmlFor="length">Length (cm)</Label>
                  <Input
                    id="length"
                    type="number"
                    name="length"
                    value={formData.length}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="Length in centimeters"
                    className={errors.length ? "border-red-500" : ""}
                  />
                  {errors.length && (
                    <Text size="small" className="mt-1 text-red-500">
                      Must be a positive number
                    </Text>
                  )}
                </div>
                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="Height in centimeters"
                    className={errors.height ? "border-red-500" : ""}
                  />
                  {errors.height && (
                    <Text size="small" className="mt-1 text-red-500">
                      Must be a positive number
                    </Text>
                  )}
                </div>
                <div>
                  <Label htmlFor="width">Width (cm)</Label>
                  <Input
                    id="width"
                    type="number"
                    name="width"
                    value={formData.width}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="Width in centimeters"
                    className={errors.width ? "border-red-500" : ""}
                  />
                  {errors.width && (
                    <Text size="small" className="mt-1 text-red-500">
                      Must be a positive number
                    </Text>
                  )}
                </div>
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

export default VariantAttributesWidget;
