import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reportsRoot = path.resolve(__dirname, "..");
const handlersDir = path.join(reportsRoot, "src", "handlers");
const registryPath = path.join(reportsRoot, "src", "registry", "report-registry.ts");

function toCamelCase(value) {
  return value
    .split("-")
    .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join("");
}

function toTitleCase(value) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function printUsage() {
  process.stdout.write(
    [
      "Usage:",
      '  pnpm --filter @reportplatform/reports report:new <report-key> [--name "Report Name"] [--description "..."] [--formats xlsx,pdf]',
      "",
      "Example:",
      "  pnpm --filter @reportplatform/reports report:new inventory-snapshot --formats xlsx",
      "",
    ].join("\n"),
  );
}

function parseArgs(argv) {
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    return { shouldPrintHelp: true };
  }

  const [reportKey, ...rest] = argv;
  const options = {
    name: toTitleCase(reportKey),
    description: `Generated report handler for ${toTitleCase(reportKey)}.`,
    formats: ["xlsx"],
  };

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];

    if (token === "--name") {
      options.name = rest[index + 1] ?? options.name;
      index += 1;
      continue;
    }

    if (token === "--description") {
      options.description = rest[index + 1] ?? options.description;
      index += 1;
      continue;
    }

    if (token === "--formats") {
      const formats = (rest[index + 1] ?? "")
        .split(/[,\s]+/)
        .map((item) => item.trim())
        .filter(Boolean);
      if (formats.length > 0) {
        options.formats = formats;
      }
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(reportKey)) {
    throw new Error("`report-key` must be in kebab-case, for example: inventory-snapshot.");
  }

  return {
    shouldPrintHelp: false,
    reportKey,
    options,
  };
}

function buildHandlerSource({ reportKey, constName, options }) {
  const formatsLiteral = options.formats.map((format) => `"${format}"`).join(", ");
  const defaultFormat = options.formats[0];

  return `import type { ReportHandler } from "../contracts/report-handler.js";
import { buildStubReportContent } from "../services/stub-report-content.service.js";

export const ${constName}: ReportHandler = {
  descriptor: {
    key: "${reportKey}",
    name: "${options.name}",
    description: "${options.description}",
    formats: [${formatsLiteral}],
  },
  generate(run) {
    return Promise.resolve({
      fileExtension: "${defaultFormat}",
      content: buildStubReportContent("${options.name}", run),
    });
  },
};
`;
}

async function updateRegistry({ reportKey, constName }) {
  const handlerFileName = `${reportKey}.handler.js`;
  const importLine = `import { ${constName} } from "../handlers/${handlerFileName}";`;
  const registryContent = await readFile(registryPath, "utf8");

  if (registryContent.includes(importLine)) {
    throw new Error(`Registry already contains import for "${reportKey}".`);
  }

  const importRegex = /^import \{ .* \} from "\.\.\/handlers\/.*\.handler\.js";$/gm;
  const importMatches = [...registryContent.matchAll(importRegex)];
  if (importMatches.length === 0) {
    throw new Error("Cannot find handler import block in report-registry.ts.");
  }

  const lastImportMatch = importMatches[importMatches.length - 1];
  const importInsertPosition = lastImportMatch.index + lastImportMatch[0].length;
  const withImport = `${registryContent.slice(0, importInsertPosition)}\n${importLine}${registryContent.slice(importInsertPosition)}`;

  const handlersBlockRegex = /const reportHandlers: ReportHandler\[] = \[([\s\S]*?)\];/m;
  const handlersBlockMatch = withImport.match(handlersBlockRegex);
  if (!handlersBlockMatch) {
    throw new Error("Cannot find reportHandlers array in report-registry.ts.");
  }

  const rawHandlers = handlersBlockMatch[1]
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (rawHandlers.includes(constName)) {
    throw new Error(`Registry already contains "${constName}" in reportHandlers.`);
  }

  const nextHandlers = [...rawHandlers, constName];
  const nextArraySource = `const reportHandlers: ReportHandler[] = [\n  ${nextHandlers.join(",\n  ")},\n];`;
  const updatedRegistry = withImport.replace(handlersBlockRegex, nextArraySource);

  await writeFile(registryPath, updatedRegistry, "utf8");
}

function printResult({ reportKey, constName, options, handlerPath }) {
  const result = {
    status: "ok",
    reportKey,
    handlerName: constName,
    formats: options.formats,
    files: {
      created: path.relative(reportsRoot, handlerPath),
      updated: "src/registry/report-registry.ts",
    },
  };

  process.stdout.write(`Result:\n${JSON.stringify(result, null, 2)}\n\n`);
  process.stdout.write(
    [
      "Next steps:",
      "- Customize generate(...) implementation",
      "- Run: pnpm --filter @reportplatform/reports typecheck",
      "- Verify: GET /api/reports",
      "",
    ].join("\n"),
  );
}

async function main() {
  const parsedArgs = parseArgs(process.argv.slice(2));
  if (parsedArgs.shouldPrintHelp) {
    printUsage();
    return;
  }

  const { reportKey, options } = parsedArgs;
  const constName = `${toCamelCase(reportKey)}Handler`;
  const handlerPath = path.join(handlersDir, `${reportKey}.handler.ts`);

  if (existsSync(handlerPath)) {
    throw new Error(`Handler already exists: ${path.relative(reportsRoot, handlerPath)}`);
  }

  const source = buildHandlerSource({ reportKey, constName, options });
  await writeFile(handlerPath, source, "utf8");
  await updateRegistry({ reportKey, constName });
  printResult({ reportKey, constName, options, handlerPath });
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
