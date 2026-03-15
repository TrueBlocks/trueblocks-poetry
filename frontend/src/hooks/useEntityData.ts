import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { GetEntityImage, GetCapabilities } from "@wailsjs/go/main/App.js";

export function useEntityImage(entityId: number, entityType: string) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (entityType === "writer") {
      GetEntityImage(entityId).then((img) => {
        if (img && img.length > 0) {
          setImageUrl(img);
        }
      });
    }
  }, [entityId, entityType]);

  return imageUrl;
}

export function useCapabilities() {
  return useQuery({
    queryKey: ["capabilities"],
    queryFn: GetCapabilities,
  });
}
