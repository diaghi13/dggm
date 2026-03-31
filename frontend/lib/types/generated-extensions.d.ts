/**
 * GENERATED TYPE EXTENSIONS
 *
 * Use this file to extend auto-generated types from the backend (generated.d.ts)
 * with extra relation fields that the generator does not include.
 *
 * HOW TO ADD AN EXTENSION:
 *   1. In generated.d.ts, change the target:
 *        export type FooData = {  →  export interface FooData {
 *      (also change the closing `};` → `}`)
 *   2. Add the merge below:
 *        declare namespace App.Data {
 *          export interface FooData {
 *            extraField?: SomeType;
 *          }
 *        }
 *
 * Run `node scripts/patch-generated-types.mjs` after each backend regeneration
 * to re-apply the type→interface conversions automatically.
 *
 * NOTE: Do NOT redeclare fields that the backend already includes in generated.d.ts —
 * a type alias and an interface with the same name in the same namespace will conflict.
 */

// No extensions currently needed — all relation fields are generated natively.
// Add merges here as needed following the instructions above.

/**
 * ENUM ALIASES
 * Correct backend generator typos / name mismatches here.
 * Remove an alias once the backend fixes the source name.
 */
declare namespace App.Enums {
  /**
   * Backend generator typo: emitted as `AssKitemblyStatus` instead of `KitAssemblyStatus`.
   * Remove this alias once the backend is fixed.
   */
  export type KitAssemblyStatus = AssKitemblyStatus;
}
