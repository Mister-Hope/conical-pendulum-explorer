import path from "path";
import { defineConfig, loadEnv, normalizePath } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { createRequire } from "node:module";
import tailwindcss from "@tailwindcss/vite";

const require = createRequire(import.meta.url);
const mathjaxDir = path.dirname(require.resolve("mathjax/package.json"));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [
      react(),
      tailwindcss(),
      viteStaticCopy({
        targets: [
          {
            src: normalizePath(path.join(mathjaxDir, "*")),
            dest: "lib/mathjax",
          },
        ],
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
        "/lib/mathjax": mathjaxDir,
      },
    },
  };
});
