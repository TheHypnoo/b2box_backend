import React, { useState } from "react";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import {
  Button,
  Drawer,
  Heading,
  Container,
  IconButton,
  Label,
} from "@medusajs/ui";
import { EllipsisHorizontal } from "@medusajs/icons";
import { sdk } from "../lib/sdk";
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types";
import SectionRow from "../components/SectionRow";

const AGENTS = ["Jessica", "Kerwin"];

const AgentWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const [agent, setAgent] = useState((data.metadata?.agent as string) || "-");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selected, setSelected] = useState(agent !== "-" ? agent : "Jessica");

  const handleEdit = () => {
    setSelected(agent !== "-" ? agent : "Jessica");
    setIsDrawerOpen(true);
  };

  const handleChange = (value: string) => {
    setSelected(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.id) return;
    try {
      const product = await sdk.admin.product.retrieve(data.id);
      await sdk.admin.product.update(data.id, {
        metadata: {
          ...product.product.metadata,
          agent: selected,
        },
      });
      setAgent(selected);
      setIsDrawerOpen(false);
    } catch (error) {
      console.error("Error updating agent:", error);
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">AGENT</Heading>
        <IconButton size="small" variant={"transparent"} onClick={handleEdit}>
          <EllipsisHorizontal />
        </IconButton>
      </div>
      <SectionRow title="Product Agent" value={agent} />

      {/* Drawer for editing */}
      <Drawer open={isDrawerOpen} onOpenChange={handleCloseDrawer}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Select Agent</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <form onSubmit={handleSubmit}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {AGENTS.map((a) => (
                  <div key={a} className="flex items-center gap-2">
                    <input
                      id={a}
                      type="radio"
                      name="agent"
                      checked={selected === a}
                      onChange={() => handleChange(a)}
                      className="accent-blue-600 w-4 h-4"
                    />
                    <Label htmlFor={a}>{a}</Label>
                  </div>
                ))}
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

export default AgentWidget;
