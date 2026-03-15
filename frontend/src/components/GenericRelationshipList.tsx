import { Link } from "react-router-dom";
import { Paper, Title, Text, Group, Badge } from "@mantine/core";
import { services } from "@models";

interface GenericRelationshipListProps {
  relationships: services.RelationshipDetail[];
}

export default function GenericRelationshipList({
  relationships,
}: GenericRelationshipListProps) {
  return (
    <Paper p="md" withBorder>
      <Title order={3} mb="sm">
        Relationships
      </Title>
      {relationships.length === 0 ? (
        <Text c="dimmed">No relationships found</Text>
      ) : (
        <Group>
          {relationships.map((rel) => (
            <Badge
              key={rel.id}
              variant="outline"
              component={Link}
              to={`/entities/${rel.otherEntityType}/${rel.otherEntityId}`}
              style={{ cursor: "pointer" }}
            >
              {rel.label}: {rel.otherEntityLabel}
            </Badge>
          ))}
        </Group>
      )}
    </Paper>
  );
}
