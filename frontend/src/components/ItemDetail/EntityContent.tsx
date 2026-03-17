import { Link } from "react-router-dom";
import {
  Title,
  Text,
  Group,
  Stack,
  Paper,
  Badge,
  ActionIcon,
  Divider,
  Grid,
  Box,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconNetwork,
  IconCheck,
  IconVolume,
  IconCopy,
} from "@tabler/icons-react";
import { app, db } from "@models";
import { getEntityColor } from "@utils/colors";
import { DefinitionRenderer } from "@components/ItemDetail/DefinitionRenderer";
import { DataQualityAlert } from "@components/ItemDetail/DataQualityAlert";
import { DataQualityResult } from "@hooks/useDataQuality";

interface EntityContentProps {
  entity: db.Entity;
  id: string;
  revealMarkdown: boolean;
  allItems: db.Entity[] | null;
  stopAudio: () => void;
  currentAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  entityImage: string | null;
  capabilities: app.Capabilities | null;
  dataQuality: DataQualityResult | null;
  creatingLinkFor: string | null;
  deletingLinkFor: string | null;
  onPronounce: (entity: db.Entity) => void;
  onReadQuote: (entity: db.Entity) => void;
  onDeleteIncomingLink: () => void;
  onCreateLink: (ref: string) => void;
  onDeleteLink: (primaryLabel: string) => void;
  onOpenMissingDefinitionModal: () => void;
  onOpenImageModal: () => void;
}

export function EntityContent({
  entity,
  id,
  revealMarkdown,
  allItems,
  stopAudio,
  currentAudioRef,
  entityImage,
  capabilities,
  dataQuality,
  creatingLinkFor,
  deletingLinkFor,
  onPronounce,
  onReadQuote,
  onDeleteIncomingLink,
  onCreateLink,
  onDeleteLink,
  onOpenMissingDefinitionModal,
  onOpenImageModal,
}: EntityContentProps) {
  return (
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
                  onClick={() => onPronounce(entity)}
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
                    onClick={() => onReadQuote(entity)}
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
                {(entity.attributes.source_pg || entity.attributes.sourcePg) &&
                  `, p. ${entity.attributes.source_pg || entity.attributes.sourcePg}`}
              </Text>
            </Paper>
          )}

          <Divider />
          <Text size="sm" c="dimmed">
            Last modified: {new Date(entity.updatedAt).toLocaleString()}
          </Text>

          {dataQuality && dataQuality.hasIssues && (
            <DataQualityAlert
              dataQuality={dataQuality}
              creatingLinkFor={creatingLinkFor}
              deletingLinkFor={deletingLinkFor}
              onDeleteIncomingLink={onDeleteIncomingLink}
              onCreateLink={onCreateLink}
              onDeleteLink={onDeleteLink}
              onOpenMissingDefinitionModal={onOpenMissingDefinitionModal}
            />
          )}
        </Stack>
      </Grid.Col>

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
            onClick={onOpenImageModal}
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
  );
}
