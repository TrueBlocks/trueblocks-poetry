import { useState, useEffect } from "react";
import { GetEntityImage } from "@wailsjs/go/app/App";

export const SearchResultImage = ({ id }: { id: number }) => {
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    GetEntityImage(id).then(setImage);
  }, [id]);

  if (!image) return null;

  return (
    <img
      src={image}
      alt="Writer"
      style={{
        width: 50,
        height: 50,
        objectFit: "cover",
        borderRadius: 4,
        marginRight: 12,
        flexShrink: 0,
      }}
    />
  );
};
