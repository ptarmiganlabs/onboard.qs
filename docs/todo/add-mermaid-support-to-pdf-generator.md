# Add Mermaid Support to PDF Generator

## Context

Onboard.qs currently generates `README.pdf` using a simple `md-to-pdf` pipeline in `scripts/generate-readme-pdf.mjs`. This works because the README does not contain Mermaid diagrams.

HelpButton.qs has a more advanced PDF generator at `scripts/generate-readme-pdf.mjs` that preprocesses Mermaid code blocks into SVG images using `@mermaid-js/mermaid-cli` before rendering to PDF. This is required because HelpButton.qs's README contains Mermaid diagrams.

## When This Becomes Relevant

If Onboard.qs's README gains Mermaid diagrams (architecture diagrams, flow charts, etc.), the current PDF generator will produce broken output because `md-to-pdf` does not natively render Mermaid code blocks.

## Implementation Steps

1. Add `@mermaid-js/mermaid-cli` as a devDependency (match HelpButton.qs version):

    ```
    npm install --save-dev @mermaid-js/mermaid-cli
    ```

2. Update `scripts/generate-readme-pdf.mjs` to:
    - Detect Chrome/Chromium executable (same fallback chain: `google-chrome-stable` → `chromium-browser` → `chromium`)
    - Write a temporary Puppeteer config JSON with `executablePath` and `--no-sandbox` args
    - Spawn `mmdc` from `node_modules/.bin/mmdc` to convert Mermaid blocks to SVG:
        ```
        mmdc -i README.md -o README-processed.md --puppeteerConfigFile <config>
        ```
    - Pass `executablePath` to `md-to-pdf` via `launch_options`
    - Clean up intermediate files (`README-processed.md`, generated SVGs, temp config)

3. Update `package.json`:
    - Add `@mermaid-js/mermaid-cli` to devDependencies
    - The `generate-pdf` script entry already exists — no change needed there

4. Update `.github/workflows/ci.yaml`:
    - Remove any global `npm install -g @mermaid-js/mermaid-cli` step
    - The dependency will be installed via `npm ci` alongside other devDependencies

## Reference

- HelpButton.qs implementation: `helpbutton.qs/scripts/generate-readme-pdf.mjs`
- HelpButton.qs CI: `helpbutton.qs/.github/workflows/ci.yaml` (PDF step uses `npm run generate-pdf`)
- Mermaid CLI docs: https://github.com/mermaid-js/mermaid-cli

## Notes

- Keep `--no-sandbox` and `--disable-setuid-sandbox` args for CI compatibility
- Use `node:os.tmpdir()` for the temporary Puppeteer config (cross-platform)
- Resolve `mmdc` from `node_modules/.bin/mmdc` rather than using `npx` for deterministic behavior
