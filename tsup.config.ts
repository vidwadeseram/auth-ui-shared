import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/cli/generate-schema.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
});
