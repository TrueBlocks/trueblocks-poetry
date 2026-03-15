import { useState, useEffect } from "react";
import {
  Button,
  Group,
  Stack,
  Title,
  Text,
  Alert,
  TextInput,
  Accordion,
  ActionIcon,
  Select,
  TagsInput,
  Card,
  Divider,
  Grid,
  Paper,
  JsonInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  GetAppConfigContent,
  SaveAppConfigContent,
} from "@wailsjs/go/main/App";
import {
  AlertCircle,
  Plus,
  Trash,
  Save,
  RefreshCw,
  Code,
  LayoutList,
} from "lucide-react";
import { config } from "@wailsjs/go/models";

export function ConfigEditor() {
  const [configData, setConfigData] = useState<config.AppConfig | null>(null);
  const [rawJson, setRawJson] = useState("");
  const [mode, setMode] = useState<"form" | "json">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const content = await GetAppConfigContent();
      setRawJson(content);
      try {
        const parsed = JSON.parse(content);
        setConfigData(new config.AppConfig(parsed));
        setError(null);
      } catch (e) {
        console.error("Failed to parse config JSON:", e);
        setError("Failed to parse configuration JSON. Switched to JSON mode.");
        setMode("json");
      }
    } catch (err) {
      console.error("Failed to load config:", err);
      setError("Failed to load configuration file.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let contentToSave = rawJson;

      if (mode === "form" && configData) {
        contentToSave = JSON.stringify(configData, null, 2);
      } else {
        // Validate JSON in JSON mode
        try {
          JSON.parse(rawJson);
        } catch {
          setError("Invalid JSON format. Please correct it before saving.");
          setLoading(false);
          return;
        }
      }

      await SaveAppConfigContent(contentToSave);

      // Update both states to match
      setRawJson(contentToSave);
      if (mode === "json") {
        const parsed = JSON.parse(contentToSave);
        setConfigData(new config.AppConfig(parsed));
      }

      notifications.show({
        title: "Success",
        message:
          "Configuration saved successfully. You may need to restart the app for changes to take effect.",
        color: "green",
      });
      setError(null);
    } catch (err) {
      console.error("Failed to save config:", err);
      setError("Failed to save configuration.");
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (updater: (prev: config.AppConfig) => void) => {
    if (!configData) return;
    const newConfig = new config.AppConfig(
      JSON.parse(JSON.stringify(configData)),
    );
    updater(newConfig);
    setConfigData(newConfig);
  };

  const addEntityType = () => {
    updateConfig((cfg) => {
      cfg.entityTypes.push(
        new config.EntityType({
          slug: "new-type",
          displayName: "New Type",
          icon: "circle",
          fields: [],
          listColumns: ["primary_label"],
        }),
      );
    });
  };

  const removeEntityType = (index: number) => {
    updateConfig((cfg) => {
      cfg.entityTypes.splice(index, 1);
    });
  };

  const addField = (entityIndex: number) => {
    updateConfig((cfg) => {
      cfg.entityTypes[entityIndex].fields.push(
        new config.Field({
          key: "new_field",
          label: "New Field",
          type: "text",
        }),
      );
    });
  };

  const removeField = (entityIndex: number, fieldIndex: number) => {
    updateConfig((cfg) => {
      cfg.entityTypes[entityIndex].fields.splice(fieldIndex, 1);
    });
  };

  if (loading && !configData && !rawJson) {
    return <Text>Loading configuration...</Text>;
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Configuration Editor</Title>
        <Group>
          <Button.Group>
            <Button
              variant={mode === "form" ? "filled" : "default"}
              leftSection={<LayoutList size={16} />}
              onClick={() => setMode("form")}
              disabled={!!error && mode === "json"}
            >
              Form
            </Button>
            <Button
              variant={mode === "json" ? "filled" : "default"}
              leftSection={<Code size={16} />}
              onClick={() => {
                if (configData) {
                  setRawJson(JSON.stringify(configData, null, 2));
                }
                setMode("json");
              }}
            >
              JSON
            </Button>
          </Button.Group>
          <Button
            variant="default"
            leftSection={<RefreshCw size={16} />}
            onClick={loadConfig}
            loading={loading}
          >
            Reload
          </Button>
          <Button
            leftSection={<Save size={16} />}
            onClick={handleSave}
            loading={loading}
          >
            Save
          </Button>
        </Group>
      </Group>

      {error && (
        <Alert icon={<AlertCircle size={16} />} title="Error" color="red">
          {error}
        </Alert>
      )}

      {mode === "json" ? (
        <JsonInput
          value={rawJson}
          onChange={setRawJson}
          minRows={20}
          maxRows={30}
          autosize
          formatOnBlur
          validationError="Invalid JSON"
          styles={{ input: { fontFamily: "monospace" } }}
        />
      ) : (
        configData && (
          <Stack gap="lg">
            <Paper p="md" withBorder>
              <Title order={4} mb="md">
                Global Settings
              </Title>
              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="App Name"
                    value={configData.appName}
                    onChange={(e) =>
                      updateConfig((cfg) => {
                        cfg.appName = e.target.value;
                      })
                    }
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Version"
                    value={configData.version}
                    onChange={(e) =>
                      updateConfig((cfg) => {
                        cfg.version = e.target.value;
                      })
                    }
                  />
                </Grid.Col>
              </Grid>
            </Paper>

            <Paper p="md" withBorder>
              <Group justify="space-between" mb="md">
                <Title order={4}>Entity Types</Title>
                <Button
                  size="xs"
                  leftSection={<Plus size={14} />}
                  onClick={addEntityType}
                >
                  Add Entity Type
                </Button>
              </Group>

              <Accordion variant="separated">
                {configData.entityTypes.map((entity, index) => (
                  <Accordion.Item key={index} value={index.toString()}>
                    <Accordion.Control>
                      <Group>
                        <Text fw={500}>{entity.displayName}</Text>
                        <Text size="xs" c="dimmed">
                          ({entity.slug})
                        </Text>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Stack gap="md">
                        <Group align="flex-end">
                          <TextInput
                            label="Display Name"
                            value={entity.displayName}
                            onChange={(e) =>
                              updateConfig((cfg) => {
                                cfg.entityTypes[index].displayName =
                                  e.target.value;
                              })
                            }
                            style={{ flex: 1 }}
                          />
                          <TextInput
                            label="Slug"
                            value={entity.slug}
                            onChange={(e) =>
                              updateConfig((cfg) => {
                                cfg.entityTypes[index].slug = e.target.value;
                              })
                            }
                            style={{ flex: 1 }}
                          />
                          <TextInput
                            label="Icon"
                            value={entity.icon}
                            onChange={(e) =>
                              updateConfig((cfg) => {
                                cfg.entityTypes[index].icon = e.target.value;
                              })
                            }
                            style={{ flex: 1 }}
                          />
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={() => removeEntityType(index)}
                            mb={4}
                          >
                            <Trash size={16} />
                          </ActionIcon>
                        </Group>

                        <TagsInput
                          label="List Columns"
                          description="Columns to show in the table view (e.g., primary_label, description, attributes.gender)"
                          value={entity.listColumns || []}
                          onChange={(value) =>
                            updateConfig((cfg) => {
                              cfg.entityTypes[index].listColumns = value;
                            })
                          }
                        />

                        <Divider label="Fields" labelPosition="center" />

                        {entity.fields.map((field, fIndex) => (
                          <Card key={fIndex} withBorder p="sm">
                            <Group align="flex-start">
                              <TextInput
                                label="Label"
                                value={field.label}
                                onChange={(e) =>
                                  updateConfig((cfg) => {
                                    cfg.entityTypes[index].fields[
                                      fIndex
                                    ].label = e.target.value;
                                  })
                                }
                                style={{ flex: 1 }}
                              />
                              <TextInput
                                label="Key"
                                value={field.key}
                                onChange={(e) =>
                                  updateConfig((cfg) => {
                                    cfg.entityTypes[index].fields[fIndex].key =
                                      e.target.value;
                                  })
                                }
                                style={{ flex: 1 }}
                              />
                              <Select
                                label="Type"
                                value={field.type}
                                data={[
                                  "text",
                                  "markdown",
                                  "select",
                                  "number",
                                  "date",
                                  "boolean",
                                ]}
                                onChange={(value) =>
                                  updateConfig((cfg) => {
                                    if (value)
                                      cfg.entityTypes[index].fields[
                                        fIndex
                                      ].type = value;
                                  })
                                }
                                style={{ width: 120 }}
                              />
                              <ActionIcon
                                color="red"
                                variant="subtle"
                                mt={24}
                                onClick={() => removeField(index, fIndex)}
                              >
                                <Trash size={16} />
                              </ActionIcon>
                            </Group>
                            {field.type === "select" && (
                              <TagsInput
                                mt="xs"
                                label="Options"
                                value={field.options || []}
                                onChange={(value) =>
                                  updateConfig((cfg) => {
                                    cfg.entityTypes[index].fields[
                                      fIndex
                                    ].options = value;
                                  })
                                }
                              />
                            )}
                          </Card>
                        ))}

                        <Button
                          variant="light"
                          size="xs"
                          leftSection={<Plus size={14} />}
                          onClick={() => addField(index)}
                        >
                          Add Field
                        </Button>
                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Paper>
          </Stack>
        )
      )}
    </Stack>
  );
}
