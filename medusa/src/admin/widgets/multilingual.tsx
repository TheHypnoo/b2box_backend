import React, { useState, useEffect } from "react";
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
  Textarea,
  Badge,
  usePrompt,
} from "@medusajs/ui";
import { EllipsisHorizontal, ChevronDown, ChevronRight } from "@medusajs/icons";
import { sdk } from "../lib/sdk";
import {
  DetailWidgetProps,
  AdminProduct,
  AdminRegion,
} from "@medusajs/framework/types";
import { getCountryFlag } from "../lib/flags";
import { ContentByLanguage } from "../types";

const MultilingualWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const [multilingualData, setMultilingualData] = useState<ContentByLanguage>(
    (data.metadata?.multilingual as ContentByLanguage) || {}
  );

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formData, setFormData] = useState<ContentByLanguage>({});
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [regions, setRegions] = useState<AdminRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLanguages, setExpandedLanguages] = useState<Set<string>>(
    new Set()
  );
  const [expandedEditLanguages, setExpandedEditLanguages] = useState<
    Set<string>
  >(new Set());

  const dialog = usePrompt();

  // Load regions on component mount
  useEffect(() => {
    const loadRegions = async () => {
      try {
        const response = await sdk.admin.region.list();
        setRegions(response.regions || []);
      } catch (error) {
        console.error("Error loading regions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRegions();
  }, []);

  const handleEdit = () => {
    setFormData(multilingualData);
    setSelectedLanguages(Object.keys(multilingualData));
    setIsDrawerOpen(true);
  };

  const handleLanguageSelect = async (countryCode: string) => {
    // If language is already selected, check if it has content before deselecting
    if (selectedLanguages.includes(countryCode)) {
      const hasContent =
        formData[countryCode]?.title || formData[countryCode]?.description;
      if (hasContent) {
        const result = await dialog({
          title: "Remove Language",
          description: `Are you sure you want to remove ${getLanguageName(
            countryCode
          )}? All content for this language will be lost.`,
          confirmText: "Remove",
          cancelText: "Cancel",
        });

        if (result) {
          // Remove the language from selected languages
          setSelectedLanguages((prev) =>
            prev.filter((lang) => lang !== countryCode)
          );
          // Remove the language data from formData
          setFormData((prev) => {
            const newData = { ...prev };
            delete newData[countryCode];
            return newData;
          });
        }
        return;
      } else {
        // If no content, directly remove the language
        setSelectedLanguages((prev) =>
          prev.filter((lang) => lang !== countryCode)
        );
        setFormData((prev) => {
          const newData = { ...prev };
          delete newData[countryCode];
          return newData;
        });
        return;
      }
    }

    // If not selected, add the language
    setSelectedLanguages((prev) => [...prev, countryCode]);

    if (!formData[countryCode]) {
      setFormData((prev) => ({
        ...prev,
        [countryCode]: {
          title: "",
          description: "",
        },
      }));
    }
  };

  const handleInputChange = (
    languageCode: string,
    field: "title" | "description",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [languageCode]: {
        ...prev[languageCode],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.id) return;

    try {
      await sdk.admin.product.update(data.id, {
        metadata: {
          ...data.metadata,
          multilingual: formData,
        },
      });
      setMultilingualData(formData);
      setIsDrawerOpen(false);
      setSelectedLanguages([]);
    } catch (error) {
      console.error("Error updating multilingual data:", error);
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedLanguages([]);
    setExpandedEditLanguages(new Set());
  };

  const getLanguageName = (countryCode: string) => {
    // Find the country by iso_2 code
    for (const region of regions) {
      const country = region.countries?.find(
        (country) => country.iso_2 === countryCode
      );
      if (country) {
        return country.display_name;
      }
    }
    return countryCode;
  };

  const toggleLanguageExpansion = (languageCode: string) => {
    setExpandedLanguages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(languageCode)) {
        newSet.delete(languageCode);
      } else {
        // Only allow one language expanded at a time
        newSet.clear();
        newSet.add(languageCode);
      }
      return newSet;
    });
  };

  const toggleEditLanguageExpansion = (languageCode: string) => {
    setExpandedEditLanguages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(languageCode)) {
        newSet.delete(languageCode);
      } else {
        newSet.add(languageCode);
      }
      return newSet;
    });
  };

  const getContentSummary = (content: {
    title?: string;
    description?: string;
  }) => {
    const hasTitle = !!content.title;
    const hasDescription = !!content.description;

    if (hasTitle && hasDescription) {
      return "Title + Desc";
    } else if (hasTitle) {
      return "Title";
    } else if (hasDescription) {
      return "Description";
    } else {
      return "Empty";
    }
  };

  const hasContent = (content: { title?: string; description?: string }) => {
    return !!(content.title || content.description);
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Multilingual Content</Heading>
        <IconButton size="small" variant="transparent" onClick={handleEdit}>
          <EllipsisHorizontal />
        </IconButton>
      </div>

      {Object.keys(multilingualData).length === 0 ? (
        <div className="px-6 py-4">
          <Text size="small" color="secondary">
            No multilingual content configured. Click edit to add translations.
          </Text>
        </div>
      ) : (
        <div className="px-6 py-4">
          <div className="space-y-2">
            {Object.entries(multilingualData).map(([languageCode, content]) => {
              const contentExists = hasContent(content);
              return (
                <div key={languageCode} className="border rounded-lg">
                  <div
                    className={`w-full flex items-center justify-between p-4 transition-colors ${
                      contentExists
                        ? "hover:bg-ui-bg-base-hover cursor-pointer"
                        : "opacity-60"
                    }`}
                    onClick={
                      contentExists
                        ? () => toggleLanguageExpansion(languageCode)
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Badge>
                        {getCountryFlag(languageCode)}{" "}
                        {getLanguageName(languageCode)}
                      </Badge>
                      <Text size="small" color="secondary">
                        {getContentSummary(content)}
                      </Text>
                    </div>
                    {contentExists && (
                      <IconButton size="small" variant="transparent">
                        {expandedLanguages.has(languageCode) ? (
                          <ChevronDown />
                        ) : (
                          <ChevronRight />
                        )}
                      </IconButton>
                    )}
                  </div>

                  {expandedLanguages.has(languageCode) && contentExists && (
                    <div className="border-t px-4 py-3 space-y-4">
                      {content.title && (
                        <div>
                          <Text
                            size="base"
                            className="block mb-2 font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400"
                          >
                            Product Title
                          </Text>
                          <Text size="small" className="block">
                            {content.title}
                          </Text>
                        </div>
                      )}
                      {content.description && (
                        <div>
                          <Text
                            size="base"
                            className="block mb-2 font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400"
                          >
                            Product Description
                          </Text>
                          <Text
                            size="small"
                            className="block whitespace-pre-wrap"
                          >
                            {content.description}
                          </Text>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Drawer for editing */}
      <Drawer open={isDrawerOpen} onOpenChange={handleCloseDrawer}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Edit Multilingual Content</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body style={{ overflowY: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Language Selection */}
              <div>
                <Heading level="h3" className="mb-4">
                  Select Languages ({selectedLanguages.length} selected)
                </Heading>
                {loading ? (
                  <Text size="small" color="secondary">
                    Loading countries...
                  </Text>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {regions.flatMap(
                      (region) =>
                        region.countries?.map((country) =>
                          country.iso_2 ? (
                            <Button
                              key={country.iso_2}
                              variant={
                                selectedLanguages.includes(country.iso_2)
                                  ? "primary"
                                  : "secondary"
                              }
                              size="small"
                              onClick={() =>
                                country.iso_2 &&
                                handleLanguageSelect(country.iso_2)
                              }
                              className="justify-start"
                            >
                              <span className="mr-2">
                                {getCountryFlag(country.iso_2)}
                              </span>
                              {country.display_name}
                            </Button>
                          ) : null
                        ) || []
                    )}
                  </div>
                )}
              </div>

              {/* Content Editor for Selected Languages */}
              {selectedLanguages.length > 0 && (
                <div>
                  <Heading level="h3" className="mb-4">
                    Content for Selected Languages ({selectedLanguages.length})
                  </Heading>
                  <div className="space-y-2">
                    {selectedLanguages.map((languageCode) => {
                      const content = formData[languageCode] || {
                        title: "",
                        description: "",
                      };
                      const isExpanded =
                        expandedEditLanguages.has(languageCode);

                      return (
                        <div key={languageCode} className="border rounded-lg">
                          <div
                            className="w-full flex items-center justify-between p-4 hover:bg-ui-bg-base-hover cursor-pointer transition-colors"
                            onClick={() =>
                              toggleEditLanguageExpansion(languageCode)
                            }
                          >
                            <div className="flex items-center gap-3">
                              <Badge>
                                {getCountryFlag(languageCode)}{" "}
                                {getLanguageName(languageCode)}
                              </Badge>
                              <Text size="small" color="secondary">
                                {getContentSummary(content)}
                              </Text>
                            </div>
                            <IconButton size="small" variant="transparent">
                              {isExpanded ? <ChevronDown /> : <ChevronRight />}
                            </IconButton>
                          </div>

                          {isExpanded && (
                            <div className="border-t px-4 py-4">
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor={`title-${languageCode}`}>
                                    Title
                                  </Label>
                                  <Input
                                    id={`title-${languageCode}`}
                                    value={content.title || ""}
                                    onChange={(e) =>
                                      handleInputChange(
                                        languageCode,
                                        "title",
                                        e.target.value
                                      )
                                    }
                                    placeholder={`Enter title in ${getLanguageName(
                                      languageCode
                                    )}`}
                                  />
                                </div>
                                <div>
                                  <Label
                                    htmlFor={`description-${languageCode}`}
                                  >
                                    Description
                                  </Label>
                                  <Textarea
                                    id={`description-${languageCode}`}
                                    value={content.description || ""}
                                    onChange={(e) =>
                                      handleInputChange(
                                        languageCode,
                                        "description",
                                        e.target.value
                                      )
                                    }
                                    placeholder={`Enter description in ${getLanguageName(
                                      languageCode
                                    )}`}
                                    rows={4}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <Button variant="secondary" onClick={handleCloseDrawer}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              Save Changes
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

export default MultilingualWidget;
