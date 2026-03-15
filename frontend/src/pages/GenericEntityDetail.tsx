import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Container,
  Title,
  Text,
  Loader,
  Alert,
  Grid,
  Paper,
  Group,
  Button,
} from "@mantine/core";
import { appConfig } from "@/config";
import {
  GetEntity,
  GetRelationshipsWithDetails,
} from "@wailsjs/go/services/EntityService";
import GenericRelationshipList from "@/components/GenericRelationshipList";
import { database, services } from "@wailsjs/go/models";

export default function GenericEntityDetail() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [entity, setEntity] = useState<database.Entity | null>(null);
  const [relationships, setRelationships] = useState<
    services.RelationshipDetail[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const config = appConfig.entityTypes.find((t) => t.slug === type);

  useEffect(() => {
    if (!id) return;
    const entityId = parseInt(id);
    setLoading(true);

    Promise.all([GetEntity(entityId), GetRelationshipsWithDetails(entityId)])
      .then(([entityData, relationshipsData]) => {
        setEntity(entityData);
        setRelationships(relationshipsData || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load entity");
        setLoading(false);
      });
  }, [id]);

  if (!config) {
    return <Alert color="red">Unknown entity type: {type}</Alert>;
  }

  if (loading) {
    return <Loader />;
  }

  if (error || !entity) {
    return <Alert color="red">{error || "Entity not found"}</Alert>;
  }

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="md">
        <div>
          <Title mb="xs">{entity.primaryLabel}</Title>
          {entity.secondaryLabel && (
            <Text c="dimmed" size="lg">
              {entity.secondaryLabel}
            </Text>
          )}
        </div>
        <Button component={Link} to={`/entities/${type}`}>
          Back to List
        </Button>
      </Group>

      <Grid>
        <Grid.Col span={8}>
          <Paper p="md" withBorder mb="md">
            <Title order={3} mb="sm">
              Description
            </Title>
            <Text style={{ whiteSpace: "pre-wrap" }}>{entity.description}</Text>
          </Paper>

          {config.fields.map((field) => {
            const value = entity.attributes?.[field.key];
            if (!value) return null;

            return (
              <Paper key={field.key} p="md" withBorder mb="md">
                <Title order={4} mb="xs">
                  {field.label}
                </Title>
                <Text style={{ whiteSpace: "pre-wrap" }}>{value}</Text>
              </Paper>
            );
          })}
        </Grid.Col>

        <Grid.Col span={4}>
          <GenericRelationshipList relationships={relationships} />
        </Grid.Col>
      </Grid>
    </Container>
  );
}
