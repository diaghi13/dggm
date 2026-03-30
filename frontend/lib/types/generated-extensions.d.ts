/**
 * GENERATED TYPE EXTENSIONS
 *
 * This file extends auto-generated types from the backend (generated.d.ts)
 * with extra relation fields that the generator does not include.
 *
 * IMPORTANT: After regenerating generated.d.ts from the backend, you must:
 *   1. Change `export type KitAssemblyData = {` → `export interface KitAssemblyData {`
 *   2. Change `export type ProjectMaterialData = {` → `export interface ProjectMaterialData {`
 *   (removing the trailing semicolon on the closing `};` → `}` too)
 *
 * Then the merges below will continue to work automatically.
 *
 * Run this helper after regeneration:
 *   node scripts/patch-generated-types.mjs
 */

declare namespace App.Data {
  /** Extra relations on KitAssemblyData not in the generated DTO */
  export interface KitAssemblyData {
    warehouse?: { id: number; name: string } | null;
  }

  /** Extra relations on ProjectMaterialData not in the generated DTO */
  export interface ProjectMaterialData {
    kit_assembly?: App.Data.KitAssemblyData | null;
  }
}
