import { useMantineColorScheme } from "@mantine/core";
import { Fragment } from "react";
import { PoemRenderer } from "./PoemRenderer";
import { ReferenceLink } from "./ReferenceLink";
import { parseReferenceTags, parseTextSegments } from "@utils/tagParser";
import { stripPossessive } from "@utils/references";
import { database } from "@models";
import * as parser from "@/types/parser";

interface DefinitionRendererProps {
  text: string;
  allEntities: database.Entity[];
  stopAudio: () => void;
  currentAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  entity?: database.Entity;
}

export function DefinitionRenderer({
  text,
  allEntities,
  stopAudio,
  currentAudioRef,
  entity,
}: DefinitionRendererProps) {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  // Helper to render tokens from backend parser
  const renderTokens = (tokens: parser.Token[], keyPrefix: string) => {
    if (!tokens) return null;

    return tokens.map((token, idx) => {
      if (token.type === "text") {
        return <span key={`${keyPrefix}-text-${idx}`}>{token.content}</span>;
      }

      // Handle reference tag
      const matchWord =
        token.refType === "writer"
          ? stripPossessive(token.refWord!)
          : token.refWord!;

      // Normalize refType to typeSlug
      let targetTypeSlug = token.refType?.toLowerCase();
      if (targetTypeSlug === "word") targetTypeSlug = "reference";

      const matchedEntity = allEntities?.find(
        (i) =>
          i.primaryLabel.toLowerCase() === matchWord.toLowerCase() &&
          i.typeSlug === targetTypeSlug,
      );

      if (matchedEntity) {
        return (
          <ReferenceLink
            key={`${keyPrefix}-ref-${idx}`}
            matchedEntity={matchedEntity}
            displayWord={token.displayWord!}
            stopAudio={stopAudio}
            currentAudioRef={currentAudioRef}
            parentEntity={entity}
          />
        );
      }

      // Unmatched reference - show as grayed out
      return (
        <span
          key={`${keyPrefix}-missing-${idx}`}
          style={{
            color: "#999",
            fontStyle: "italic",
            fontWeight: 600,
            fontVariant: "small-caps",
          }}
        >
          {token.displayWord}
        </span>
      );
    });
  };

  // Render a single line/text with reference links (Legacy Frontend Parsing)
  const renderTextWithLinks = (text: string, keyPrefix: string | number) => {
    const tags = parseReferenceTags(text);

    return tags.map((tag, idx) => {
      if (tag.type === "text") {
        return <span key={`${keyPrefix}-text-${idx}`}>{tag.content}</span>;
      }

      // Handle reference tag
      const matchWord =
        tag.refType === "writer"
          ? stripPossessive(tag.matchWord!)
          : tag.matchWord!;

      // Normalize refType to typeSlug
      let targetTypeSlug = tag.refType?.toLowerCase();
      if (targetTypeSlug === "word") targetTypeSlug = "reference";

      const matchedEntity = allEntities?.find(
        (item) =>
          item.primaryLabel.toLowerCase() === matchWord.toLowerCase() &&
          item.typeSlug === targetTypeSlug,
      );

      if (matchedEntity) {
        return (
          <ReferenceLink
            key={`${keyPrefix}-ref-${idx}`}
            matchedEntity={matchedEntity}
            displayWord={tag.displayWord!}
            stopAudio={stopAudio}
            currentAudioRef={currentAudioRef}
            parentEntity={entity}
          />
        );
      }

      // Unmatched reference - show as grayed out
      return (
        <span
          key={`${keyPrefix}-missing-${idx}`}
          style={{
            color: "#999",
            fontStyle: "italic",
            fontWeight: 600,
            fontVariant: "small-caps",
          }}
        >
          {tag.displayWord}
        </span>
      );
    });
  };

  // Use backend parsed definition if available AND it matches the text being rendered
  // This prevents the definition from being used when rendering derivation or appendicies
  const shouldUseBackendParsing =
    entity?.attributes?.parsedDefinition &&
    entity.attributes.parsedDefinition.length > 0 &&
    entity.description === text;

  if (shouldUseBackendParsing && entity?.attributes?.parsedDefinition) {
    return (
      <>
        {(entity.attributes.parsedDefinition as parser.Segment[]).map(
          (segment: parser.Segment, idx: number) => {
            if (segment.type === "poem") {
              return (
                <Fragment key={`poem-segment-${idx}`}>
                  {segment.preTokens && segment.preTokens.length > 0 && (
                    <div
                      key={`pre-poem-${idx}`}
                      style={{ marginBottom: "1rem" }}
                    >
                      {renderTokens(segment.preTokens, `pre-${idx}`)}
                    </div>
                  )}
                  <PoemRenderer
                    key={`poem-${idx}`}
                    content={segment.content}
                    renderLine={(line, lineIdx) => (
                      <>
                        {renderTextWithLinks(
                          line,
                          `poem-${idx}-line-${lineIdx}`,
                        )}
                      </>
                    )}
                  />
                  {segment.postTokens && segment.postTokens.length > 0 && (
                    <div key={`post-poem-${idx}`} style={{ marginTop: "1rem" }}>
                      {renderTokens(segment.postTokens, `post-${idx}`)}
                    </div>
                  )}
                </Fragment>
              );
            }

            if (segment.type === "quote") {
              return (
                <div
                  key={`quote-${idx}`}
                  style={{
                    margin: "1rem 0",
                    padding: "0.75rem 1rem",
                    borderLeft: `4px solid ${isDark ? "var(--mantine-color-dark-4)" : "var(--mantine-color-gray-3)"}`,
                    backgroundColor: isDark
                      ? "var(--mantine-color-dark-6)"
                      : "var(--mantine-color-gray-0)",
                    fontStyle: "italic",
                    color: isDark
                      ? "var(--mantine-color-dark-1)"
                      : "var(--mantine-color-gray-7)",
                  }}
                >
                  {renderTokens(segment.tokens || [], `quote-${idx}`)}
                </div>
              );
            }

            // Regular text segment
            return (
              <span key={`text-${idx}`}>
                {renderTokens(segment.tokens || [], `text-${idx}`)}
              </span>
            );
          },
        )}
      </>
    );
  }

  // Fallback to legacy frontend parsing
  // Check if this is a Poem (Title type + exactly one pair of brackets)
  const isPoem =
    entity?.typeSlug === "title" &&
    (text.match(/\[/g) || []).length === 1 &&
    (text.match(/\]/g) || []).length === 1;

  // Parse text into segments (quotes, poems, or regular text)
  const segments = parseTextSegments(text, isPoem);

  return (
    <>
      {segments.map((segment, idx) => {
        if (segment.type === "poem") {
          return (
            <Fragment key={`poem-segment-${idx}`}>
              {segment.preText && segment.preText.trim().length > 0 && (
                <div key={`pre-poem-${idx}`} style={{ marginBottom: "1rem" }}>
                  {renderTextWithLinks(segment.preText, `pre-${idx}`)}
                </div>
              )}
              <PoemRenderer
                key={`poem-${idx}`}
                content={segment.content}
                renderLine={(line, lineIdx) => (
                  <>
                    {renderTextWithLinks(line, `poem-${idx}-line-${lineIdx}`)}
                  </>
                )}
              />
              {segment.postText && segment.postText.trim().length > 0 && (
                <div key={`post-poem-${idx}`} style={{ marginTop: "1rem" }}>
                  {renderTextWithLinks(segment.postText, `post-${idx}`)}
                </div>
              )}
            </Fragment>
          );
        }

        if (segment.type === "quote") {
          // Check if this is a poem quote (only one quote in a Title item)
          const isPoemQuote =
            entity?.typeSlug === "title" &&
            segments.filter((s) => s.type === "quote").length === 1;

          if (isPoemQuote) {
            return (
              <PoemRenderer
                key={`quote-poem-${idx}`}
                content={segment.content}
                renderLine={(line, lineIdx) => (
                  <>
                    {renderTextWithLinks(line, `quote-${idx}-line-${lineIdx}`)}
                  </>
                )}
              />
            );
          }

          return (
            <div
              key={`quote-${idx}`}
              style={{
                margin: "1rem 0",
                padding: "0.75rem 1rem",
                borderLeft: `4px solid ${isDark ? "var(--mantine-color-dark-4)" : "var(--mantine-color-gray-3)"}`,
                backgroundColor: isDark
                  ? "var(--mantine-color-dark-6)"
                  : "var(--mantine-color-gray-0)",
                fontStyle: "italic",
                color: isDark
                  ? "var(--mantine-color-dark-1)"
                  : "var(--mantine-color-gray-7)",
              }}
            >
              {renderTextWithLinks(segment.content, `quote-${idx}`)}
            </div>
          );
        }

        // Regular text segment
        return (
          <span key={`text-${idx}`}>
            {renderTextWithLinks(segment.content, `text-${idx}`)}
          </span>
        );
      })}
    </>
  );
}
