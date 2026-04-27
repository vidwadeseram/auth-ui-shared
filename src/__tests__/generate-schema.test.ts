import { describe, it, expect } from "vitest";
import { openapiToZod, camelCase } from "../cli/generate-schema.js";

describe("camelCase", () => {
  it("lowercases first character", () => {
    expect(camelCase("UserData")).toBe("userData");
    expect(camelCase("MySchema")).toBe("mySchema");
    expect(camelCase("already")).toBe("already");
  });
});

describe("openapiToZod — primitives", () => {
  it("string → z.string()", () => {
    expect(openapiToZod("x", { type: "string" })).toBe("z.string()");
  });

  it("integer → z.number().int()", () => {
    expect(openapiToZod("x", { type: "integer" })).toBe("z.number().int()");
  });

  it("number → z.number()", () => {
    expect(openapiToZod("x", { type: "number" })).toBe("z.number()");
  });

  it("boolean → z.boolean()", () => {
    expect(openapiToZod("x", { type: "boolean" })).toBe("z.boolean()");
  });

  it("unknown type → z.any()", () => {
    expect(openapiToZod("x", {})).toBe("z.any()");
  });
});

describe("openapiToZod — string formats", () => {
  it("format: email → z.email()", () => {
    expect(openapiToZod("x", { type: "string", format: "email" })).toBe("z.email()");
  });

  it("format: uuid → z.uuid()", () => {
    expect(openapiToZod("x", { type: "string", format: "uuid" })).toBe("z.uuid()");
  });

  it("format: date-time → z.coerce.date()", () => {
    expect(openapiToZod("x", { type: "string", format: "date-time" })).toBe("z.coerce.date()");
  });
});

describe("openapiToZod — nullable", () => {
  it("nullable string → z.string().nullable()", () => {
    expect(openapiToZod("x", { type: "string", nullable: true })).toBe("z.string().nullable()");
  });

  it("nullable integer → z.number().int().nullable()", () => {
    expect(openapiToZod("x", { type: "integer", nullable: true })).toBe("z.number().int().nullable()");
  });
});

describe("openapiToZod — enum", () => {
  it("string enum → z.enum([...])", () => {
    expect(openapiToZod("x", { enum: ["a", "b", "c"] })).toBe('z.enum(["a", "b", "c"])');
  });

  it("numeric enum → z.enum([...])", () => {
    expect(openapiToZod("x", { enum: [1, 2, 3] })).toBe("z.enum([1, 2, 3])");
  });
});

describe("openapiToZod — array", () => {
  it("array of strings", () => {
    expect(openapiToZod("x", { type: "array", items: { type: "string" } })).toBe("z.array(z.string())");
  });

  it("array without items → z.array(z.any())", () => {
    expect(openapiToZod("x", { type: "array" })).toBe("z.array(z.any())");
  });
});

describe("openapiToZod — object", () => {
  it("object with required and optional fields", () => {
    const schema = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        age: { type: "integer" },
      },
      required: ["id", "name"],
    };
    const result = openapiToZod("User", schema);
    expect(result).toContain("z.object(");
    expect(result).toContain("id: z.string()");
    expect(result).toContain("name: z.string()");
    expect(result).toContain("age: z.number().int().optional()");
  });

  it("object with no properties → z.object({  })", () => {
    const result = openapiToZod("Empty", { type: "object" });
    expect(result).toBe("z.object({  })");
  });
});

describe("openapiToZod — allOf", () => {
  it("allOf with two schemas → intersection", () => {
    const schema = {
      allOf: [
        { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
        { type: "object", properties: { name: { type: "string" } }, required: ["name"] },
      ],
    };
    const result = openapiToZod("Combined", schema);
    expect(result).toContain(".and(");
    expect(result).toContain("id: z.string()");
    expect(result).toContain("name: z.string()");
  });

  it("allOf with single schema → unwrapped", () => {
    const schema = {
      allOf: [{ type: "string" }],
    };
    expect(openapiToZod("x", schema)).toBe("z.string()");
  });
});

describe("openapiToZod — oneOf / anyOf", () => {
  it("oneOf → z.union([...])", () => {
    const schema = {
      oneOf: [{ type: "string" }, { type: "number" }],
    };
    const result = openapiToZod("x", schema);
    expect(result).toBe("z.union([z.string(), z.number()])");
  });

  it("anyOf → z.union([...])", () => {
    const schema = {
      anyOf: [{ type: "boolean" }, { type: "integer" }],
    };
    const result = openapiToZod("x", schema);
    expect(result).toBe("z.union([z.boolean(), z.number().int()])");
  });

  it("oneOf with single schema → unwrapped", () => {
    const schema = { oneOf: [{ type: "string" }] };
    expect(openapiToZod("x", schema)).toBe("z.string()");
  });

  it("nullable oneOf → z.union([...]).nullable()", () => {
    const schema = {
      oneOf: [{ type: "string" }, { type: "number" }],
      nullable: true,
    };
    expect(openapiToZod("x", schema)).toBe("z.union([z.string(), z.number()]).nullable()");
  });
});

describe("openapiToZod — integration: minimal OpenAPI spec schemas", () => {
  it("generates correct schema for a User-like object", () => {
    const schema = {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        email: { type: "string", format: "email" },
        created_at: { type: "string", format: "date-time" },
        role: { enum: ["admin", "user", "guest"] },
      },
      required: ["id", "email", "created_at"],
    };
    const result = openapiToZod("User", schema);
    expect(result).toContain("id: z.uuid()");
    expect(result).toContain("email: z.email()");
    expect(result).toContain("created_at: z.coerce.date()");
    expect(result).toContain('role: z.enum(["admin", "user", "guest"]).optional()');
  });
});
