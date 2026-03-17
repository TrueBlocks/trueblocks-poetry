import { useState } from "react";
import { notifications } from "@mantine/notifications";
import {
  SearchEntities,
  CreateRelationship,
  DeleteRelationship,
} from "@wailsjs/go/services/EntityService";
import { LogInfo, LogError } from "@wailsjs/runtime/runtime.js";
import { services } from "@models";

export function useLinkManagement(
  id: string | undefined,
  links: services.RelationshipDetail[] | null,
  loadEntity: () => void,
  loadLinks: () => void,
) {
  const [creatingLinkFor, setCreatingLinkFor] = useState<string | null>(null);
  const [deletingLinkFor, setDeletingLinkFor] = useState<string | null>(null);

  const handleDeleteIncomingLink = async () => {
    if (!links) return;

    const incomingLinks = links.filter((link) => link.targetId === Number(id));
    if (incomingLinks.length !== 1) return;

    const incomingLink = incomingLinks[0];

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

  const handleDeleteLinkFromQuality = async (refWord: string) => {
    setDeletingLinkFor(refWord);
    try {
      let matchWord = refWord;
      if (refWord.endsWith("\u2019s") || refWord.endsWith("'s")) {
        matchWord = refWord.slice(0, -2);
      } else if (refWord.endsWith("s\u2019") || refWord.endsWith("s'")) {
        matchWord = refWord.slice(0, -1);
      }

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

      const link = links?.find(
        (l) => l.sourceId === Number(id) && l.targetId === destItem.id,
      );

      if (link) {
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

  return {
    creatingLinkFor,
    deletingLinkFor,
    handleDeleteIncomingLink,
    handleCreateLinkFromQuality,
    handleDeleteLinkFromQuality,
  };
}
