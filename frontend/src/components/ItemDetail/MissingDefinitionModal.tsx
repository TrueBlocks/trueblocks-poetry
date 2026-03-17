import { Text, Button, Group, Stack, Modal } from "@mantine/core";

interface MissingDefinitionModalProps {
  opened: boolean;
  onClose: () => void;
}

export function MissingDefinitionModal({
  opened,
  onClose,
}: MissingDefinitionModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Missing Definition"
      centered
    >
      <Stack gap="md">
        <Text>Hello World</Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>Define</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
