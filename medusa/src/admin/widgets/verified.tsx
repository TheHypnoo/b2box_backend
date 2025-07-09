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

const VerifiedWidget = ({ data }: DetailWidgetProps<AdminProductVariant>) => {
  const [isVerified, setIsVerified] = useState(
    Boolean(data.metadata?.b2box_verified)
  );

  const handleToggle = async (checked: boolean) => {
    if (!data.id) return;
    setIsVerified(checked);

    try {
      await sdk.admin.product.update(data.id, {
        metadata: {
          ...data.metadata,
          b2box_verified: checked,
        },
      });
    } catch (error) {
      console.error("Error al actualizar el estado de verificación:", error);
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">B2BOX VERIFIED</Heading>
      </div>
      <SectionRow
        title="Verificado"
        value={<Switch checked={isVerified} onCheckedChange={handleToggle} />}
      />
    </Container>
  );
};

// The widget's configurations
export const config = defineWidgetConfig({
  zone: "product.details.side.after",
});

export default VerifiedWidget;
