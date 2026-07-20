import { execFileSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatedDirectoryNames = new Set([
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".catalog-manager",
  "playwright-report",
  "test-results",
  "blob-report",
  ".git",
]);
const forbiddenPathPatterns = [...generatedDirectoryNames]
  .map((name) => new RegExp(`(^|/)${name.replace(".", "\\.")}/`));
const secretNamePatterns = [
  /(^|\/)\.env(?:\.|$)/,
  /(^|\/)(?:id_rsa|id_ed25519)(?:\.|$)/,
  /(^|\/).*(?:secret|credential|private-key).*/i,
];

const getTrackedFiles = () => {
  try {
    const insideWorkTree = execFileSync(
      "git",
      ["rev-parse", "--is-inside-work-tree"],
      { cwd: projectRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    if (insideWorkTree !== "true") return null;
    return execFileSync("git", ["ls-files", "-z"], {
      cwd: projectRoot,
      encoding: "utf8",
    }).split("\0").filter(Boolean);
  } catch {
    return null;
  }
};

const walkSourceFiles = async (directory = projectRoot, relativeDirectory = "") => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.posix.join(relativeDirectory, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      if (generatedDirectoryNames.has(entry.name)) continue;
      files.push(...await walkSourceFiles(path.join(directory, entry.name), relativePath));
      continue;
    }
    if (entry.isFile()) files.push(relativePath);
  }
  return files;
};

const trackedFiles = getTrackedFiles();
const sourceFiles = trackedFiles || await walkSourceFiles();
const violations = sourceFiles.filter((file) =>
  (trackedFiles && forbiddenPathPatterns.some((pattern) => pattern.test(file)))
  || secretNamePatterns.some((pattern) => pattern.test(file))
);

if (violations.length) {
  console.error("Source tree tidak bersih. File terlarang ditemukan:");
  for (const file of violations) console.error(`- ${file}`);
  process.exit(1);
}

if (trackedFiles) {
  console.log(`Source tree bersih: ${sourceFiles.length} file tracked, tanpa dependency/build/state lokal/secret.`);
} else {
  console.log(`Source tree valid: ${sourceFiles.length} file source diperiksa; folder generated diabaikan karena metadata Git tidak tersedia.`);
}
