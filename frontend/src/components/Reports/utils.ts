import { stripPossessive } from "@utils/references";
import { SearchEntities } from "@wailsjs/go/services/EntityService";

/**
 * Helper function to strip possessive from reference word and look up entity
 */
export async function lookupEntityByRef(refWord: string) {
  const matchWord = stripPossessive(refWord);
  const results = await SearchEntities(matchWord, "");
  // Find exact match if possible
  return (
    results?.find(
      (e) => e.primaryLabel.toLowerCase() === matchWord.toLowerCase(),
    ) || results?.[0]
  );
}
