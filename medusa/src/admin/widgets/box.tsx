import React, { useState } from "react";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import {
  Input,
  Label,
  Button,
  Drawer,
  Heading,
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

interface VariantAttributes {
  length: string;
  width: string;
  height: string;
  weight: string;
}

const AttributeVariantsWidget = ({
  data,
}: DetailWidgetProps<AdminProductVariant>) => {
  const [attributes, setAttributes] = useState<VariantAttributes>({
    length: (data.metadata?.box as any)?.length || "-",
    width: (data.metadata?.box as any)?.width || "-",
    height: (data.metadata?.box as any)?.height || "-",
    weight: (data.metadata?.box as any)?.weight || "-",
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    length: "",
    width: "",
    height: "",
    weight: "",
  });

  const handleEdit = () => {
    setFormData({
      length: attributes.length,
      width: attributes.width,
      height: attributes.height,
      weight: attributes.weight,
    });
    setIsDrawerOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.product_id || !data.id) return;
    const productVariant = await sdk.admin.product.retrieveVariant(
      data.product_id,
      data.id
    );
    setAttributes(formData);
    await sdk.admin.product.updateVariant(data.product_id, data.id, {
      metadata: {
        ...productVariant.variant.metadata,
        box: {
          length: formData.length,
          width: formData.width,
          height: formData.height,
          weight: formData.weight,
        },
      },
    });
    setIsDrawerOpen(false);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Box Dimensions</Heading>
        <IconButton size="small" variant={"transparent"} onClick={handleEdit}>
          <EllipsisHorizontal />
        </IconButton>
      </div>
      <SectionRow title="Length" value={`${attributes.length} cm`} />
      <SectionRow title="Width" value={`${attributes.width} cm`} />
      <SectionRow title="Height" value={`${attributes.height} cm`} />
      <SectionRow title="Weight" value={`${attributes.weight} kg`} />

      {/* Drawer for editing */}
      <Drawer open={isDrawerOpen} onOpenChange={handleCloseDrawer}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Edit Box Dimensions</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <form onSubmit={handleSubmit}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div>
                  <Label htmlFor="length">Length (cm)</Label>
                  <Input
                    id="length"
                    type="number"
                    name="length"
                    value={formData.length}
                    onChange={handleChange}
                    min="0"
                    step="any"
                    required
                    placeholder="Enter length"
                  />
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
                    step="any"
                    required
                    placeholder="Enter width"
                  />
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
                    step="any"
                    required
                    placeholder="Enter height"
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    min="0"
                    step="any"
                    required
                    placeholder="Enter weight"
                  />
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

export default AttributeVariantsWidget;
