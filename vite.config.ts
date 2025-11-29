/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";

const root = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

let supabaseAlias: string | undefined;

try {
  require.resolve("@supabase/supabase-js");
} catch {
  supabaseAlias = resolve(root, "src/stubs/supabase-js.ts");
}

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_UI_BASE_ENV_PATH || "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(root, "src"),
      ...(supabaseAlias ? { "@supabase/supabase-js": supabaseAlias } : {}),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    coverage: { reporter: ["text", "html"] },
  },
});
