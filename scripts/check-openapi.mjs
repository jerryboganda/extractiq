import fs from "node:fs";
import path from "node:path";

const openApiPath = path.resolve("docs", "openapi.yaml");
const source = fs.readFileSync(openApiPath, "utf8");

const requiredSnippets = [
  "openapi: 3.0.3",
  "/auth/logout:",
  "/auth/refresh:",
  "/auth/change-password:",
  "/auth/invitations/{token}:",
  "/auth/accept-invitation:",
  "/public/demo-request:",
  "/public/contact-request:",
  "/users:",
  "/review/{id}/navigation:",
  "/export/{id}/download:",
];

const missing = requiredSnippets.filter((snippet) => !source.includes(snippet));

if (missing.length > 0) {
  console.error("OpenAPI check failed. Missing required snippets:");
  for (const snippet of missing) {
    console.error(`- ${snippet}`);
  }
  process.exit(1);
}

console.log(`OpenAPI check passed for ${openApiPath}`);
