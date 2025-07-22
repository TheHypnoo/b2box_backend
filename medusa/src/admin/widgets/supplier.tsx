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
  AdminProduct,
} from "@medusajs/framework/types";
import SectionRow from "../components/SectionRow";

const SupplierWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const [supplierData, setSupplierData] = useState({
    link: (data.metadata?.supplier as any)?.link || "-",
    size_model: (data.metadata?.supplier as any)?.size_model || "-",
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    link: "",
    size_model: "",
  });

  const handleEdit = () => {
    setFormData({
      link: supplierData.link === "-" ? "" : supplierData.link,
      size_model: supplierData.size_model === "-" ? "" : supplierData.size_model,
    });
    setIsDrawerOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.id) return;
    try {
      const product = await sdk.admin.product.retrieve(data.id);
      await sdk.admin.product.update(data.id, {
        metadata: {
          ...product.product.metadata,
          supplier: {
            link: formData.link,
            size_model: formData.size_model,
          },
        },
      });
      setSupplierData({
        link: formData.link || "-",
        size_model: formData.size_model || "-",
      });
      setIsDrawerOpen(false);
    } catch (error) {
      console.error("Error updating supplier info:", error);
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Supplier Info</Heading>
        <IconButton size="small" variant={"transparent"} onClick={handleEdit}>
          <EllipsisHorizontal />
        </IconButton>
      </div>
      <SectionRow title="Supplier Link" value={supplierData.link} />
      <SectionRow title="Supplier Size/Model" value={supplierData.size_model} />

      {/* Drawer for editing */}
      <Drawer open={isDrawerOpen} onOpenChange={handleCloseDrawer}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Edit Supplier Info</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <Label htmlFor="link">Supplier Link</Label>
                  <Input
                    id="link"
                    type="text"
                    name="link"
                    value={formData.link}
                    onChange={handleChange}
                    placeholder="Enter supplier link"
                  />
                </div>
                <div>
                  <Label htmlFor="size_model">Supplier Size/Model</Label>
                  <Input
                    id="size_model"
                    type="text"
                    name="size_model"
                    value={formData.size_model}
                    onChange={handleChange}
                    placeholder="Enter supplier size/model"
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
  zone: "product.details.side.before",
});

export default SupplierWidget;