import { Title, Text, Group, Stack, Badge, Alert } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { DataQualityResult } from "@hooks/useDataQuality";

interface DataQualityAlertProps {
  dataQuality: DataQualityResult;
  creatingLinkFor: string | null;
  deletingLinkFor: string | null;
  onDeleteIncomingLink: () => void;
  onCreateLink: (ref: string) => void;
  onDeleteLink: (primaryLabel: string) => void;
  onOpenMissingDefinitionModal: () => void;
}

export function DataQualityAlert({
  dataQuality,
  creatingLinkFor,
  deletingLinkFor,
  onDeleteIncomingLink,
  onCreateLink,
  onDeleteLink,
  onOpenMissingDefinitionModal,
}: DataQualityAlertProps) {
  if (!dataQuality.hasIssues) return null;

  return (
    <Alert color="yellow" icon={<IconAlertTriangle size={20} />} mt="md">
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
              onClick={onOpenMissingDefinitionModal}
            >
              Missing description
            </Badge>
            <Badge
              color="red"
              variant="filled"
              style={{ cursor: "pointer" }}
              onClick={onDeleteIncomingLink}
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
                <span style={{ fontWeight: 600 }}>{mismatch.word}</span>:
                Expected{" "}
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
            References in description not linked (click to create link):
          </Text>
          <Group gap="xs" mb="md">
            {dataQuality.unlinkedRefs.map((ref: string, idx: number) => {
              const isCreating = creatingLinkFor === ref;
              return (
                <Badge
                  key={idx}
                  color="red"
                  variant="light"
                  style={{ cursor: "pointer" }}
                  onClick={() => !isCreating && onCreateLink(ref)}
                >
                  {isCreating ? "Creating..." : ref}
                </Badge>
              );
            })}
          </Group>
        </div>
      )}
      {dataQuality.extraLinks.length > 0 && (
        <div>
          <Text size="sm" fw={600} mb="xs">
            Linked items not in description (click to remove link):
          </Text>
          <Group gap="xs">
            {dataQuality.extraLinks.map(
              (primaryLabel: string | undefined, idx: number) => {
                if (!primaryLabel) return null;
                const isDeleting = deletingLinkFor === primaryLabel;
                return (
                  <Badge
                    key={idx}
                    color="orange"
                    variant="light"
                    style={{ cursor: "pointer" }}
                    onClick={() => !isDeleting && onDeleteLink(primaryLabel)}
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
  );
}
