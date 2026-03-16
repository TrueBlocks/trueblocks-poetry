import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Container,
  Title,
  Button,
  TextInput,
  Select,
  Textarea,
  Group,
  Alert,
  Paper,
  Loader,
  Stack,
  Grid,
  Badge,
  Text,
  Box,
  useMantineColorScheme,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { LogError, LogWarning } from "@utils/logger";
import {
  SaveEntityImage,
  GetEntityImage,
  DeleteEntityImage,
} from "@wailsjs/go/services/ImageService";
import {
  GetEntity,
  CreateEntity,
  UpdateEntity,
} from "@wailsjs/go/services/EntityService";
import { appConfig } from "@/config";
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconPlus,
  IconPhoto,
} from "@tabler/icons-react";
import { useReferenceValidation } from "@hooks/useReferenceValidation";
import { db } from "@models";
export default function ItemEdit({
  onSave,
  onCancel,
}: { onSave?: () => void; onCancel?: () => void } = {}) {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";
  const imageBoxRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    id: 0,
    primaryLabel: "",
    typeSlug: "reference",
    description: "",
    attributes: {
      derivation: "",
      appendicies: "",
      source: "",
      sourcePg: "",
      mark: "",
    },
  });

  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [cachedImage, setCachedImage] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Reference validation for description field
  const { getMissingReferences, getExistingReferences, isValidating } =
    useReferenceValidation(formData.description);

  const handleCreateMissingEntity = async (primaryLabel: string) => {
    const newId = Date.now() + Math.floor(Math.random() * 1000);
    try {
      await CreateEntity({
        id: newId,
        primaryLabel: primaryLabel,
        typeSlug: "reference",
        description: "",
        attributes: {
          derivation: "",
          appendicies: "",
          source: "",
          sourcePg: "",
          mark: "",
        },
      } as unknown as db.Entity);
      notifications.show({
        title: "Item Created",
        message: `Created "${primaryLabel}" as a new reference`,
        color: "green",
        icon: <IconCheck size={18} />,
      });
    } catch {
      notifications.show({
        title: "Error",
        message: `Failed to create "${primaryLabel}"`,
        color: "red",
        icon: <IconX size={18} />,
      });
    }
  };

  const [entity, setEntity] = useState<db.Entity | null>(null);
  const [isLoadingEntity, setIsLoadingEntity] = useState(!isNew);

  useEffect(() => {
    if (!isNew) {
      setIsLoadingEntity(true);
      GetEntity(Number(id))
        .then(setEntity)
        .catch(() => {})
        .finally(() => setIsLoadingEntity(false));
    }
  }, [id, isNew]);

  useEffect(() => {
    if (entity) {
      setFormData({
        id: entity.id,
        primaryLabel: entity.primaryLabel,
        typeSlug: entity.typeSlug,
        description: entity.description || "",
        attributes: {
          derivation: entity.attributes?.derivation || "",
          appendicies: entity.attributes?.appendicies || "",
          source: entity.attributes?.source || "",
          sourcePg: entity.attributes?.sourcePg || "",
          mark: entity.attributes?.mark || "",
        },
      });
      // Load cached image if it exists
      setIsImageLoading(true);
      GetEntityImage(entity.id)
        .then((imageData) => {
          if (imageData) {
            setCachedImage(imageData);
          } else {
            setCachedImage(null);
          }
        })
        .catch((err) => LogError(`Failed to load image: ${err}`))
        .finally(() => setIsImageLoading(false));
    } else if (isNew) {
      // Reset form when creating new item
      setFormData({
        id: 0,
        primaryLabel: "",
        typeSlug: "reference",
        description: "",
        attributes: {
          derivation: "",
          appendicies: "",
          source: "",
          sourcePg: "",
          mark: "",
        },
      });
      setCachedImage(null);
      setPastedImage(null);
    }
  }, [entity, isNew]);

  // Handle paste event for image
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (document.activeElement !== imageBoxRef.current) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          e.preventDefault();
          const blob = items[i].getAsFile();
          if (!blob) continue;

          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            setPastedImage(dataUrl);
            setCachedImage(null); // Clear cached image when new image is pasted
          };
          reader.readAsDataURL(blob);
          break;
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  // Handle delete/backspace for image
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement !== imageBoxRef.current) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        setPastedImage(null);
        setCachedImage(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [saveIsPending, setSaveIsPending] = useState(false);
  const [saveError, setSaveError] = useState<Error | null>(null);

  const doSaveRef = useRef<(data: typeof formData) => void>(() => {});

  const doSave = async (data: typeof formData) => {
    setSaveIsPending(true);
    setSaveError(null);
    try {
      let result: { newId?: number; id?: number };
      if (isNew || data.id === 0) {
        const newId = Date.now() + Math.floor(Math.random() * 1000);
        await CreateEntity({
          ...data,
          id: newId,
        } as unknown as db.Entity);
        result = { newId: newId };
      } else {
        await UpdateEntity(data as unknown as db.Entity);
        result = { id: Number(id) };
      }

      const savedId = result.newId || result.id || Number(id);

      try {
        if (isImageLoading) {
          LogWarning(
            "Image is still loading, skipping image update to prevent accidental deletion",
          );
        } else if (pastedImage) {
          await SaveEntityImage(savedId, pastedImage);
          setCachedImage(pastedImage);
          setPastedImage(null);
        } else if (!pastedImage && !cachedImage) {
          await DeleteEntityImage(savedId);
        }
      } catch (error) {
        LogError(`Error saving image: ${error}`);
      }

      notifications.show({
        title: isNew ? "Item Created" : "Item Saved",
        message: "Your changes have been saved successfully",
        color: "green",
        icon: <IconCheck size={18} />,
      });
      if (isNew) {
        navigate(`/item/${result.newId || result.id}?tab=detail`);
      } else {
        if (onSave) {
          onSave();
        } else {
          navigate(`/item/${id}?tab=detail`);
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setSaveError(err);
      LogError(`Save failed: ${err}`);
      notifications.show({
        title: "Error Saving Item",
        message: err?.message || String(err) || "Failed to save changes",
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setSaveIsPending(false);
    }
  };

  doSaveRef.current = doSave;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.primaryLabel.trim()) {
      alert("Word field is required");
      return;
    }
    if (
      !formData.description.trim() ||
      formData.description === "MISSING DATA"
    ) {
      alert('Definition field is required and cannot be "MISSING DATA"');
      return;
    }
    // Validate tags
    const tagRegex = /\{([^:]+):[^}]+\}/g;
    let match;
    while ((match = tagRegex.exec(formData.description)) !== null) {
      const tagType = match[1];
      // Allow any alphanumeric tag type (generic tags)
      if (!/^[a-zA-Z0-9_]+$/.test(tagType)) {
        alert(
          `Invalid tag type found: "${tagType}". Tag types must be alphanumeric (e.g. {writer: Name}).`,
        );
        return;
      }
    }
    doSave(formData);
  };

  // Keyboard shortcut for cmd+s to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (!formData.primaryLabel.trim()) {
          notifications.show({
            title: "Validation Error",
            message: "Word field is required",
            color: "red",
          });
          return;
        }
        if (
          !formData.description.trim() ||
          formData.description === "MISSING DATA"
        ) {
          notifications.show({
            title: "Validation Error",
            message:
              'Definition field is required and cannot be "MISSING DATA"',
            color: "red",
          });
          return;
        }
        // Validate tags
        const tagRegex = /\{([^:]+):[^}]+\}/g;
        let match;
        while ((match = tagRegex.exec(formData.description)) !== null) {
          const tagType = match[1];
          if (!/^[a-zA-Z0-9_]+$/.test(tagType)) {
            notifications.show({
              title: "Validation Error",
              message: `Invalid tag type found: "${tagType}". Tag types must be alphanumeric (e.g. {writer: Name}).`,
              color: "red",
            });
            return;
          }
        }
        doSaveRef.current(formData);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [formData]);

  if (isLoadingEntity) {
    return (
      <Container>
        <Group justify="center" p="xl">
          <Loader size="xl" />
        </Group>
      </Container>
    );
  }

  return (
    <Container size="lg">
      <Group justify="space-between" mb="xl">
        <Button
          component={Link}
          to={isNew ? "/" : `/item/${id}?tab=detail`}
          variant="subtle"
          leftSection={<IconArrowLeft size={20} />}
        >
          Back
        </Button>
        <Title order={2}>
          {isNew ? "New Item" : `Edit: ${entity?.primaryLabel || ""}`}
        </Title>
        <div />
      </Group>

      {saveError && (
        <Alert
          icon={<IconAlertCircle size={20} />}
          title="Failed to save item"
          color="red"
          mb="md"
        >
          {saveError?.message ||
            String(saveError) ||
            "An unknown error occurred"}
        </Alert>
      )}

      <Paper shadow="sm" p="md" radius="md" withBorder>
        <form onSubmit={handleSubmit}>
          <Stack>
            <Grid>
              <Grid.Col span={10}>
                <TextInput
                  label="Word"
                  required
                  value={formData.primaryLabel}
                  onChange={(e) =>
                    setFormData({ ...formData, primaryLabel: e.target.value })
                  }
                  autoFocus={isNew}
                />
              </Grid.Col>
              <Grid.Col span={2}>
                <Select
                  label="Type"
                  value={formData.typeSlug}
                  onChange={(value) =>
                    setFormData({ ...formData, typeSlug: value || "reference" })
                  }
                  data={appConfig.entityTypes.map((t) => ({
                    value: t.slug,
                    label: t.displayName,
                  }))}
                  searchable
                />
              </Grid.Col>
            </Grid>

            <Textarea
              label="Definition"
              rows={12}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter the description..."
              description="Use {type: Name} to reference other items (e.g. {film: Rashomon}, {writer: Shakespeare})"
              autoFocus={!isNew}
            />

            {/* Reference Validation Indicators */}
            {formData.description &&
              (getExistingReferences().length > 0 ||
                getMissingReferences().length > 0) && (
                <Alert
                  color={getMissingReferences().length > 0 ? "orange" : "green"}
                  mb="xs"
                  style={{
                    position: "relative",
                    zIndex: 10,
                    marginTop: "-60px",
                    marginBottom: "60px",
                    pointerEvents: "none",
                    marginLeft: "auto",
                    width: "fit-content",
                    maxWidth: "80%",
                  }}
                  styles={{
                    root: { pointerEvents: "auto" },
                  }}
                >
                  <Stack gap="xs">
                    {getMissingReferences().length > 0 ? (
                      <Group gap="xs">
                        <Text size="sm" fw={500}>
                          <IconAlertCircle
                            size={16}
                            style={{ verticalAlign: "middle", marginRight: 4 }}
                          />
                          Missing references:
                        </Text>
                        {getMissingReferences().map((ref) => (
                          <Badge
                            key={ref}
                            color="orange"
                            size="sm"
                            variant="light"
                            rightSection={
                              <IconPlus
                                size={12}
                                style={{ cursor: "pointer" }}
                                onClick={() => handleCreateMissingEntity(ref)}
                              />
                            }
                          >
                            {ref}
                          </Badge>
                        ))}
                      </Group>
                    ) : (
                      getExistingReferences().length > 0 && (
                        <Group gap="xs">
                          <Text size="sm" fw={500}>
                            <IconCheck
                              size={16}
                              style={{
                                verticalAlign: "middle",
                                marginRight: 4,
                              }}
                            />
                            Valid references:
                          </Text>
                          {getExistingReferences().map((result) => (
                            <Badge
                              key={result.reference}
                              color="green"
                              size="sm"
                              variant="light"
                            >
                              {result.reference}
                            </Badge>
                          ))}
                        </Group>
                      )
                    )}
                    {isValidating && (
                      <Text size="xs" c="dimmed">
                        Validating references...
                      </Text>
                    )}
                  </Stack>
                </Alert>
              )}

            <TextInput
              label="Etymology"
              value={formData.attributes.derivation}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  attributes: {
                    ...formData.attributes,
                    derivation: e.target.value,
                  },
                })
              }
              placeholder="Word origin and derivation..."
            />

            <TextInput
              label="Notes / Appendices"
              value={formData.attributes.appendicies}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  attributes: {
                    ...formData.attributes,
                    appendicies: e.target.value,
                  },
                })
              }
              placeholder="Additional notes, usage examples, etc..."
            />

            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="Source"
                  value={formData.attributes.source}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      attributes: {
                        ...formData.attributes,
                        source: e.target.value,
                      },
                    })
                  }
                  placeholder="Reference source..."
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Page"
                  value={formData.attributes.sourcePg}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      attributes: {
                        ...formData.attributes,
                        sourcePg: e.target.value,
                      },
                    })
                  }
                  placeholder="Page number..."
                />
              </Grid.Col>
            </Grid>

            {/* Image Paste Area */}
            {formData.typeSlug === "writer" && (
              <Box>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={500}>
                    Image
                  </Text>
                  {isFocused && !pastedImage && !cachedImage && (
                    <Badge color="blue" variant="light" size="sm">
                      Paste image now (Cmd+V)
                    </Badge>
                  )}
                </Group>
                <Paper
                  ref={imageBoxRef}
                  tabIndex={0}
                  p="md"
                  withBorder
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  style={{
                    minHeight: "200px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    backgroundColor:
                      pastedImage || cachedImage
                        ? "transparent"
                        : isDark
                          ? "var(--mantine-color-dark-6)"
                          : "var(--mantine-color-gray-0)",
                    outline: "none",
                    borderColor: isFocused
                      ? "var(--mantine-color-blue-filled)"
                      : undefined,
                    boxShadow: isFocused
                      ? "0 0 0 2px var(--mantine-color-blue-light)"
                      : undefined,
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => imageBoxRef.current?.focus()}
                >
                  {isImageLoading ? (
                    <Loader size="sm" />
                  ) : pastedImage || cachedImage ? (
                    <Box
                      style={{
                        position: "relative",
                        width: "100%",
                        maxWidth: "600px",
                      }}
                    >
                      <img
                        src={pastedImage || cachedImage || ""}
                        alt="Item image"
                        style={{
                          width: "100%",
                          height: "auto",
                          display: "block",
                        }}
                      />
                      {pastedImage && (
                        <Badge
                          color="yellow"
                          size="sm"
                          style={{ position: "absolute", top: 8, right: 8 }}
                        >
                          Unsaved
                        </Badge>
                      )}
                    </Box>
                  ) : (
                    <Stack align="center" gap="xs">
                      <IconPhoto
                        size={48}
                        style={{
                          opacity: isFocused ? 0.8 : 0.3,
                          color: isFocused
                            ? "var(--mantine-color-blue-filled)"
                            : undefined,
                        }}
                      />
                      <Text size="sm" c={isFocused ? "blue" : "dimmed"}>
                        {isFocused
                          ? "Paste image now (Cmd+V)"
                          : "Click here and press Cmd+V to paste an image"}
                      </Text>
                      <Text size="xs" c="dimmed">
                        Press Delete or Backspace to remove
                      </Text>
                    </Stack>
                  )}
                </Paper>
              </Box>
            )}

            <TextInput
              label="Mark / Tag"
              value={formData.attributes.mark}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  attributes: { ...formData.attributes, mark: e.target.value },
                })
              }
              placeholder="Optional mark or tag..."
            />

            <Group justify="flex-end" mt="md">
              {onCancel ? (
                <Button onClick={onCancel} variant="default">
                  Cancel
                </Button>
              ) : (
                <Button onClick={() => navigate(-1)} variant="default">
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                loading={saveIsPending}
                leftSection={<IconDeviceFloppy size={20} />}
              >
                Save
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
