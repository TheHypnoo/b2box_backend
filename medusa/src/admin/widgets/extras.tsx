import { useState } from "react";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Switch, Heading, Container } from "@medusajs/ui";
import { sdk } from "../lib/sdk";
import {
  DetailWidgetProps,
  AdminProductVariant,
} from "@medusajs/framework/types";
import SectionRow from "../components/SectionRow";

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
      console.error("Error updating battery state:", error);
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
      console.error("Error updating clothing state:", error);
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Extras</Heading>
      </div>
      <SectionRow
        title="Battery"
        value={
          <Switch checked={hasBattery} onCheckedChange={handleBatteryToggle} />
        }
      />
      <SectionRow
        title="Clothing"
        value={
          <Switch checked={isClothing} onCheckedChange={handleClothingToggle} />
        }
      />
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product_variant.details.side.before",
});

export default ExtrasWidget;
