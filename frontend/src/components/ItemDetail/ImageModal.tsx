import { Modal } from "@mantine/core";

interface ImageModalProps {
  opened: boolean;
  onClose: () => void;
  imageSrc: string | null;
  altText: string;
}

export function ImageModal({
  opened,
  onClose,
  imageSrc,
  altText,
}: ImageModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="auto"
      centered
      withCloseButton={false}
      padding={0}
      styles={{
        body: {
          backgroundColor: "transparent",
        },
        content: {
          backgroundColor: "transparent",
          boxShadow: "none",
        },
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <img
        src={imageSrc || ""}
        alt={altText}
        style={{
          display: "block",
          maxWidth: "90vw",
          maxHeight: "90vh",
          objectFit: "contain",
          borderRadius: "8px",
          cursor: "pointer",
        }}
        onClick={onClose}
      />
    </Modal>
  );
}
