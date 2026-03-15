import { Link } from "react-router-dom";
import {
  Anchor,
  ActionIcon,
  useMantineTheme,
  useMantineColorScheme,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Network, Volume2, Copy } from "lucide-react";
import { SpeakWord } from "@wailsjs/go/services/TTSService";
import { useEntityImage, useCapabilities } from "@hooks/useEntityData";
import { prepareTTSText } from "@utils/tts";
import { database } from "@models";
import { appConfig } from "@/config";

interface ReferenceLinkProps {
  matchedEntity: database.Entity;
  displayWord: string;
  stopAudio: () => void;
  currentAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  parentEntity?: database.Entity;
}

export function ReferenceLink({
  matchedEntity,
  displayWord,
  stopAudio,
  currentAudioRef,
  parentEntity,
}: ReferenceLinkProps) {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const imageUrl = useEntityImage(matchedEntity.id, matchedEntity.typeSlug);
  const { data: capabilities } = useCapabilities();

  const isDark = colorScheme === "dark";

  // Find color from config
  const entityConfig = appConfig.entityTypes.find(
    (t) => t.slug === matchedEntity.typeSlug,
  );
  // Fallback for legacy "word" type which maps to "reference" in config
  const configSlug =
    matchedEntity.typeSlug === "word" ? "reference" : matchedEntity.typeSlug;
  const resolvedConfig =
    entityConfig || appConfig.entityTypes.find((t) => t.slug === configSlug);

  const colorName = resolvedConfig?.color;
  const color = colorName
    ? theme.colors[colorName][isDark ? 3 : 6]
    : isDark
      ? "var(--mantine-color-text)"
      : "#000000";

  // Check if this is a Title with quoted text
  const hasQuotedText =
    matchedEntity.typeSlug === "title" &&
    matchedEntity.description &&
    /\[\s*\n/.test(matchedEntity.description);

  // Check if this link is part of a "Written by:" line in a Title item
  const isWrittenByLine =
    parentEntity?.typeSlug === "title" &&
    parentEntity?.description?.includes(
      `Written by: {writer: ${matchedEntity.primaryLabel}}`,
    );

  const handleTTSClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    stopAudio();

    const finalText = prepareTTSText(
      matchedEntity.description || "",
      matchedEntity.primaryLabel,
    );
    if (!finalText) {
      notifications.show({
        title: "No Quote Found",
        message: "Could not find quoted text",
        color: "orange",
      });
      return;
    }

    notifications.show({
      id: "tts-inline-loading",
      title: "Generating speech...",
      message: "Please wait",
      loading: true,
      autoClose: false,
    });

    try {
      const result = await SpeakWord(
        finalText,
        matchedEntity.typeSlug,
        matchedEntity.primaryLabel,
        matchedEntity.id,
      );

      if (result.error) {
        notifications.update({
          id: "tts-inline-loading",
          title: "TTS Error",
          message: result.error,
          color: "red",
          loading: false,
          autoClose: result.errorType === "missing_key" ? false : 5000,
          withCloseButton: true,
        });
        return;
      }

      if (result.cached) {
        notifications.update({
          id: "tts-inline-loading",
          title: "Using cached audio",
          message: "Playing from cache",
          color: "green",
          loading: false,
          autoClose: 1500,
        });
      } else {
        notifications.hide("tts-inline-loading");
      }

      const audioData = result.audioData;
      let uint8Array: Uint8Array;
      if (typeof audioData === "string") {
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

      const audioBlob = new Blob([uint8Array as BlobPart], {
        type: "audio/mpeg",
      });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };

      currentAudioRef.current = audio;
      await audio.play();

      notifications.show({
        title: "Playing Quote",
        message: `"${matchedEntity.primaryLabel}"`,
        color: "green",
        autoClose: 3000,
      });
    } catch (err: unknown) {
      notifications.hide("tts-inline-loading");
      notifications.show({
        title: "Error",
        message:
          err instanceof Error ? err.message : "Failed to generate speech",
        color: "red",
      });
    }
  };

  const handleCopyClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const quoteRegex = /\[\s*\n([\s\S]*?)\n\s*\]/;
    const match = matchedEntity.description?.match(quoteRegex);
    if (match && match[1]) {
      const quotedText = match[1].replace(/[\\\/]$/gm, "").trim();
      await navigator.clipboard.writeText(quotedText);
      notifications.show({
        title: "Copied",
        message: "Quote copied to clipboard",
        color: "blue",
        autoClose: 2000,
      });
    }
  };

  const isLegacyType = ["reference", "writer", "title"].includes(
    matchedEntity.typeSlug,
  );
  const linkTo = isLegacyType
    ? `/item/${matchedEntity.id}?tab=detail`
    : `/entities/${matchedEntity.typeSlug}/${matchedEntity.id}`;

  return (
    <span style={{ whiteSpace: "nowrap" }}>
      <Anchor
        component={Link}
        to={linkTo}
        onClick={(e: React.MouseEvent) => {
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
          }
        }}
        style={{
          color,
          fontWeight: 600,
          textDecoration: "underline",
          fontVariant: "small-caps",
        }}
      >
        {displayWord}
      </Anchor>

      {imageUrl && !isWrittenByLine && (
        <Anchor
          component={Link}
          to={`/item/${matchedEntity.id}?tab=detail`}
          style={{
            marginLeft: "6px",
            display: "inline-block",
            verticalAlign: "middle",
            lineHeight: 0,
          }}
        >
          <img
            src={imageUrl}
            alt={displayWord}
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "1px solid var(--mantine-color-default-border)",
            }}
          />
        </Anchor>
      )}

      {hasQuotedText && (
        <>
          <ActionIcon
            size="xs"
            variant="subtle"
            color="green"
            style={{
              marginLeft: "6px",
              display: "inline-block",
              verticalAlign: "middle",
            }}
            title={
              capabilities?.hasTts
                ? "Read quoted text"
                : "Configure OpenAI API Key in Settings to enable TTS"
            }
            disabled={!capabilities?.hasTts}
            onClick={handleTTSClick}
          >
            <Volume2 size={14} />
          </ActionIcon>
          <ActionIcon
            size="xs"
            variant="subtle"
            color="blue"
            style={{
              marginLeft: "6px",
              display: "inline-block",
              verticalAlign: "middle",
            }}
            title="Copy quoted text"
            onClick={handleCopyClick}
          >
            <Copy size={14} />
          </ActionIcon>
        </>
      )}

      <Anchor
        component={Link}
        to={`/item/${matchedEntity.id}?tab=graph`}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
        }}
        style={{
          marginLeft: "6px",
          display: "inline-block",
          verticalAlign: "middle",
          opacity: 0.6,
        }}
        title="Show in graph"
      >
        <Network size={14} />
      </Anchor>
    </span>
  );
}
