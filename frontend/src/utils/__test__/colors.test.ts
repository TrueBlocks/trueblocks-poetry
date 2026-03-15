import { getEntityColor } from "../colors";

describe("getEntityColor", () => {
  test("Reference items are light blue", () => {
    expect(getEntityColor("Reference")).toBe("#ADD8E6");
  });

  test("Writer items are light green", () => {
    expect(getEntityColor("Writer")).toBe("#90EE90");
  });

  test("Title items are light pink", () => {
    expect(getEntityColor("Title")).toBe("#FFB6D9");
  });

  test("unknown types use default gray", () => {
    expect(getEntityColor("Unknown")).toBe("#E5E7EB");
  });

  test("custom default color", () => {
    expect(getEntityColor("Unknown", "#FF0000")).toBe("#FF0000");
  });

  test("case insensitive - lowercase reference works", () => {
    expect(getEntityColor("reference")).toBe("#ADD8E6");
  });
});
