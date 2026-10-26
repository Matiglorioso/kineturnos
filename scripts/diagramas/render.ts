/**
 * Dibuja como PNG los diagramas Mermaid de la documentación (DER y arquitectura),
 * para usarlos en la tesis y donde no se renderiza Mermaid.
 *
 *   npm run diagramas
 *
 * Toma el primer bloque ```mermaid de cada documento y lo guarda en docs/diagramas/.
 */
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MERMAID_URL = "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js";
const OUTPUT_DIR = join(process.cwd(), "docs", "diagramas");

const DIAGRAMS = [
  { source: "docs/DER.md", file: "der.png" },
  { source: "docs/ARQUITECTURA.md", file: "arquitectura.png" },
];

function firstMermaidBlock(path: string): string {
  const match = /```mermaid\n([\s\S]*?)```/.exec(readFileSync(path, "utf8").replace(/\r\n/g, "\n"));
  if (!match) throw new Error(`No hay un bloque mermaid en ${path}.`);
  return match[1];
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 2 });

  for (const diagram of DIAGRAMS) {
    await page.setContent(`<!doctype html>
      <html><head><meta charset="utf-8">
      <style>body{margin:0;padding:24px;background:#fff;font-family:Arial,sans-serif}</style>
      <script src="${MERMAID_URL}"></script></head>
      <body><div id="diagrama"></div></body></html>`);
    await page.evaluate(async (code) => {
      const mermaid = (
        window as unknown as {
          mermaid: { initialize: (config: object) => void; render: (id: string, code: string) => Promise<{ svg: string }> };
        }
      ).mermaid;
      mermaid.initialize({ startOnLoad: false, theme: "neutral", er: { useMaxWidth: false }, flowchart: { useMaxWidth: false } });
      const { svg } = await mermaid.render("svg-diagrama", code);
      document.getElementById("diagrama")!.innerHTML = svg;
    }, firstMermaidBlock(diagram.source));
    await page.locator("#diagrama svg").screenshot({ path: join(OUTPUT_DIR, diagram.file) });
    console.log(`OK ${diagram.file}`);
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
