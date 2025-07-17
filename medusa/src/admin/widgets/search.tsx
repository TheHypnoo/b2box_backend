import { useState, useEffect, useRef } from "react";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Input, Container, Heading, Text, Badge } from "@medusajs/ui";

interface SearchResult {
  id: string; // product id (for products) or variant id (for variants)
  title: string;
  product_id?: string; // only present for variants
  type: "product" | "variant";
  sku?: string;
}

const LIMIT = 20;

const SearchWidget = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [tooMany, setTooMany] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setTooMany(false);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const search = async () => {
        let url = "";
        if (query.toUpperCase().startsWith("BX")) {
          url = `/admin/search?bxCode=${query}`;
        } else if (query.toUpperCase().startsWith("PA")) {
          url = `/admin/search?sku=${query}`;
        } else {
          url = `/admin/search?bxCode=${query}&sku=${query}`;
        }
        const response = await fetch(url);
        const data = await response.json();
        setResults(data.products);
        setTooMany(data.products && data.products.length === LIMIT);
      };
      search();
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  return (
    <Container className="divide-y p-0 w-full max-w-md">
      <div className="px-6 py-4">
        <Heading level="h2">Product Quick Search</Heading>
        <Input
          className="mt-4"
          placeholder="Search by BXCODE or SKU"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && results.length === 0 && (
          <Text size="small" color="secondary" className="mt-4 block">
            No products found.
          </Text>
        )}
        {results.length > 0 && (
          <div className="mt-4 max-h-80 overflow-y-auto">
            <ul className="space-y-2">
              {results.map((product) => {
                const isVariant = product.type === "variant";
                const key = isVariant
                  ? `${product.product_id}-${product.id}`
                  : product.id;
                const goToUrl = isVariant
                  ? `/app/products/${product.product_id}/variants/${product.id}`
                  : `/app/products/${product.id}`;
                return (
                  <li
                    key={key}
                    className="border rounded-lg p-4 flex flex-col gap-1 bg-ui-bg-base cursor-pointer hover:bg-ui-bg-base-hover transition-colors"
                    onClick={() => window.location.assign(goToUrl)}
                  >
                    <span className="font-semibold">{product.title}</span>
                    <div className="flex gap-2 mt-1 items-center">
                      {isVariant && <Badge color="green">Variant</Badge>}
                      {!isVariant && <Badge color="blue">Product</Badge>}
                    </div>
                  </li>
                );
              })}
            </ul>
            {tooMany && (
              <Text size="small" color="secondary" className="mt-2 block">
                Showing first {LIMIT} results. Please refine your search.
              </Text>
            )}
          </div>
        )}
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.list.before",
});

export default SearchWidget;
