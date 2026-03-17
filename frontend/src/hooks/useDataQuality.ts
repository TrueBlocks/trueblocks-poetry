import { useMemo } from "react";
import * as parser from "@/types/parser";
import { db } from "@models";
import { stripPossessive } from "@utils/references";
import { parseReferenceTags } from "@utils/tagParser";

export interface DataQualityResult {
  unlinkedRefs: string[];
  extraLinks: (string | undefined)[];
  hasMissingDefinition: boolean;
  typeMismatches: { word: string; expectedType: string; actualType: string }[];
  hasIssues: boolean;
}

export function useDataQuality(
  entity: db.Entity | null,
  links: Awaited<
    ReturnType<
      typeof import("@wailsjs/go/services/EntityService").GetRelationshipsWithDetails
    >
  > | null,
  allItems: db.Entity[] | null,
  linkedItemsData: Record<number, db.Entity>,
  id: string | undefined,
): DataQualityResult | null {
  return useMemo(() => {
    if (!entity || !links || !allItems) return null;

    let allRefObjects: { word: string; type: string }[] = [];

    const collectRefs = (text: string | undefined) => {
      if (!text) return;
      const tags = parseReferenceTags(text);
      tags.forEach((tag) => {
        if (tag.type === "reference" && tag.refWord && tag.refType) {
          const word =
            tag.refType === "writer"
              ? stripPossessive(tag.refWord)
              : tag.refWord;
          allRefObjects.push({ word, type: tag.refType });
        }
      });
    };

    if (
      entity.attributes?.parsedDefinition &&
      entity.attributes.parsedDefinition.length > 0
    ) {
      const extractRefsFromTokens = (tokens?: parser.Token[]) => {
        if (!tokens) return;
        tokens.forEach((t) => {
          if (t.refType && t.refWord) {
            const word =
              t.refType === "writer" ? stripPossessive(t.refWord!) : t.refWord!;
            allRefObjects.push({ word, type: t.refType });
          }
        });
      };

      (entity.attributes.parsedDefinition as parser.Segment[]).forEach(
        (segment) => {
          extractRefsFromTokens(segment.tokens);
          extractRefsFromTokens(segment.preTokens);
          extractRefsFromTokens(segment.postTokens);
        },
      );
    } else {
      collectRefs(entity.description);
    }

    collectRefs(entity.attributes.derivation);
    collectRefs(entity.attributes.appendicies);

    const uniqueRefs = new Map<string, { word: string; type: string }>();
    allRefObjects.forEach((ref) => {
      uniqueRefs.set(
        `${ref.word.toLowerCase()}|${ref.type.toLowerCase()}`,
        ref,
      );
    });
    allRefObjects = Array.from(uniqueRefs.values());

    const allRefsWords = allRefObjects.map((r) => r.word);

    const outgoingLinks = links.filter((link) => link.sourceId === Number(id));
    const linkedWords = outgoingLinks
      .map((link) => {
        const linkedId = link.targetId;
        const linkedItem = linkedItemsData?.[linkedId];
        return linkedItem?.primaryLabel;
      })
      .filter(Boolean);

    const unlinkedRefs = allRefsWords.filter(
      (ref) =>
        ref !== undefined &&
        !linkedWords.some(
          (w) => w !== undefined && w.toLowerCase() === ref.toLowerCase(),
        ),
    );

    const extraLinks = linkedWords.filter(
      (primaryLabel) =>
        primaryLabel !== undefined &&
        !allRefsWords.some(
          (ref) =>
            ref !== undefined &&
            ref.toLowerCase() === primaryLabel.toLowerCase(),
        ),
    );

    const incomingLinks = links.filter((link) => link.targetId === Number(id));
    const hasMissingDefinition =
      (!entity.description ||
        entity.description.trim() === "" ||
        entity.description.trim().toUpperCase() === "MISSING DATA") &&
      incomingLinks.length === 1;

    const typeMismatches: {
      word: string;
      expectedType: string;
      actualType: string;
    }[] = [];

    allRefObjects.forEach((ref) => {
      const matchedEntity = allItems.find(
        (item) => item.primaryLabel.toLowerCase() === ref.word.toLowerCase(),
      );

      if (matchedEntity) {
        let expected = ref.type.toLowerCase();
        if (expected === "w") expected = "word";
        if (expected === "p") expected = "person";
        if (expected === "t") expected = "title";
        if (expected === "word") expected = "reference";

        let actual = matchedEntity.typeSlug.toLowerCase();

        if (expected !== actual) {
          if (expected === "reference" && actual === "word") return;

          typeMismatches.push({
            word: ref.word,
            expectedType: expected,
            actualType: actual,
          });
        }
      }
    });

    return {
      unlinkedRefs,
      extraLinks,
      hasMissingDefinition,
      typeMismatches,
      hasIssues:
        unlinkedRefs.length > 0 ||
        extraLinks.length > 0 ||
        hasMissingDefinition ||
        typeMismatches.length > 0,
    };
  }, [entity, links, allItems, linkedItemsData, id]);
}
