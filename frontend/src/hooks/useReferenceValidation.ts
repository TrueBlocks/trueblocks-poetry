import { useState, useEffect, useCallback, useRef } from "react";
import { GetAllEntities } from "@wailsjs/go/services/EntityService";
import { parseReferences } from "@utils/references";
import { db } from "@models";

interface ValidationResult {
  reference: string;
  exists: boolean;
  itemId?: number;
}

export function useReferenceValidation(text: string, debounceMs: number = 500) {
  const [validationResults, setValidationResults] = useState<
    Map<string, ValidationResult>
  >(new Map());
  const [debouncedText, setDebouncedText] = useState(text);
  const [allItems, setAllItems] = useState<db.Entity[] | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedText(text);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, debounceMs]);

  useEffect(() => {
    GetAllEntities()
      .then(setAllItems)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!debouncedText || !allItems) {
      setValidationResults(new Map());
      return;
    }

    const references = parseReferences(debouncedText);
    const results = new Map<string, ValidationResult>();

    for (const ref of references) {
      const matchedItem = allItems.find(
        (item: db.Entity) =>
          item.primaryLabel.toLowerCase() === ref.toLowerCase(),
      );

      results.set(ref, {
        reference: ref,
        exists: !!matchedItem,
        itemId: matchedItem?.id,
      });
    }

    setValidationResults(results);
  }, [debouncedText, allItems]);

  const getValidationForReference = useCallback(
    (reference: string): ValidationResult | undefined => {
      return validationResults.get(reference);
    },
    [validationResults],
  );

  const getMissingReferences = useCallback((): string[] => {
    return Array.from(validationResults.values())
      .filter((result) => !result.exists)
      .map((result) => result.reference);
  }, [validationResults]);

  const getExistingReferences = useCallback((): ValidationResult[] => {
    return Array.from(validationResults.values()).filter(
      (result) => result.exists,
    );
  }, [validationResults]);

  return {
    validationResults,
    getValidationForReference,
    getMissingReferences,
    getExistingReferences,
    isValidating: text !== debouncedText,
  };
}
