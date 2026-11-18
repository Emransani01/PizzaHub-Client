import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Client dashboards fetch their data with `useEffect` + `fetch` (no data
      // library). The React Compiler rule flags the synchronous
      // `setLoading(true)` / `setError(null)` that begins those effects, which
      // is the pattern shown in the Next.js data-fetching guide. Genuine
      // derived-state bugs are still caught by the other hooks rules.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
