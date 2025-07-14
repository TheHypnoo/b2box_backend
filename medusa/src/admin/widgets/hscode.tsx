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
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types";
import SectionRow from "../components/SectionRow";

const HscodeWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const [hscodeData, setHscodeData] = useState({
    hscode_general: (data.metadata?.hscode_general as string | undefined) || "",
    hscode_colombia:
      (data.metadata?.hscode_colombia as string | undefined) || "",
    ncm_argentina: (data.metadata?.ncm_argentina as string | undefined) || "",
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    hscode_general: "",
    hscode_colombia: "",
    ncm_argentina: "",
  });

  const [errors, setErrors] = useState({
    hscode_general: false,
    hscode_colombia: false,
    ncm_argentina: false,
  });

  const handleEdit = () => {
    setFormData({
      hscode_general: hscodeData.hscode_general,
      hscode_colombia: hscodeData.hscode_colombia,
      ncm_argentina: hscodeData.ncm_argentina,
    });
    setErrors({
      hscode_general: false,
      hscode_colombia: false,
      ncm_argentina: false,
    });
    setIsDrawerOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate in real-time
    let isValid = false;
    switch (name) {
      case "hscode_general":
        isValid = validateHscodeGeneral(value);
        break;
      case "hscode_colombia":
        isValid = validateHscodeColombia(value);
        break;
      case "ncm_argentina":
        isValid = validateNcmArgentina(value);
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: !isValid && value !== "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.id) return;

    // Validate all fields before submitting
    const newErrors = {
      hscode_general:
        !validateHscodeGeneral(formData.hscode_general) &&
        formData.hscode_general !== "",
      hscode_colombia:
        !validateHscodeColombia(formData.hscode_colombia) &&
        formData.hscode_colombia !== "",
      ncm_argentina:
        !validateNcmArgentina(formData.ncm_argentina) &&
        formData.ncm_argentina !== "",
    };

    setErrors(newErrors);

    // Check if there are any errors
    if (Object.values(newErrors).some((error) => error)) {
      return;
    }

    try {
      await sdk.admin.product.update(data.id, {
        metadata: {
          ...data.metadata,
          hscode_general: formData.hscode_general,
          hscode_colombia: formData.hscode_colombia,
          ncm_argentina: formData.ncm_argentina,
        },
      });
      setHscodeData(formData);
      setIsDrawerOpen(false);
    } catch (error) {
      console.error("Error updating HSCODE fields:", error);
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  // Validation functions
  function validateHscodeGeneral(value: string): boolean {
    if (!value) return true;
    const regex = /^\d{4}\.\d{2}$/;
    return regex.test(value);
  }
  function validateHscodeColombia(value: string): boolean {
    if (!value) return true;
    const regex = /^\d{4}\.\d{2}\.\d{2}\.\d{2}$/;
    return regex.test(value);
  }
  function validateNcmArgentina(value: string): boolean {
    if (!value) return true;
    const regex = /^\d{4}\.\d{4}$/;
    return regex.test(value);
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Classification Codes</Heading>
        <IconButton size="small" variant={"transparent"} onClick={handleEdit}>
          <EllipsisHorizontal />
        </IconButton>
      </div>
      <SectionRow title="HSCODE General" value={hscodeData.hscode_general} />
      <SectionRow title="HSCODE Colombia" value={hscodeData.hscode_colombia} />
      <SectionRow title="NCM Argentina" value={hscodeData.ncm_argentina} />

      {/* Drawer for editing */}
      <Drawer open={isDrawerOpen} onOpenChange={handleCloseDrawer}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Edit Classification Codes</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <form onSubmit={handleSubmit}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div>
                  <Label htmlFor="hscode_general">HSCODE General</Label>
                  <Input
                    id="hscode_general"
                    type="number"
                    name="hscode_general"
                    value={formData.hscode_general}
                    onChange={handleChange}
                    placeholder="E.g. 3926.90"
                    className={errors.hscode_general ? "border-red-500" : ""}
                  />
                  {errors.hscode_general && (
                    <Text size="small" className="mt-1 text-red-500">
                      Invalid format. Use: 3926.90
                    </Text>
                  )}
                </div>
                <div>
                  <Label htmlFor="hscode_colombia">HSCODE Colombia</Label>
                  <Input
                    id="hscode_colombia"
                    type="number"
                    name="hscode_colombia"
                    value={formData.hscode_colombia}
                    onChange={handleChange}
                    placeholder="E.g. 3926.90.90.00"
                    className={errors.hscode_colombia ? "border-red-500" : ""}
                  />
                  {errors.hscode_colombia && (
                    <Text size="small" className="mt-1 text-red-500">
                      Invalid format. Use: 3926.90.90.00
                    </Text>
                  )}
                </div>
                <div>
                  <Label htmlFor="ncm_argentina">NCM Argentina</Label>
                  <Input
                    id="ncm_argentina"
                    type="number"
                    name="ncm_argentina"
                    value={formData.ncm_argentina}
                    onChange={handleChange}
                    placeholder="E.g. 3926.9010"
                    className={errors.ncm_argentina ? "border-red-500" : ""}
                  />
                  {errors.ncm_argentina && (
                    <Text size="small" className="mt-1 text-red-500">
                      Invalid format. Use: 3926.9010
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
  zone: "product.details.side.before",
});

export default HscodeWidget;
