import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Container,
  Text,
  Button,
  Stack,
  Loader,
  useMantineColorScheme,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { GetEntityImage } from "@wailsjs/go/services/ImageService";
import {
  GetEntity,
  GetRelationshipsWithDetails,
  DeleteEntity,
  UpdateEntity,
  GetAllEntities,
} from "@wailsjs/go/services/EntityService";
import { LogError } from "@wailsjs/runtime/runtime.js";
import { db } from "@models";
import { IconCheck } from "@tabler/icons-react";
import { useState, useEffect, useCallback } from "react";
import { HeaderToolbar } from "@components/ItemDetail/HeaderToolbar";
import { EntityContent } from "@components/ItemDetail/EntityContent";
import { OutgoingConnections } from "@components/ItemDetail/OutgoingConnections";
import { IncomingConnections } from "@components/ItemDetail/IncomingConnections";
import { ImageModal } from "@components/ItemDetail/ImageModal";
import { MissingDefinitionModal } from "@components/ItemDetail/MissingDefinitionModal";
import { useUI } from "@/contexts/UIContext";
import { useAudioPlayer } from "@hooks/useAudioPlayer";
import { useCapabilities } from "@hooks/useEntityData";
import { useDataQuality } from "@hooks/useDataQuality";
import { useLinkManagement } from "@hooks/useLinkManagement";
import { useTTSHandlers } from "@hooks/useTTSHandlers";

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

  const [missingDefinitionModalOpen, setMissingDefinitionModalOpen] =
    useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [entityImage, setItemImage] = useState<string | null>(null);

  const { currentAudioRef, stopAudio } = useAudioPlayer();
  const { handlePronounce, handleReadQuote } = useTTSHandlers(
    stopAudio,
    currentAudioRef,
  );

  useEffect(() => {
    return () => stopAudio();
  }, [id, stopAudio]);

  useEffect(() => {
    const handleClick = () => stopAudio();
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [stopAudio]);

  const toggleRevealMarkdown = () => {
    setRevealMarkdown(!revealMarkdown);
  };

  const toggleOutgoingCollapsed = () => {
    setOutgoingCollapsed(!outgoingCollapsed);
  };

  const toggleIncomingCollapsed = () => {
    setIncomingCollapsed(!incomingCollapsed);
  };

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
      stopAudio();

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

      if ((e.metaKey || e.ctrlKey) && e.key === "e") {
        e.preventDefault();
        if (onEnterEditMode) {
          onEnterEditMode();
        }
      }

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

  useEffect(() => {
    if (links && entity) {
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

  useEffect(() => {
    if (!entity?.id) {
      setItemImage(null);
      return;
    }

    let isMounted = true;

    const fetchImage = async () => {
      try {
        const ownImage = await GetEntityImage(entity.id);
        if (ownImage) {
          if (isMounted) setItemImage(ownImage);
          return;
        }

        if (entity.typeSlug === "title" && linkedItemsQueries.data) {
          const linkedItems = Object.values(
            linkedItemsQueries.data as Record<number, db.Entity>,
          );

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

  const dataQuality = useDataQuality(
    entity,
    links,
    allItems,
    linkedItemsData,
    id,
  );

  const {
    creatingLinkFor,
    deletingLinkFor,
    handleDeleteIncomingLink,
    handleCreateLinkFromQuality,
    handleDeleteLinkFromQuality,
  } = useLinkManagement(id, links, loadEntity, loadLinks);

  const handleDelete = () => {
    handleDeleteEntity();
  };

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
      <HeaderToolbar
        entity={entity}
        id={id!}
        links={links}
        revealMarkdown={revealMarkdown}
        deleteIsPending={deleteIsPending}
        onToggleRevealMarkdown={toggleRevealMarkdown}
        onEnterEditMode={onEnterEditMode}
        onDelete={handleDelete}
      />

      <div style={{ flex: 1, overflowY: "auto", display: "flex", gap: 0 }}>
        <div
          style={{
            flex: "7",
            padding: "2rem",
            borderRight: `1px solid ${colorScheme === "dark" ? "#373A40" : "#e9ecef"}`,
          }}
        >
          <EntityContent
            entity={entity}
            id={id!}
            revealMarkdown={revealMarkdown}
            allItems={allItems}
            stopAudio={stopAudio}
            currentAudioRef={currentAudioRef}
            entityImage={entityImage}
            capabilities={capabilities}
            dataQuality={dataQuality}
            creatingLinkFor={creatingLinkFor}
            deletingLinkFor={deletingLinkFor}
            onPronounce={handlePronounce}
            onReadQuote={handleReadQuote}
            onDeleteIncomingLink={handleDeleteIncomingLink}
            onCreateLink={handleCreateLinkFromQuality}
            onDeleteLink={handleDeleteLinkFromQuality}
            onOpenMissingDefinitionModal={() =>
              setMissingDefinitionModalOpen(true)
            }
            onOpenImageModal={() => setImageModalOpen(true)}
          />
        </div>

        <ImageModal
          opened={imageModalOpen}
          onClose={() => setImageModalOpen(false)}
          imageSrc={entityImage}
          altText={entity.primaryLabel}
        />

        <MissingDefinitionModal
          opened={missingDefinitionModalOpen}
          onClose={() => setMissingDefinitionModalOpen(false)}
        />

        <div
          style={{
            flex: "1",
            padding: "1rem",
            overflowY: "auto",
            backgroundColor: colorScheme === "dark" ? "#25262b" : "#f8f9fa",
          }}
        >
          <Stack gap="md">
            <OutgoingConnections
              links={links}
              id={id!}
              linkedItemsData={linkedItemsData}
              collapsed={outgoingCollapsed}
              onToggleCollapsed={toggleOutgoingCollapsed}
            />
            <IncomingConnections
              links={links}
              id={id!}
              linkedItemsData={linkedItemsData}
              collapsed={incomingCollapsed}
              onToggleCollapsed={toggleIncomingCollapsed}
            />
          </Stack>
        </div>
      </div>
    </div>
  );
}
