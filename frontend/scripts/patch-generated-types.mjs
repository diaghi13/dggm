#!/usr/bin/env node
/**
 * patch-generated-types.mjs
 *
 * Run this script after regenerating lib/types/generated.d.ts from the backend.
 * It converts specific `type` aliases to `interface` so that
 * lib/types/generated-extensions.d.ts can merge extra fields via declaration merging.
 *
 * Usage:
 *   node scripts/patch-generated-types.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = resolve(__dirname, "../lib/types/generated.d.ts");

const CONVERSIONS = ["KitAssemblyData", "ProjectMaterialData"];

let content = readFileSync(filePath, "utf8");
let changed = false;

for (const typeName of CONVERSIONS) {
  // Match: export type TypeName = {   →   export interface TypeName {
  // Also handle the closing }; → }
  const typeRegex = new RegExp(
    `(export type ${typeName} = \\{)([\\s\\S]*?)(\\n\\};)`,
    "m",
  );
  if (typeRegex.test(content)) {
    content = content.replace(typeRegex, (_, _open, body, _close) => {
      return `export interface ${typeName} {${body}\n}`;
    });
    console.log(`✓ Converted: ${typeName}`);
    changed = true;
  } else if (content.includes(`export interface ${typeName}`)) {
    console.log(`- Already interface: ${typeName}`);
  } else {
    console.warn(`⚠ Not found: ${typeName}`);
  }
}

if (changed) {
  writeFileSync(filePath, content, "utf8");
  console.log("\nPatched: lib/types/generated.d.ts");
} else {
  console.log("\nNo changes needed.");
}
