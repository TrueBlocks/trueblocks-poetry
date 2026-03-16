import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Paper,
  Loader,
  Badge,
  ActionIcon,
  Divider,
  Alert,
  useMantineColorScheme,
  Modal,
  Grid,
  Box,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { SpeakWord } from "@wailsjs/go/services/TTSService";
import { GetEntityImage } from "@wailsjs/go/services/ImageService";
import {
  GetEntity,
  GetRelationshipsWithDetails,
  DeleteEntity,
  SearchEntities,
  UpdateEntity,
  CreateRelationship,
  DeleteRelationship,
  GetAllEntities,
} from "@wailsjs/go/services/EntityService";
import * as parser from "@/types/parser";
import { LogInfo, LogError, BrowserOpenURL } from "@wailsjs/runtime/runtime.js";
import { db } from "@models";
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconNetwork,
  IconSparkles,
  IconAlertTriangle,
  IconPilcrow,
  IconCheck,
  IconVolume,
  IconCopy,
  IconChevronDown,
  IconChevronRight,
} from "@tabler/icons-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { getEntityColor } from "@utils/colors";
import { stripPossessive } from "@utils/references";
import { parseReferenceTags } from "@utils/tagParser";
import { DefinitionRenderer } from "@components/ItemDetail/DefinitionRenderer";
import { useUI } from "@/contexts/UIContext";
import { useAudioPlayer } from "@hooks/useAudioPlayer";
import { useCapabilities } from "@hooks/useEntityData";

export default function ItemDetail({
  onEnterEditMode,
}: {
  onEnterEditMode?: () => void;
}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();

  const {
    revealMarkdown,
    setRevealMarkdown,
    outgoingCollapsed,
    setOutgoingCollapsed,
    incomingCollapsed,
    setIncomingCollapsed,
  } = useUI();

  const [creatingLinkFor, setCreatingLinkFor] = useState<string | null>(null);
  const [deletingLinkFor, setDeletingLinkFor] = useState<string | null>(null);
  const [missingDefinitionModalOpen, setMissingDefinitionModalOpen] =
    useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [entityImage, setItemImage] = useState<string | null>(null);

  // Use audio player hook
  const { currentAudioRef, stopAudio } = useAudioPlayer();

  // Stop audio when component unmounts or id changes
  useEffect(() => {
    return () => stopAudio();
  }, [id, stopAudio]);

  // Stop audio on any click anywhere in the document
  useEffect(() => {
    const handleClick = () => stopAudio();
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [stopAudio]);

  // Toggle reveal markdown
  const toggleRevealMarkdown = () => {
    setRevealMarkdown(!revealMarkdown);
  };

  // Toggle outgoing collapsed
  const toggleOutgoingCollapsed = () => {
    setOutgoingCollapsed(!outgoingCollapsed);
  };

  // Toggle incoming collapsed
  const toggleIncomingCollapsed = () => {
    setIncomingCollapsed(!incomingCollapsed);
  };

  // Note: SaveLastWord is now handled by ItemPage parent component

  const [entity, setEntity] = useState<db.Entity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadEntity = useCallback(() => {
    setIsLoading(true);
    GetEntity(Number(id))
      .then(setEntity)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    loadEntity();
  }, [loadEntity]);

  const { data: capabilities } = useCapabilities();

  const [links, setLinks] = useState<Awaited<
    ReturnType<typeof GetRelationshipsWithDetails>
  > | null>(null);

  const loadLinks = useCallback(() => {
    if (id) {
      GetRelationshipsWithDetails(Number(id))
        .then(setLinks)
        .catch(() => {});
    }
  }, [id]);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Stop audio on any keyboard action
      stopAudio();

      // cmd+r or ctrl+r to reload
      if ((e.metaKey || e.ctrlKey) && e.key === "r") {
        e.preventDefault();
        loadEntity();
        loadLinks();
        notifications.show({
          title: "Reloaded",
          message: "Item data refreshed",
          color: "blue",
        });
      }

      // cmd+e or ctrl+e to open editor
      if ((e.metaKey || e.ctrlKey) && e.key === "e") {
        e.preventDefault();
        if (onEnterEditMode) {
          onEnterEditMode();
        }
      }

      // cmd+s or ctrl+s to save/normalize item
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (entity) {
          try {
            await UpdateEntity(entity);
            loadEntity();
            notifications.show({
              title: "Item Normalized",
              message: "References have been normalized",
              color: "green",
              icon: <IconCheck size={18} />,
            });
          } catch (error) {
            notifications.show({
              title: "Error",
              message: "Failed to save item",
              color: "red",
            });
            LogError(`Failed to save item: ${error}`);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [entity, id, navigate, onEnterEditMode, stopAudio, loadEntity, loadLinks]);

  // Log delete button state for debugging
  useEffect(() => {
    if (links && entity) {
      // const _incomingLinks = links.filter(
      //   (l) => l.targetId === Number(id),
      // );
      // LogInfo(
      //   `[ItemDetail] Delete button state - Item: ${entity.primaryLabel}, Incoming links: ${_incomingLinks.length}, Disabled: ${_incomingLinks.length > 0}`,
      // );
    }
  }, [links, entity, id]);

  const [deleteIsPending, setDeleteIsPending] = useState(false);

  const handleDeleteEntity = async () => {
    setDeleteIsPending(true);
    try {
      await DeleteEntity(Number(id));
      notifications.show({
        title: "Item deleted",
        message: "The item has been deleted successfully",
        color: "green",
      });
      navigate("/");
    } catch (error) {
      LogError(`Failed to delete item: ${error}`);
      notifications.show({
        title: "Error",
        message: `Failed to delete item: ${error}`,
        color: "red",
      });
    } finally {
      setDeleteIsPending(false);
    }
  };

  const [allItems, setAllItems] = useState<db.Entity[] | null>(null);

  useEffect(() => {
    GetAllEntities()
      .then(setAllItems)
      .catch(() => {});
  }, []);

  const [linkedItemsData, setLinkedItemsData] = useState<
    Record<number, db.Entity>
  >({});
  const linkedItemsQueries = { data: linkedItemsData };

  useEffect(() => {
    const ids = links?.map((link) => link.otherEntityId) || [];
    if (ids.length > 0) {
      Promise.all(ids.map((itemId: number) => GetEntity(itemId)))
        .then((items) => {
          const map = items.reduce(
            (acc, e) => {
              if (e) acc[e.id] = e;
              return acc;
            },
            {} as Record<number, db.Entity>,
          );
          setLinkedItemsData(map);
        })
        .catch(() => {});
    }
  }, [links]);

  // Load item image when item changes (with fallback to Writer image for Titles)
  useEffect(() => {
    if (!entity?.id) {
      setItemImage(null);
      return;
    }

    let isMounted = true;

    const fetchImage = async () => {
      try {
        // 1. Try to get the item's own image
        const ownImage = await GetEntityImage(entity.id);
        if (ownImage) {
          if (isMounted) setItemImage(ownImage);
          return;
        }

        // 2. If no own image, and it's a Title, try to get Writer's image
        if (entity.typeSlug === "title" && linkedItemsQueries.data) {
          const linkedItems = Object.values(
            linkedItemsQueries.data as Record<number, db.Entity>,
          );

          // Look for the writer mentioned in "Written by:" tag first
          let writer: db.Entity | undefined;
          if (entity.description) {
            const writtenByMatch = entity.description.match(
              /Written by:\s*\{writer:\s*([^}]+)\}/i,
            );
            if (writtenByMatch) {
              const writerName = writtenByMatch[1].trim();
              writer = linkedItems.find(
                (i) => i.typeSlug === "writer" && i.primaryLabel === writerName,
              );
            }
          }

          // Fall back to any Writer if "Written by:" not found
          if (!writer) {
            writer = linkedItems.find((i) => i.typeSlug === "writer");
          }

          if (writer) {
            const writerImage = await GetEntityImage(writer.id);
            if (isMounted && writerImage) {
              setItemImage(writerImage);
              return;
            }
          }
        }

        if (isMounted) setItemImage(null);
      } catch (error) {
        LogError(`Failed to load item image: ${error}`);
        if (isMounted) setItemImage(null);
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
    };
  }, [
    entity?.id,
    entity?.typeSlug,
    entity?.description,
    linkedItemsQueries.data,
  ]);

  // Data quality checks
  const dataQuality = useMemo(() => {
    if (!entity || !links || !allItems) return null;

    // Parse references from all text fields (description, derivation, notes)
    // We now collect objects { word: string, type: string }
    let allRefObjects: { word: string; type: string }[] = [];

    const collectRefs = (text: string | undefined) => {
      if (!text) return;
      const tags = parseReferenceTags(text);
      tags.forEach((tag) => {
        if (tag.type === "reference" && tag.refWord && tag.refType) {
          const word =
            tag.refType === "writer"
              ? stripPossessive(tag.refWord)
              : tag.refWord;
          allRefObjects.push({ word, type: tag.refType });
        }
      });
    };

    // 1. From parsedDefinition (if available)
    if (
      entity.attributes?.parsedDefinition &&
      entity.attributes.parsedDefinition.length > 0
    ) {
      const extractRefsFromTokens = (tokens?: parser.Token[]) => {
        if (!tokens) return;
        tokens.forEach((t) => {
          if (t.refType && t.refWord) {
            const word =
              t.refType === "writer" ? stripPossessive(t.refWord!) : t.refWord!;
            allRefObjects.push({ word, type: t.refType });
          }
        });
      };

      (entity.attributes.parsedDefinition as parser.Segment[]).forEach(
        (segment) => {
          extractRefsFromTokens(segment.tokens);
          extractRefsFromTokens(segment.preTokens);
          extractRefsFromTokens(segment.postTokens);
        },
      );
    } else {
      // Fallback to raw description parsing
      collectRefs(entity.description);
    }

    // 2. From other fields
    collectRefs(entity.attributes.derivation);
    collectRefs(entity.attributes.appendicies);

    // Deduplicate based on word+type
    const uniqueRefs = new Map<string, { word: string; type: string }>();
    allRefObjects.forEach((ref) => {
      uniqueRefs.set(
        `${ref.word.toLowerCase()}|${ref.type.toLowerCase()}`,
        ref,
      );
    });
    allRefObjects = Array.from(uniqueRefs.values());

    // Extract just the words for linking checks
    const allRefsWords = allRefObjects.map((r) => r.word);

    // Get outgoing "to" links (where this item is the source)
    const outgoingLinks = links.filter((link) => link.sourceId === Number(id));
    const linkedWords = outgoingLinks
      .map((link) => {
        const linkedId = link.targetId;
        const linkedItem = linkedItemsQueries.data?.[linkedId];
        return linkedItem?.primaryLabel;
      })
      .filter(Boolean);

    // Find references in all fields that are NOT linked
    const unlinkedRefs = allRefsWords.filter(
      (ref) =>
        ref !== undefined &&
        !linkedWords.some(
          (w) => w !== undefined && w.toLowerCase() === ref.toLowerCase(),
        ),
    );

    // Find linked items that are NOT in any text field
    const extraLinks = linkedWords.filter(
      (primaryLabel) =>
        primaryLabel !== undefined &&
        !allRefsWords.some(
          (ref) =>
            ref !== undefined &&
            ref.toLowerCase() === primaryLabel.toLowerCase(),
        ),
    );

    // Check for missing description with single incoming link
    const incomingLinks = links.filter((link) => link.targetId === Number(id));
    const hasMissingDefinition =
      (!entity.description ||
        entity.description.trim() === "" ||
        entity.description.trim().toUpperCase() === "MISSING DATA") &&
      incomingLinks.length === 1;

    // Check for Type Mismatches
    const typeMismatches: {
      word: string;
      expectedType: string;
      actualType: string;
    }[] = [];

    allRefObjects.forEach((ref) => {
      const matchedEntity = allItems.find(
        (item) => item.primaryLabel.toLowerCase() === ref.word.toLowerCase(),
      );

      if (matchedEntity) {
        // Normalize types for comparison
        let expected = ref.type.toLowerCase();
        // Legacy mappings
        if (expected === "w") expected = "word"; // or reference?
        if (expected === "p") expected = "person";
        if (expected === "t") expected = "title";
        if (expected === "word") expected = "reference"; // 'word' tag maps to 'reference' type usually

        let actual = matchedEntity.typeSlug.toLowerCase();

        // If types don't match
        if (expected !== actual) {
          // Allow 'word' tag to match anything? No, usually specific.
          // But 'word' tag is often used for generic references.
          // If tag is {word: X}, and X is a Title, is that an error?
          // Usually we want {title: X}.

          // Let's be strict for now, but maybe allow 'reference' to match 'word'
          if (expected === "reference" && actual === "word") return; // ok

          typeMismatches.push({
            word: ref.word,
            expectedType: expected,
            actualType: actual,
          });
        }
      }
    });

    return {
      unlinkedRefs,
      extraLinks,
      hasMissingDefinition,
      typeMismatches,
      hasIssues:
        unlinkedRefs.length > 0 ||
        extraLinks.length > 0 ||
        hasMissingDefinition ||
        typeMismatches.length > 0,
    };
  }, [entity, links, allItems, linkedItemsQueries.data, id]);

  const handleDelete = () => {
    // LogInfo(
    //   `[ItemDetail] handleDelete called for item ID: ${id}, primaryLabel: ${entity?.primaryLabel}`,
    // );
    // LogInfo(
    //   `[ItemDetail] Deleting item immediately (no incoming links), calling deleteMutation.mutate()`,
    // );
    handleDeleteEntity();
  };

  const handleDeleteIncomingLink = async () => {
    if (!entity || !links) return;

    const incomingLinks = links.filter((link) => link.targetId === Number(id));
    if (incomingLinks.length !== 1) return;

    const incomingLink = incomingLinks[0];
    // LogInfo(
    //   `[ItemDetail] Deleting incoming link from ${incomingLink.sourceId} to ${id}`,
    // );

    try {
      await DeleteRelationship(incomingLink.id);
      loadEntity();
      loadLinks();
      notifications.show({
        title: "Link deleted",
        message: "The incoming link has been deleted",
        color: "green",
      });
    } catch (error) {
      LogInfo(`[ItemDetail] Failed to delete incoming link: ${error}`);
      notifications.show({
        title: "Error",
        message: "Failed to delete link",
        color: "red",
      });
    }
  };

  const handleCreateLinkFromQuality = async (refWord: string) => {
    setCreatingLinkFor(refWord);

    try {
      LogInfo(
        `[handleCreateLinkFromQuality] Calling with id: ${id}, refWord: ${refWord}`,
      );

      const entities = await SearchEntities(refWord, "");
      const target = entities.find(
        (e) => e.primaryLabel.toLowerCase() === refWord.toLowerCase(),
      );

      if (target) {
        await CreateRelationship(Number(id), target.id, "reference");
        notifications.show({
          title: "Link created",
          message: `Linked to ${target.primaryLabel}`,
          color: "green",
        });
      } else {
        notifications.show({
          title: "Entity not found",
          message: `Could not find entity: ${refWord}`,
          color: "red",
        });
      }

      loadEntity();
      loadLinks();
      LogInfo("[handleCreateLinkFromQuality] Completed successfully");
    } catch (error) {
      LogError(`[handleCreateLinkFromQuality] Caught error`);
      notifications.show({
        title: "Error",
        message: `Failed: ${error}`,
        color: "red",
      });
    } finally {
      setCreatingLinkFor(null);
    }
  };

  // Keyboard shortcut for Cmd+G to go to graph
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "g") {
        e.preventDefault();
        navigate(`/graph?id=${id}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [id, navigate]);

  // Keyboard shortcut for Cmd+G to go to graph
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "g") {
        e.preventDefault();
        navigate(`/graph?id=${id}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [id, navigate]);

  const handleDeleteLinkFromQuality = async (refWord: string) => {
    setDeletingLinkFor(refWord);
    try {
      // Strip possessive 's or s' from the ref primaryLabel
      let matchWord = refWord;
      if (refWord.endsWith("'s") || refWord.endsWith("'s")) {
        matchWord = refWord.slice(0, -2);
      } else if (refWord.endsWith("s'") || refWord.endsWith("s'")) {
        matchWord = refWord.slice(0, -1);
      }

      // Look up the destination item by primaryLabel
      const entities = await SearchEntities(matchWord, "");
      const destItem = entities.find(
        (e) => e.primaryLabel.toLowerCase() === matchWord.toLowerCase(),
      );

      if (!destItem) {
        notifications.show({
          title: "Item not found",
          message: `Could not find item: ${matchWord}`,
          color: "red",
        });
        return;
      }

      // Find the link
      const link = links?.find(
        (l) => l.sourceId === Number(id) && l.targetId === destItem.id,
      );

      if (link) {
        // Delete the link
        await DeleteRelationship(link.id);
      } else {
        notifications.show({
          title: "Link not found",
          message: `Could not find link to ${destItem.primaryLabel}`,
          color: "red",
        });
        return;
      }

      loadEntity();
      loadLinks();

      notifications.show({
        title: "Link deleted",
        message: `Removed link to ${destItem.primaryLabel}`,
        color: "green",
      });
    } catch (error) {
      LogError(`Failed to delete link: ${error}`);
      notifications.show({
        title: "Error",
        message: "Failed to delete link",
        color: "red",
      });
    } finally {
      setDeletingLinkFor(null);
    }
  };

  if (isLoading) {
    return (
      <Container size="lg">
        <Stack align="center" justify="center" style={{ height: "100vh" }}>
          <Loader />
        </Stack>
      </Container>
    );
  }

  if (!entity) {
    return (
      <Container size="lg">
        <Stack align="center" justify="center" style={{ height: "100vh" }}>
          <Text>Item not found</Text>
          <Button component={Link} to="/">
            Return to Dashboard
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Fixed Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: colorScheme === "dark" ? "#1a1b1e" : "white",
          borderBottom: `1px solid ${colorScheme === "dark" ? "#373A40" : "#e9ecef"}`,
          padding: "1rem 2rem",
        }}
      >
        <Group justify="space-between">
          <Group gap="md">
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
            <Button
              variant="subtle"
              leftSection={<IconSparkles size={18} />}
              onClick={() => {
                let query = "";
                const type = entity?.typeSlug || "";

                if (type === "Title") {
                  // Check if description contains "Written by:" followed by {writer:} tag
                  const writtenByMatch = entity?.description?.match(
                    /Written by:\s*\{writer:\s*([^}]+)\}/i,
                  );
                  if (writtenByMatch) {
                    const writer = writtenByMatch[1].trim();
                    query = `"${entity?.primaryLabel || ""}" written by ${writer}`;
                  } else {
                    query = `"${entity?.primaryLabel || ""}"`;
                  }
                } else if (type === "Writer") {
                  query = `"${entity?.primaryLabel || ""}"`;
                } else {
                  query = entity?.description
                    ? `${entity.primaryLabel} ${entity.description}`
                    : entity?.primaryLabel || "";
                }

                BrowserOpenURL(
                  `https://www.google.com/search?q=${encodeURIComponent(query)}&ai=1`,
                );
              }}
            >
              AI
            </Button>
            <Button
              variant={revealMarkdown ? "filled" : "subtle"}
              leftSection={<IconPilcrow size={18} />}
              onClick={toggleRevealMarkdown}
              title="Show/hide markdown formatting"
            >
              ¶
            </Button>
          </Group>
          <Group gap="sm">
            <Button
              onClick={onEnterEditMode}
              leftSection={<IconEdit size={16} />}
            >
              Edit
            </Button>
            <Button
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={handleDelete}
              loading={deleteIsPending}
              disabled={
                !!(
                  links &&
                  links.filter((l) => l.targetId === Number(id)).length > 0
                )
              }
              title={
                links &&
                links.filter((l) => l.targetId === Number(id)).length > 0
                  ? "Cannot delete: item has incoming connections"
                  : "Delete this item"
              }
            >
              Delete
            </Button>
          </Group>
        </Group>
      </div>

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", gap: 0 }}>
        {/* Main content area - 7/8 width */}
        <div
          style={{
            flex: "7",
            padding: "2rem",
            borderRight: `1px solid ${colorScheme === "dark" ? "#373A40" : "#e9ecef"}`,
          }}
        >
          <Grid gutter="xl">
            <Grid.Col span={entityImage ? 8 : 12}>
              <Stack gap="xl">
                <div>
                  <Group gap="sm" align="center">
                    <Title order={1} size="3rem" mb="sm">
                      {entity.primaryLabel}
                    </Title>
                    <ActionIcon
                      size="lg"
                      variant="subtle"
                      color="gray"
                      title="Copy to clipboard"
                      onClick={() => {
                        navigator.clipboard.writeText(entity.primaryLabel);
                        notifications.show({
                          title: "Copied!",
                          message: `"${entity.primaryLabel}" copied to clipboard`,
                          color: "green",
                          icon: <IconCheck size={16} />,
                        });
                      }}
                    >
                      <IconCopy size={20} />
                    </ActionIcon>
                    <ActionIcon
                      size="lg"
                      variant="subtle"
                      color="gray"
                      title="View in graph"
                      component={Link}
                      to={`/item/${id}?tab=graph`}
                    >
                      <IconNetwork size={20} />
                    </ActionIcon>
                  </Group>
                  <Group gap="sm">
                    <Badge
                      size="lg"
                      style={{
                        backgroundColor: getEntityColor(entity.typeSlug),
                        color: "#000",
                      }}
                    >
                      {entity.typeSlug}
                    </Badge>
                    {entity.typeSlug === "reference" && (
                      <ActionIcon
                        size="lg"
                        variant="light"
                        color="blue"
                        title={
                          capabilities?.hasTts
                            ? "Pronounce primaryLabel"
                            : "Configure OpenAI API Key in Settings to enable TTS"
                        }
                        disabled={!capabilities?.hasTts}
                        onClick={async () => {
                          // Stop any currently playing audio
                          stopAudio();

                          notifications.show({
                            id: "tts-loading",
                            title: "Generating pronunciation...",
                            message: "Querying OpenAI",
                            color: "blue",
                            loading: true,
                            autoClose: false,
                          });
                          try {
                            const result = await SpeakWord(
                              entity.primaryLabel,
                              entity.typeSlug,
                              entity.primaryLabel,
                              entity.id,
                            );
                            LogInfo(
                              `Received TTS result, cached: ${result.cached}, error: ${result.error || "none"}`,
                            );

                            // Check for errors
                            if (result.error) {
                              notifications.update({
                                id: "tts-loading",
                                title: "TTS Error",
                                message: result.error,
                                color: "red",
                                loading: false,
                                autoClose:
                                  result.errorType === "missing_key"
                                    ? false
                                    : 5000,
                                withCloseButton: true,
                              });
                              return;
                            }

                            // Show cache indicator
                            if (result.cached) {
                              notifications.update({
                                id: "tts-loading",
                                title: "Using cached audio",
                                message: "Playing from cache",
                                color: "green",
                                loading: false,
                                autoClose: 1500,
                              });
                            } else {
                              notifications.hide("tts-loading");
                            }

                            const audioData = result.audioData;

                            // Wails returns byte arrays as base64 strings, need to decode
                            let uint8Array: Uint8Array;
                            if (typeof audioData === "string") {
                              // Decode base64 string to binary
                              const binaryString = atob(audioData);
                              uint8Array = new Uint8Array(binaryString.length);
                              for (let i = 0; i < binaryString.length; i++) {
                                uint8Array[i] = binaryString.charCodeAt(i);
                              }
                            } else if (audioData instanceof Uint8Array) {
                              uint8Array = audioData;
                            } else if (Array.isArray(audioData)) {
                              uint8Array = new Uint8Array(audioData);
                            } else {
                              throw new Error("Unexpected audio data format");
                            }

                            LogInfo(
                              `Converted to Uint8Array, length: ${uint8Array.length}`,
                            );
                            const blob = new Blob([uint8Array as BlobPart], {
                              type: "audio/mpeg",
                            });
                            LogInfo(`Created blob, size: ${blob.size}`);
                            const url = URL.createObjectURL(blob);
                            const audio = new Audio(url);

                            // Store reference to current audio
                            currentAudioRef.current = audio;

                            audio.onerror = (e) => {
                              LogError(
                                `Audio playback error: ${JSON.stringify(e)}`,
                              );
                              notifications.show({
                                title: "Playback Error",
                                message: "Failed to play audio",
                                color: "red",
                              });
                              currentAudioRef.current = null;
                            };

                            await audio.play();
                            LogInfo("Audio playing...");
                            audio.onended = () => {
                              LogInfo("Audio playback completed");
                              URL.revokeObjectURL(url);
                              currentAudioRef.current = null;
                            };
                          } catch (error) {
                            const errorMessage =
                              error instanceof Error
                                ? error.message
                                : String(error);
                            notifications.update({
                              id: "tts-loading",
                              title: "Error",
                              message: errorMessage,
                              color: "red",
                              loading: false,
                              autoClose: 3000,
                            });
                            LogError(
                              `Failed to generate pronunciation: ${error}`,
                            );
                          }
                        }}
                      >
                        <IconVolume size={22} />
                      </ActionIcon>
                    )}
                    {entity.typeSlug === "title" &&
                      entity.description &&
                      /\[\s*\n/.test(entity.description) && (
                        <ActionIcon
                          size="lg"
                          variant="light"
                          color="green"
                          title="Read quoted text"
                          onClick={async () => {
                            // Stop any currently playing audio
                            stopAudio();

                            // Extract quoted text from description
                            const quoteRegex = /\[\s*\n([\s\S]*?)\n\s*\]/;
                            const match =
                              entity?.description?.match(quoteRegex);
                            if (!match || !match[1]) {
                              notifications.show({
                                title: "No Quote Found",
                                message: "Could not find quoted text",
                                color: "orange",
                              });
                              return;
                            }

                            // Strip trailing \ or / from each line
                            let quotedText = match[1]
                              .replace(/[\\\/]$/gm, "")
                              .trim();

                            // Count primaryLabels in entire poem
                            const primaryLabelCount =
                              quotedText.split(/\s+/).length;

                            // If entire poem is less than 500 primaryLabels, read it all
                            if (primaryLabelCount < 500) {
                              // Keep full text, just limit to 4000 chars if needed
                              if (quotedText.length > 4000) {
                                quotedText = quotedText.substring(0, 4000);
                              }
                            } else {
                              // Split into stanzas (separated by empty lines)
                              const stanzas = quotedText.split(/\n\s*\n/);

                              // Start with first stanza
                              let selectedText = stanzas[0] || "";
                              let lineCount = selectedText.split("\n").length;

                              // If first stanza has less than 5 lines, add more stanzas
                              let stanzaIndex = 1;
                              while (
                                lineCount < 5 &&
                                stanzaIndex < stanzas.length
                              ) {
                                const nextStanza = stanzas[stanzaIndex];
                                const combined =
                                  selectedText + "\n\n" + nextStanza;

                                // Make sure we don't exceed 4000 chars
                                if (combined.length > 4000) break;

                                selectedText = combined;
                                lineCount = selectedText.split("\n").length;
                                stanzaIndex++;
                              }

                              quotedText = selectedText.trim();
                            }

                            // Prepend the title
                            const textToSpeak = `${entity.primaryLabel}. ${quotedText}`;

                            // Final safety check: ensure we don't exceed 4000 chars
                            const finalText =
                              textToSpeak.length > 4000
                                ? textToSpeak.substring(0, 4000)
                                : textToSpeak;

                            notifications.show({
                              id: "tts-quote-loading",
                              title: "Generating speech...",
                              message: "Querying OpenAI",
                              color: "blue",
                              loading: true,
                              autoClose: false,
                            });

                            try {
                              const result = await SpeakWord(
                                finalText,
                                entity?.typeSlug || "",
                                entity?.primaryLabel || "",
                                entity.id,
                              );
                              LogInfo(
                                `Received quote TTS result, cached: ${result.cached}, error: ${result.error || "none"}`,
                              );

                              // Check for errors
                              if (result.error) {
                                notifications.update({
                                  id: "tts-quote-loading",
                                  title: "TTS Error",
                                  message: result.error,
                                  color: "red",
                                  loading: false,
                                  autoClose:
                                    result.errorType === "missing_key"
                                      ? false
                                      : 5000,
                                  withCloseButton: true,
                                });
                                return;
                              }

                              // Show cache indicator
                              if (result.cached) {
                                notifications.update({
                                  id: "tts-quote-loading",
                                  title: "Using cached audio",
                                  message: "Playing from cache",
                                  color: "green",
                                  loading: false,
                                  autoClose: 1500,
                                });
                              } else {
                                notifications.hide("tts-quote-loading");
                              }

                              const audioData = result.audioData;

                              // Decode base64 string to binary
                              let uint8Array: Uint8Array;
                              if (typeof audioData === "string") {
                                const binaryString = atob(audioData);
                                uint8Array = new Uint8Array(
                                  binaryString.length,
                                );
                                for (let i = 0; i < binaryString.length; i++) {
                                  uint8Array[i] = binaryString.charCodeAt(i);
                                }
                              } else if (audioData instanceof Uint8Array) {
                                uint8Array = audioData;
                              } else if (Array.isArray(audioData)) {
                                uint8Array = new Uint8Array(audioData);
                              } else {
                                throw new Error("Unexpected audio data format");
                              }

                              LogInfo(
                                `Converted quote to Uint8Array, length: ${uint8Array.length}`,
                              );
                              const blob = new Blob([uint8Array as BlobPart], {
                                type: "audio/mpeg",
                              });
                              LogInfo(`Created quote blob, size: ${blob.size}`);
                              const url = URL.createObjectURL(blob);
                              const audio = new Audio(url);

                              // Store reference to current audio
                              currentAudioRef.current = audio;

                              audio.onerror = (e) => {
                                LogError(
                                  `Quote audio playback error: ${JSON.stringify(e)}`,
                                );
                                notifications.show({
                                  title: "Playback Error",
                                  message: "Failed to play audio",
                                  color: "red",
                                });
                                currentAudioRef.current = null;
                              };

                              await audio.play();
                              LogInfo("Quote audio playing...");
                              audio.onended = () => {
                                LogInfo("Quote audio playback completed");
                                URL.revokeObjectURL(url);
                                currentAudioRef.current = null;
                              };
                            } catch (error) {
                              const errorMessage =
                                error instanceof Error
                                  ? error.message
                                  : String(error);
                              LogError(
                                `Failed to generate quote speech: ${errorMessage}`,
                              );
                              LogError(`Full error: ${JSON.stringify(error)}`);
                              notifications.update({
                                id: "tts-quote-loading",
                                title: "Error",
                                message:
                                  errorMessage || "Failed to generate speech",
                                color: "red",
                                loading: false,
                                autoClose: 5000,
                              });
                            }
                          }}
                        >
                          <IconVolume size={22} />
                        </ActionIcon>
                      )}
                  </Group>
                </div>

                {entity.description && (
                  <div>
                    <Text style={{ whiteSpace: "pre-wrap" }}>
                      {revealMarkdown ? (
                        entity.description
                      ) : allItems && entity.description ? (
                        <DefinitionRenderer
                          text={entity.description}
                          allEntities={allItems}
                          stopAudio={stopAudio}
                          currentAudioRef={currentAudioRef}
                          entity={entity}
                        />
                      ) : (
                        entity.description
                      )}
                    </Text>
                  </div>
                )}

                {entity.attributes.derivation && (
                  <div>
                    <Title order={2} size="lg" mb="sm">
                      Etymology
                    </Title>
                    <Text style={{ whiteSpace: "pre-wrap" }}>
                      {revealMarkdown ? (
                        entity.attributes.derivation
                      ) : allItems && entity.attributes.derivation ? (
                        <DefinitionRenderer
                          text={entity.attributes.derivation}
                          allEntities={allItems}
                          stopAudio={stopAudio}
                          currentAudioRef={currentAudioRef}
                          entity={entity}
                        />
                      ) : (
                        entity.attributes.derivation
                      )}
                    </Text>
                  </div>
                )}

                {entity.attributes.appendicies && (
                  <div>
                    <Title order={2} size="lg" mb="sm">
                      Notes
                    </Title>
                    <Text style={{ whiteSpace: "pre-wrap" }}>
                      {revealMarkdown ? (
                        entity.attributes.appendicies
                      ) : allItems && entity.attributes.appendicies ? (
                        <DefinitionRenderer
                          text={entity.attributes.appendicies}
                          allEntities={allItems}
                          stopAudio={stopAudio}
                          currentAudioRef={currentAudioRef}
                          entity={entity}
                        />
                      ) : (
                        entity.attributes.appendicies
                      )}
                    </Text>
                  </div>
                )}

                {(entity.attributes.source ||
                  entity.attributes.source_pg ||
                  entity.attributes.sourcePg) && (
                  <Paper p="md" withBorder>
                    <Text size="sm" fw={600} mb="xs">
                      Source
                    </Text>
                    <Text size="sm">
                      {entity.attributes.source}
                      {(entity.attributes.source_pg ||
                        entity.attributes.sourcePg) &&
                        `, p. ${entity.attributes.source_pg || entity.attributes.sourcePg}`}
                    </Text>
                  </Paper>
                )}

                <Divider />
                <Text size="sm" c="dimmed">
                  Last modified: {new Date(entity.updatedAt).toLocaleString()}
                </Text>

                {/* Data Quality Section */}
                {dataQuality && dataQuality.hasIssues && (
                  <Alert
                    color="yellow"
                    icon={<IconAlertTriangle size={20} />}
                    mt="md"
                  >
                    <Title order={3} size="md" mb="sm">
                      Data Quality Issues
                    </Title>
                    {dataQuality.hasMissingDefinition && (
                      <div>
                        <Text size="sm" fw={600} mb="xs">
                          Missing description (click to define):
                        </Text>
                        <Group gap="xs" mb="md">
                          <Badge
                            color="red"
                            variant="light"
                            style={{ cursor: "pointer" }}
                            onClick={() => setMissingDefinitionModalOpen(true)}
                          >
                            Missing description
                          </Badge>
                          <Badge
                            color="red"
                            variant="filled"
                            style={{ cursor: "pointer" }}
                            onClick={handleDeleteIncomingLink}
                          >
                            Delete link
                          </Badge>
                        </Group>
                      </div>
                    )}
                    {dataQuality.typeMismatches.length > 0 && (
                      <div>
                        <Text size="sm" fw={600} mb="xs">
                          Type mismatches (tag type ≠ entity type):
                        </Text>
                        <Stack gap="xs" mb="md">
                          {dataQuality.typeMismatches.map((mismatch, idx) => (
                            <Text key={idx} size="sm">
                              <span style={{ fontWeight: 600 }}>
                                {mismatch.word}
                              </span>
                              : Expected{" "}
                              <Badge color="orange" size="sm">
                                {mismatch.expectedType}
                              </Badge>{" "}
                              but found{" "}
                              <Badge color="red" size="sm">
                                {mismatch.actualType}
                              </Badge>
                            </Text>
                          ))}
                        </Stack>
                      </div>
                    )}
                    {dataQuality.unlinkedRefs.length > 0 && (
                      <div>
                        <Text size="sm" fw={600} mb="xs">
                          References in description not linked (click to create
                          link):
                        </Text>
                        <Group gap="xs" mb="md">
                          {dataQuality.unlinkedRefs.map(
                            (ref: string, idx: number) => {
                              const isCreating = creatingLinkFor === ref;
                              return (
                                <Badge
                                  key={idx}
                                  color="red"
                                  variant="light"
                                  style={{ cursor: "pointer" }}
                                  onClick={() =>
                                    !isCreating &&
                                    handleCreateLinkFromQuality(ref)
                                  }
                                >
                                  {isCreating ? "Creating..." : ref}
                                </Badge>
                              );
                            },
                          )}
                        </Group>
                      </div>
                    )}
                    {dataQuality.extraLinks.length > 0 && (
                      <div>
                        <Text size="sm" fw={600} mb="xs">
                          Linked items not in description (click to remove
                          link):
                        </Text>
                        <Group gap="xs">
                          {dataQuality.extraLinks.map(
                            (primaryLabel: string | undefined, idx: number) => {
                              if (!primaryLabel) return null;
                              const isDeleting =
                                deletingLinkFor === primaryLabel;
                              return (
                                <Badge
                                  key={idx}
                                  color="orange"
                                  variant="light"
                                  style={{ cursor: "pointer" }}
                                  onClick={() =>
                                    !isDeleting &&
                                    handleDeleteLinkFromQuality(primaryLabel)
                                  }
                                >
                                  {isDeleting ? "Deleting..." : primaryLabel}
                                </Badge>
                              );
                            },
                          )}
                        </Group>
                      </div>
                    )}
                  </Alert>
                )}
              </Stack>
            </Grid.Col>

            {/* Image column - only shown if image exists */}
            {entityImage && (
              <Grid.Col span={4}>
                <Box
                  style={{
                    display: "inline-block",
                    padding: "1px",
                    backgroundColor: "white",
                    borderRadius: "10px",
                    border: "1px solid #00008B",
                    cursor: "pointer",
                  }}
                  onClick={() => setImageModalOpen(true)}
                >
                  <img
                    src={entityImage}
                    alt={entity.primaryLabel}
                    style={{
                      display: "block",
                      maxHeight: "300px",
                      maxWidth: "100%",
                      height: "auto",
                      width: "auto",
                      objectFit: "contain",
                      borderRadius: "6px",
                    }}
                  />
                </Box>
              </Grid.Col>
            )}
          </Grid>
        </div>

        {/* Image Modal */}
        <Modal
          opened={imageModalOpen}
          onClose={() => setImageModalOpen(false)}
          size="auto"
          centered
          withCloseButton={false}
          padding={0}
          styles={{
            body: {
              backgroundColor: "transparent",
            },
            content: {
              backgroundColor: "transparent",
              boxShadow: "none",
            },
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              setImageModalOpen(false);
            }
          }}
        >
          <img
            src={entityImage || ""}
            alt={entity.primaryLabel}
            style={{
              display: "block",
              maxWidth: "90vw",
              maxHeight: "90vh",
              objectFit: "contain",
              borderRadius: "8px",
              cursor: "pointer",
            }}
            onClick={() => setImageModalOpen(false)}
          />
        </Modal>

        {/* Missing Definition Modal */}
        <Modal
          opened={missingDefinitionModalOpen}
          onClose={() => setMissingDefinitionModalOpen(false)}
          title="Missing Definition"
          centered
        >
          <Stack gap="md">
            <Text>Hello World</Text>
            <Group justify="flex-end" gap="sm">
              <Button
                variant="default"
                onClick={() => setMissingDefinitionModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setMissingDefinitionModalOpen(false)}>
                Define
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Connections sidebar - 1/8 width */}
        <div
          style={{
            flex: "1",
            padding: "1rem",
            overflowY: "auto",
            backgroundColor: colorScheme === "dark" ? "#25262b" : "#f8f9fa",
          }}
        >
          <Stack gap="md">
            {/* Outgoing Section */}
            <div>
              <Group
                gap="xs"
                mb="xs"
                style={{ cursor: "pointer", userSelect: "none" }}
                onClick={toggleOutgoingCollapsed}
              >
                {outgoingCollapsed ? (
                  <IconChevronRight size={14} />
                ) : (
                  <IconChevronDown size={14} />
                )}
                <Text size="sm" fw={500}>
                  Outgoing (
                  {links?.filter((l) => l.sourceId === Number(id)).length || 0})
                </Text>
              </Group>
              {!outgoingCollapsed && (
                <Stack gap="xs">
                  {links &&
                  links.filter((l) => l.sourceId === Number(id)).length > 0 ? (
                    links
                      .filter((link) => link.sourceId === Number(id))
                      .map((link) => {
                        const linkedItemId = link.targetId;
                        const linkedItem =
                          linkedItemsQueries.data?.[linkedItemId];

                        return (
                          <Paper
                            key={link.id}
                            p="xs"
                            withBorder
                            style={{
                              backgroundColor: linkedItem?.typeSlug
                                ? getEntityColor(linkedItem.typeSlug)
                                : undefined,
                            }}
                          >
                            {linkedItem ? (
                              <Group gap="xs" align="center">
                                <Text
                                  component={Link}
                                  to={`/item/${linkedItemId}?tab=detail`}
                                  size="xs"
                                  fw={600}
                                  c="dark"
                                  style={{
                                    textDecoration: "none",
                                    lineHeight: 1.2,
                                    flex: 1,
                                  }}
                                  onClick={(e: React.MouseEvent) => {
                                    if (e.metaKey || e.ctrlKey) {
                                      e.preventDefault();
                                    }
                                  }}
                                >
                                  {linkedItem.primaryLabel}
                                </Text>
                                <ActionIcon
                                  component={Link}
                                  to={`/item/${linkedItemId}?tab=graph`}
                                  size="xs"
                                  variant="subtle"
                                  color="dark"
                                  title="Show in graph"
                                >
                                  <IconNetwork size={12} />
                                </ActionIcon>
                              </Group>
                            ) : (
                              <Text size="xs" c="dark">
                                Loading...
                              </Text>
                            )}
                          </Paper>
                        );
                      })
                  ) : (
                    <Text size="xs" c="dimmed" ta="center">
                      No outgoing connections
                    </Text>
                  )}
                </Stack>
              )}
            </div>

            {/* Incoming Section */}
            <div>
              <Group
                gap="xs"
                mb="xs"
                style={{ cursor: "pointer", userSelect: "none" }}
                onClick={toggleIncomingCollapsed}
              >
                {incomingCollapsed ? (
                  <IconChevronRight size={14} />
                ) : (
                  <IconChevronDown size={14} />
                )}
                <Text size="sm" fw={500}>
                  Incoming (
                  {links?.filter((l) => l.targetId === Number(id)).length || 0})
                </Text>
              </Group>
              {!incomingCollapsed && (
                <Stack gap="xs">
                  {links &&
                  links.filter((l) => l.targetId === Number(id)).length > 0 ? (
                    links
                      .filter((link) => link.targetId === Number(id))
                      .map((link) => {
                        const linkedItemId = link.sourceId;
                        const linkedItem =
                          linkedItemsQueries.data?.[linkedItemId];

                        return (
                          <Paper
                            key={link.id}
                            p="xs"
                            withBorder
                            style={{
                              backgroundColor: linkedItem?.typeSlug
                                ? getEntityColor(linkedItem.typeSlug)
                                : undefined,
                            }}
                          >
                            {linkedItem ? (
                              <Group gap="xs" align="center">
                                <Text
                                  component={Link}
                                  to={`/item/${linkedItemId}?tab=detail`}
                                  size="xs"
                                  fw={600}
                                  c="dark"
                                  style={{
                                    textDecoration: "none",
                                    lineHeight: 1.2,
                                    flex: 1,
                                  }}
                                  onClick={(e: React.MouseEvent) => {
                                    if (e.metaKey || e.ctrlKey) {
                                      e.preventDefault();
                                    }
                                  }}
                                >
                                  {linkedItem.primaryLabel}
                                </Text>
                                <ActionIcon
                                  component={Link}
                                  to={`/item/${linkedItemId}?tab=graph`}
                                  size="xs"
                                  variant="subtle"
                                  color="dark"
                                  title="Show in graph"
                                >
                                  <IconNetwork size={12} />
                                </ActionIcon>
                              </Group>
                            ) : (
                              <Text size="xs" c="dark">
                                Loading...
                              </Text>
                            )}
                          </Paper>
                        );
                      })
                  ) : (
                    <Text size="xs" c="dimmed" ta="center">
                      No incoming connections
                    </Text>
                  )}
                </Stack>
              )}
            </div>
          </Stack>
        </div>
      </div>
    </div>
  );
}
