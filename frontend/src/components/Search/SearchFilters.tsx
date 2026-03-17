import {
  Accordion,
  Checkbox,
  Switch,
  Button,
  Text,
  Stack,
  Group,
} from "@mantine/core";
import { IconDeviceFloppy, IconTrash } from "@tabler/icons-react";
import { settings } from "@models";

interface SearchFiltersProps {
  selectedTypes: string[];
  setSelectedTypes: (types: string[]) => void;
  useRegex: boolean;
  setUseRegex: (value: boolean) => void;
  hasImage: boolean;
  setHasImage: (value: boolean) => void;
  hasTts: boolean;
  setHasTts: (value: boolean) => void;
  savedSearches: settings.SavedSearch[];
  onLoadSavedSearch: (saved: settings.SavedSearch) => void;
  onDeleteSavedSearch: (name: string) => void;
  onOpenSaveModal: () => void;
  query: string;
}

export const SearchFilters = ({
  selectedTypes,
  setSelectedTypes,
  useRegex,
  setUseRegex,
  hasImage,
  setHasImage,
  hasTts,
  setHasTts,
  savedSearches,
  onLoadSavedSearch,
  onDeleteSavedSearch,
  onOpenSaveModal,
  query,
}: SearchFiltersProps) => {
  const handleTypeToggle = (type: string, checked: boolean) => {
    if (checked) {
      setSelectedTypes([...selectedTypes, type]);
    } else {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    }
  };

  return (
    <Accordion variant="contained" style={{ minWidth: "200px" }}>
      <Accordion.Item value="advanced">
        <Accordion.Control>Advanced Options</Accordion.Control>
        <Accordion.Panel>
          <Stack gap="md">
            <div>
              <Text size="sm" fw={500} mb="xs">
                Type Filters
              </Text>
              <Group>
                <Checkbox
                  label="Reference"
                  checked={selectedTypes.includes("Reference")}
                  onChange={(e) =>
                    handleTypeToggle("Reference", e.currentTarget.checked)
                  }
                />
                <Checkbox
                  label="Writer"
                  checked={selectedTypes.includes("Writer")}
                  onChange={(e) =>
                    handleTypeToggle("Writer", e.currentTarget.checked)
                  }
                />
                <Checkbox
                  label="Title"
                  checked={selectedTypes.includes("Title")}
                  onChange={(e) =>
                    handleTypeToggle("Title", e.currentTarget.checked)
                  }
                />
              </Group>
            </div>

            <Switch
              label="Regex Mode"
              description="Use regular expressions instead of full-text search"
              checked={useRegex}
              onChange={(e) => setUseRegex(e.currentTarget.checked)}
            />

            <div>
              <Text size="sm" fw={500} mb="xs">
                Media Filters
              </Text>
              <Group>
                <Checkbox
                  label="Has Image"
                  checked={hasImage}
                  onChange={(e) => setHasImage(e.currentTarget.checked)}
                />
                <Checkbox
                  label="Has TTS"
                  checked={hasTts}
                  onChange={(e) => setHasTts(e.currentTarget.checked)}
                />
              </Group>
            </div>

            <div>
              <Text size="sm" fw={500} mb="xs">
                Saved Searches
              </Text>
              {savedSearches.length > 0 ? (
                <Stack gap="xs">
                  {savedSearches.map((saved) => (
                    <Group key={saved.name} justify="space-between">
                      <Button
                        variant="light"
                        size="xs"
                        onClick={() => onLoadSavedSearch(saved)}
                      >
                        {saved.name}
                      </Button>
                      <Button
                        variant="subtle"
                        size="xs"
                        color="red"
                        onClick={() => onDeleteSavedSearch(saved.name)}
                      >
                        <IconTrash size={14} />
                      </Button>
                    </Group>
                  ))}
                </Stack>
              ) : (
                <Text size="sm" c="dimmed">
                  No saved searches
                </Text>
              )}
              <Button
                leftSection={<IconDeviceFloppy size={16} />}
                size="xs"
                variant="outline"
                mt="xs"
                onClick={onOpenSaveModal}
                disabled={!query}
              >
                Save Current Search
              </Button>
            </div>
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
};
