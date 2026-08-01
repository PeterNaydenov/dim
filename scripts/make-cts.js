#!/usr/bin/env node
/**
 * make-cts.js — derive `dist/main.d.cts` from the tsc-generated
 * `dist/main.d.ts`.
 *
 * Why: the package ships both an ESM (`dist/dim.js`) and a CJS
 * (`dist/dim.cjs`) build, but tsc emits a single ESM declaration file
 * (`export default dim`). Because package.json has `"type": "module"`,
 * TypeScript treats that .d.ts as documenting an ES module — so CJS
 * consumers under `moduleResolution: node16` got TS1479 ("cannot be
 * imported with require"), and node10-resolution consumers were told to
 * use a `.default` property that does not exist at runtime
 * (`dim.cjs` does `module.exports = dim`).
 *
 * The fix is a CJS-flavoured declaration file using `export = dim`,
 * with the named types re-exported through the namespace-merging
 * pattern tsc itself emits for CommonJS sources. `package.json` points
 * the `require` condition (and the top-level `types` field) at it.
 *
 * Runs as part of `npm run build:types`. Pure Node.js, no deps.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SRC  = resolve(__dirname, '..', 'dist', 'main.d.ts')
const DEST = resolve(__dirname, '..', 'dist', 'main.d.cts')

function fail(msg, code = 1) {
    console.error(`[FAIL] ${msg}`)
    process.exit(code)
}

function main() {
    let dts
    try { dts = readFileSync(SRC, 'utf8') }
    catch { fail(`Cannot read ${SRC} — run \`tsc\` (npm run build:types) first.`) }

    if (!/^export default dim;$/m.test(dts)) {
        fail(`${SRC} has no \`export default dim;\` line — the build output changed shape; update scripts/make-cts.js.`)
    }

    // Collect the exported type names so they can be re-exported through
    // the `declare namespace dim { export { ... } }` merging pattern.
    const typeNames = [...dts.matchAll(/^export type (\w+)/gm)].map(m => m[1])

    const cts = dts
        .replace(/^export default dim;\n?/m, '')
        .replace(/^export type /gm, 'type ')
        + `declare namespace dim {\n    export { ${typeNames.join(', ')} };\n}\nexport = dim;\n`

    writeFileSync(DEST, cts)
    console.log(`[OK] Wrote ${DEST} (types: ${typeNames.join(', ')})`)
}

main()
