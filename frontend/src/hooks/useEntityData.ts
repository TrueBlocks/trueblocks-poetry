import { useState, useEffect } from "react";
import { GetEntityImage, GetCapabilities } from "@wailsjs/go/app/App";

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
  const [data, setData] = useState<Awaited<
    ReturnType<typeof GetCapabilities>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    GetCapabilities()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, isLoading: loading, error };
}
