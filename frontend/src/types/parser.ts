export type SegmentType = "text" | "quote" | "poem";
export type TokenType = "text" | "reference";

export interface Token {
  type: TokenType;
  content: string;
  refType?: string;
  refWord?: string;
  displayWord?: string;
}

export interface Segment {
  type: SegmentType;
  content: string;
  preText?: string;
  postText?: string;
  tokens?: Token[];
  preTokens?: Token[];
  postTokens?: Token[];
}
