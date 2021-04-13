import { getExample } from ".";

describe("getExample", () => {
  it("works with static examples", () => {
    expect(getExample({ type: "string", example: "static example" })).toBe(
      "static example"
    );
  });

  it("works with string examples", () => {
    expect(getExample({ type: "string" })).toBe("");
  });

  it("works with number examples", () => {
    expect(getExample({ type: "integer" })).toBe(1);
    expect(getExample({ type: "number" })).toBe(1);
    expect(getExample({ type: "number", example: 0 })).toBe(0);
  });

  it("works with boolean examples", () => {
    expect(getExample({ type: "boolean" })).toBe(true);
    expect(getExample({ type: "boolean", example: false })).toBe(false);
  });

  it("works with array examples", () => {
    expect(getExample({ type: "array", items: { type: "string" } })).toEqual([
      "",
    ]);
    expect(getExample({ type: "array", items: { type: "number" } })).toEqual([
      1,
    ]);
    expect(getExample({ type: "array", items: { type: "boolean" } })).toEqual([
      true,
    ]);
  });

  it("works with object examples", () => {
    expect(
      getExample({
        type: "object",
        properties: { a: { type: "string", example: "a" } },
      })
    ).toEqual({ a: "a" });
  });

  it("works with combined examples", () => {
    expect(
      getExample({
        allOf: [
          {
            type: "object",
            properties: { a: { type: "string", example: "a" } },
          },
          {
            type: "object",
            properties: { b: { type: "string", example: "b" } },
          },
        ],
      })
    ).toEqual({ a: "a", b: "b" });
  });
});
