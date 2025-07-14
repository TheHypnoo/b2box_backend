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
  Switch,
} from "@medusajs/ui";
import { EllipsisHorizontal } from "@medusajs/icons";
import { sdk } from "../lib/sdk";
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types";
import SectionRow from "../components/SectionRow";

const SettingsWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const [bxCode, setBxCode] = useState(
    (data.metadata?.bx_code as string | undefined) || ""
  );
  const [isVerified, setIsVerified] = useState(
    Boolean(data.metadata?.b2box_verified)
  );

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    bx_code: "",
  });

  const handleEdit = () => {
    setFormData({
      bx_code: bxCode,
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
      await sdk.admin.product.update(data.id, {
        metadata: {
          ...data.metadata,
          bx_code: formData.bx_code,
        },
      });
      setBxCode(formData.bx_code);
      setIsDrawerOpen(false);
    } catch (error) {
      console.error("Error updating BX code:", error);
    }
  };

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
      console.error("Error updating verification state:", error);
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">B2BOX Settings</Heading>
        <IconButton size="small" variant={"transparent"} onClick={handleEdit}>
          <EllipsisHorizontal />
        </IconButton>
      </div>
      <SectionRow title="BX Code" value={bxCode} />
      <SectionRow
        title="Verified"
        value={<Switch checked={isVerified} onCheckedChange={handleToggle} />}
      />

      {/* Drawer for editing BX Code */}
      <Drawer open={isDrawerOpen} onOpenChange={handleCloseDrawer}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Edit BX Code</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <form onSubmit={handleSubmit}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div>
                  <Label htmlFor="bx_code">BX Code</Label>
                  <Input
                    id="bx_code"
                    type="text"
                    name="bx_code"
                    value={formData.bx_code}
                    onChange={handleChange}
                    placeholder="Enter the BX code"
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

export default SettingsWidget;
