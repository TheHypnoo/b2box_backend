import React, { useState } from "react";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Switch, Heading, Text, Container } from "@medusajs/ui";
import { sdk } from "../lib/sdk";
import {
  DetailWidgetProps,
  AdminProductVariant,
} from "@medusajs/framework/types";

const SectionRow = ({
  title,
  value,
}: {
  title: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-center justify-between px-6 py-4">
    <Text size="small" color="secondary">
      {title}
    </Text>
    <div>{value}</div>
  </div>
);

const ExtrasWidget = ({ data }: DetailWidgetProps<AdminProductVariant>) => {
  const [hasBattery, setHasBattery] = useState(
    Boolean(data.metadata?.has_battery)
  );
  const [isClothing, setIsClothing] = useState(
    Boolean(data.metadata?.is_clothing)
  );

  const handleBatteryToggle = async (checked: boolean) => {
    if (!data.product_id || !data.id) return;
    setHasBattery(checked);

    try {
      await sdk.admin.product.updateVariant(data.product_id, data.id, {
        metadata: {
          ...data.metadata,
          has_battery: checked,
        },
      });
    } catch (error) {
      console.error("Error al actualizar el estado de batería:", error);
    }
  };

  const handleClothingToggle = async (checked: boolean) => {
    if (!data.product_id || !data.id) return;
    setIsClothing(checked);

    try {
      await sdk.admin.product.updateVariant(data.product_id, data.id, {
        metadata: {
          ...data.metadata,
          is_clothing: checked,
        },
      });
    } catch (error) {
      console.error("Error al actualizar el estado de ropa:", error);
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Extras</Heading>
      </div>
      <SectionRow
        title="Batería"
        value={
          <Switch checked={hasBattery} onCheckedChange={handleBatteryToggle} />
        }
      />
      <SectionRow
        title="Ropa"
        value={
          <Switch checked={isClothing} onCheckedChange={handleClothingToggle} />
        }
      />
    </Container>
  );
};

// The widget's configurations
export const config = defineWidgetConfig({
  zone: "product_variant.details.side.after",
});

export default ExtrasWidget;
