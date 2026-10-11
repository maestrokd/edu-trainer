import type { LegalDocumentType } from "@/services/LegalService.ts";

const markdownModules = import.meta.glob("./**/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const pathPattern = /^\.\/(terms|privacy)\/(?:terms|privacy)-v(.+)\.md$/;

const registry = new Map<string, string>();

for (const [path, content] of Object.entries(markdownModules)) {
  const match = path.match(pathPattern);
  if (!match) continue;
  const type = match[1] === "terms" ? "TERMS" : "PRIVACY";
  registry.set(`${type}:${match[2]}`, content);
}

export const resolveLegalDocument = (type: LegalDocumentType, version: string): string | null =>
  registry.get(`${type}:${version}`) ?? null;

export const hasLegalDocument = (type: LegalDocumentType, version: string): boolean =>
  registry.has(`${type}:${version}`);
