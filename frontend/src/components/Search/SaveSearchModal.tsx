import { Modal, Stack, TextInput, Group, Button } from "@mantine/core";

interface SaveSearchModalProps {
  opened: boolean;
  onClose: () => void;
  searchName: string;
  onSearchNameChange: (value: string) => void;
  onSave: () => void;
}

export const SaveSearchModal = ({
  opened,
  onClose,
  searchName,
  onSearchNameChange,
  onSave,
}: SaveSearchModalProps) => {
  return (
    <Modal opened={opened} onClose={onClose} title="Save Search">
      <Stack>
        <TextInput
          label="Search Name"
          placeholder="My search..."
          value={searchName}
          onChange={(e) => onSearchNameChange(e.currentTarget.value)}
          autoFocus
        />
        <Group justify="flex-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save</Button>
        </Group>
      </Stack>
    </Modal>
  );
};
