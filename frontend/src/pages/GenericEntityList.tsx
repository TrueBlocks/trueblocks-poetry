import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Container, Title, Table, Loader, Alert } from "@mantine/core";
import { appConfig } from "@/config";
import { GetAllEntities } from "@wailsjs/go/services/EntityService";
import { db } from "@models";

export default function GenericEntityList() {
  const { type } = useParams<{ type: string }>();
  const [entities, setEntities] = useState<db.Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const config = appConfig.entityTypes.find((t) => t.slug === type);

  useEffect(() => {
    if (!type) return;
    setLoading(true);
    GetAllEntities()
      .then((data) => {
        const filtered = data.filter((e) => e.typeSlug === type);
        setEntities(filtered || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load entities");
        setLoading(false);
      });
  }, [type]);

  if (!config) {
    return <Alert color="red">Unknown entity type: {type}</Alert>;
  }

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <Alert color="red">{error}</Alert>;
  }

  const columns = config.listColumns || ["primary_label", "description"];

  return (
    <Container size="xl" py="xl">
      <Title mb="md">
        {config.displayName} List ({entities.length})
      </Title>
      <Table>
        <Table.Thead>
          <Table.Tr>
            {columns.map((col) => (
              <Table.Th key={col}>{col}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {entities.map((entity) => (
            <Table.Tr key={entity.id}>
              {columns.map((col) => (
                <Table.Td key={col}>
                  {col === "primary_label" ? (
                    <Link to={`/entities/${type}/${entity.id}`}>
                      {entity.primaryLabel}
                    </Link>
                  ) : (
                    renderCell(entity, col)
                  )}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Container>
  );
}

function renderCell(entity: db.Entity, col: string) {
  if (col.startsWith("attributes.")) {
    const key = col.split(".")[1];
    return entity.attributes?.[key] || "";
  }
  if (col === "description") return entity.description;
  if (col === "primary_label") return entity.primaryLabel;
  return "";
}
