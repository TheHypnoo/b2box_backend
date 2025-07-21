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

const PcsCbmWidget = ({ data }: DetailWidgetProps<AdminProductVariant>) => {
  const [attributes, setAttributes] = useState({
    pcs_ctn: (data.metadata?.pcs_ctn as string | undefined) || "-",
    cbm_ctn: (data.metadata?.cbm_ctn as string | undefined) || "-",
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    pcs_ctn: "",
    cbm_ctn: "",
  });

  const [errors, setErrors] = useState({
    pcs_ctn: false,
    cbm_ctn: false,
  });

  const handleEdit = () => {
    setFormData({
      pcs_ctn: attributes.pcs_ctn,
      cbm_ctn: attributes.cbm_ctn,
    });
    setErrors({
      pcs_ctn: false,
      cbm_ctn: false,
    });
    setIsDrawerOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate in real-time
    let isValid = true;
    if (value !== "") {
      if (name === "pcs_ctn") {
        isValid = /^\d+$/.test(value) && parseInt(value) > 0;
      } else if (name === "cbm_ctn") {
        isValid = /^\d+(\.\d{1,3})?$/.test(value) && parseFloat(value) > 0;
      }
    }

    setErrors((prev) => ({ ...prev, [name]: !isValid }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.product_id || !data.id) return;

    const newErrors = {
      pcs_ctn:
        formData.pcs_ctn !== "" &&
        (!/^\d+$/.test(formData.pcs_ctn) || parseInt(formData.pcs_ctn) <= 0),
      cbm_ctn:
        formData.cbm_ctn !== "" &&
        (!/^\d+(\.\d{1,3})?$/.test(formData.cbm_ctn) ||
          parseFloat(formData.cbm_ctn) <= 0),
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
          pcs_ctn: formData.pcs_ctn,
          cbm_ctn: formData.cbm_ctn,
        },
      });
      setAttributes(formData);
      setIsDrawerOpen(false);
    } catch (error) {
      console.error("Error updating PCS/CBM attributes:", error);
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Packaging Attributes</Heading>
        <IconButton size="small" variant={"transparent"} onClick={handleEdit}>
          <EllipsisHorizontal />
        </IconButton>
      </div>
      <SectionRow title="PCS/CTN" value={attributes.pcs_ctn} />
      <SectionRow title="CBM/CTN" value={attributes.cbm_ctn} />

      {/* Drawer for editing */}
      <Drawer open={isDrawerOpen} onOpenChange={handleCloseDrawer}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Edit Packaging Attributes</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <form onSubmit={handleSubmit}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div>
                  <Label htmlFor="pcs_ctn">PCS/CTN</Label>
                  <Input
                    id="pcs_ctn"
                    type="number"
                    name="pcs_ctn"
                    value={formData.pcs_ctn}
                    onChange={handleChange}
                    min="1"
                    step="1"
                    placeholder="E.g. 12"
                    className={errors.pcs_ctn ? "border-red-500" : ""}
                  />
                  {errors.pcs_ctn && (
                    <Text size="small" className="mt-1 text-red-500">
                      Must be a positive integer
                    </Text>
                  )}
                </div>
                <div>
                  <Label htmlFor="cbm_ctn">CBM/CTN</Label>
                  <Input
                    id="cbm_ctn"
                    type="number"
                    name="cbm_ctn"
                    value={formData.cbm_ctn}
                    onChange={handleChange}
                    min="0.001"
                    step="0.001"
                    placeholder="E.g. 0.045"
                    className={errors.cbm_ctn ? "border-red-500" : ""}
                  />
                  {errors.cbm_ctn && (
                    <Text size="small" className="mt-1 text-red-500">
                      Must be a positive decimal (up to 3 decimals)
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

export default PcsCbmWidget;
