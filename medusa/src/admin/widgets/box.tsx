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

interface VariantAttributes {
  box_width: string;
  box_length: string;
  box_height: string;
  box_weight: string;
}

const SectionRow = ({ title, value }: { title: string; value: string }) => (
  <div className="flex items-center justify-between px-6 py-4">
    <Text size="small" color="secondary">
      {title}
    </Text>
    <Text size="small">{value || "—"}</Text>
  </div>
);

const AttributeVariantsWidget = ({
  data,
}: DetailWidgetProps<AdminProductVariant>) => {
  const [attributes, setAttributes] = useState<VariantAttributes>({
    box_width: (data.metadata?.box_width as string | undefined) || "-",
    box_length: (data.metadata?.box_length as string | undefined) || "-",
    box_height: (data.metadata?.box_height as string | undefined) || "-",
    box_weight: (data.metadata?.box_weight as string | undefined) || "-",
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    box_width: "",
    box_length: "",
    box_height: "",
    box_weight: "",
  });

  const handleEdit = () => {
    setFormData({
      box_width: attributes.box_width,
      box_length: attributes.box_length,
      box_height: attributes.box_height,
      box_weight: attributes.box_weight,
    });
    setIsDrawerOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.product_id || !data.id) return;
    setAttributes(formData);
    sdk.admin.product.updateVariant(data.product_id, data.id, {
      metadata: {
        ...data.metadata,
        ...formData,
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
        <Heading level="h2">Dimensiones de la Caja</Heading>
        <IconButton size="small" variant={"transparent"} onClick={handleEdit}>
          <EllipsisHorizontal />
        </IconButton>
      </div>
      <SectionRow title="Ancho" value={`${attributes.box_width} cm`} />
      <SectionRow title="Largo" value={`${attributes.box_length} cm`} />
      <SectionRow title="Altura" value={`${attributes.box_height} cm`} />
      <SectionRow title="Peso" value={`${attributes.box_weight} kg`} />

      {/* Drawer for editing */}
      <Drawer open={isDrawerOpen} onOpenChange={handleCloseDrawer}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Editar Dimensiones de la Caja</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <form onSubmit={handleSubmit}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div>
                  <Label htmlFor="width">Ancho (cm)</Label>
                  <Input
                    id="width"
                    type="number"
                    name="box_width"
                    value={formData.box_width}
                    onChange={handleChange}
                    min="0"
                    step="any"
                    required
                    placeholder="Introduce el ancho"
                  />
                </div>
                <div>
                  <Label htmlFor="length">Largo (cm)</Label>
                  <Input
                    id="length"
                    type="number"
                    name="box_length"
                    value={formData.box_length}
                    onChange={handleChange}
                    min="0"
                    step="any"
                    required
                    placeholder="Introduce el largo"
                  />
                </div>
                <div>
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    name="box_height"
                    value={formData.box_height}
                    onChange={handleChange}
                    min="0"
                    step="any"
                    required
                    placeholder="Introduce la altura"
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    name="box_weight"
                    value={formData.box_weight}
                    onChange={handleChange}
                    min="0"
                    step="any"
                    required
                    placeholder="Introduce el peso"
                  />
                </div>
              </div>
            </form>
          </Drawer.Body>
          <Drawer.Footer>
            <Button variant="secondary" onClick={handleCloseDrawer}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              Guardar cambios
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </Container>
  );
};

// The widget's configurations
export const config = defineWidgetConfig({
  zone: "product_variant.details.side.after",
});

export default AttributeVariantsWidget;
