import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypeScript,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    // Ships inside the Docker runtime image as-is (see Dockerfile), so it has to be
    // plain CommonJS with no bundler/tsx available to resolve ESM imports at runtime.
    files: ["scripts/docker-set-password.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);
