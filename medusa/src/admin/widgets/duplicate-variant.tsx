import { useState, useRef, useEffect } from "react";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import {
  Button,
  Text,
  Alert,
  Input,
  FocusModal,
  Container,
} from "@medusajs/ui";
import {
  DetailWidgetProps,
  AdminProductVariant,
} from "@medusajs/framework/types";
import { sdk } from "../lib/sdk";

const DuplicateVariantWidget = ({
  data,
}: DetailWidgetProps<AdminProductVariant>) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [option, setOption] = useState("");
  const [sku, setSku] = useState("");
  const [newVariantUrl, setNewVariantUrl] = useState<string | null>(null);
  const optionRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && optionRef.current) {
      optionRef.current.focus();
    }
  }, [open]);

  const handleDuplicate = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    if (!data.product_id || !data.id) return;
    const productVariant = await sdk.admin.product.retrieveVariant(
      data.product_id,
      data.id
    );
    try {
      const response = await fetch("/admin/variant-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variant: productVariant.variant,
          option,
          sku,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        setError(err.message || "Error duplicating variant");
        setLoading(false);
        return;
      }
      const res = await response.json();
      setSuccess("Variant duplicated successfully!");
      setNewVariantUrl(
        `/app/products/${res.variant.product_id}/variants/${res.variant.id}`
      );
      setOption("");
      setSku("");
    } catch (e) {
      setError("Unexpected error duplicating variant");
    } finally {
      setLoading(false);
    }
  };

  const isOptionValid = option.trim().length > 0;
  const isSkuValid = sku.trim().length > 0;

  return (
    <Container className="p-6 rounded-lg shadow-md border max-w-md mx-auto">
      <Button
        variant="primary"
        isLoading={loading}
        onClick={() => {
          setOpen(true);
          setSuccess(null);
          setError(null);
          setOption("");
          setSku("");
          setNewVariantUrl(null);
        }}
        className="w-full mb-2"
      >
        Duplicate Variant
      </Button>
      <FocusModal open={open} onOpenChange={setOpen}>
        <FocusModal.Content>
          <FocusModal.Header>
            <FocusModal.Title className="text-lg font-semibold">
              Duplicate Variant
            </FocusModal.Title>
            <Text size="small" color="secondary" className="mt-1">
              Enter a new option name and SKU for the duplicated variant. All
              other data will be copied.
            </Text>
          </FocusModal.Header>
          <FocusModal.Body className="px-8 pb-8 pt-2">
            {success ? (
              <div className="flex flex-col items-center gap-6 py-8">
                <Alert variant="success" className="w-full text-center">
                  {success}
                </Alert>
                {newVariantUrl && (
                  <Button
                    variant="primary"
                    onClick={() => window.location.assign(newVariantUrl)}
                    className="w-full"
                  >
                    Go to new variant
                  </Button>
                )}
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleDuplicate();
                }}
                className="flex flex-col gap-6"
              >
                <div>
                  <label
                    htmlFor="option"
                    className="block text-sm font-medium mb-2"
                  >
                    New Option Name
                  </label>
                  <Input
                    id="option"
                    ref={optionRef}
                    placeholder="Enter new option name"
                    value={option}
                    onChange={(e) => setOption(e.target.value)}
                    required
                    className={
                      "w-full " +
                      (!isOptionValid && option.length > 0
                        ? "border-red-500"
                        : "")
                    }
                  />
                  {!isOptionValid && option.length > 0 && (
                    <Text size="xsmall" color="danger" className="mt-1">
                      Option name is required
                    </Text>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="sku"
                    className="block text-sm font-medium mb-2"
                  >
                    New SKU
                  </label>
                  <Input
                    id="sku"
                    placeholder="Enter new SKU"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                    className={
                      "w-full " +
                      (!isSkuValid && sku.length > 0 ? "border-red-500" : "")
                    }
                  />
                  {!isSkuValid && sku.length > 0 && (
                    <Text size="xsmall" color="danger" className="mt-1">
                      SKU is required
                    </Text>
                  )}
                </div>
                {error && (
                  <Alert variant="error" className="mt-2 w-full text-center">
                    {error}
                  </Alert>
                )}
                <div className="flex gap-3 justify-end mt-4">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                    className="min-w-[100px]"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    isLoading={loading}
                    type="submit"
                    disabled={!isOptionValid || !isSkuValid}
                    className="min-w-[120px]"
                  >
                    Duplicate
                  </Button>
                </div>
              </form>
            )}
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>
      <Alert variant="info" className="mt-4">
        <Text size="small" className="font-semibold block mb-1">
          What does this do?
        </Text>
        <Text size="small">
          This will create a new variant with the same data, but you can set a
          new option name and SKU.
        </Text>
      </Alert>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product_variant.details.side.before",
});

export default DuplicateVariantWidget;
