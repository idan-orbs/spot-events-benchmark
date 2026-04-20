import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const pnpmRoots = [
  path.join(repoRoot, "node_modules", ".pnpm"),
  path.join(repoRoot, "generated", "node_modules", ".pnpm"),
];

const envSafeShim = await readFile(
  path.join(repoRoot, "scripts", "templates", "rescript-envsafe-shim.mjs"),
  "utf8",
);

async function pathExists(targetPath) {
  try {
    await readFile(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function patchEnvSafePackage(packagePath) {
  const srcDir = path.join(packagePath, "src");
  const shimPath = path.join(srcDir, "EnvSafe.res.mjs");

  if (await pathExists(shimPath)) {
    return false;
  }

  await mkdir(srcDir, { recursive: true });
  await writeFile(shimPath, envSafeShim, "utf8");
  return true;
}

async function patchUnderPnpmRoot(pnpmRoot) {
  let entries = [];

  try {
    entries = await readdir(pnpmRoot, { withFileTypes: true });
  } catch {
    return 0;
  }

  let patched = 0;

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith("rescript-envsafe@")) {
      continue;
    }

    const packagePath = path.join(pnpmRoot, entry.name, "node_modules", "rescript-envsafe");
    if (await patchEnvSafePackage(packagePath)) {
      patched += 1;
    }
  }

  return patched;
}

let patchedCount = 0;
for (const pnpmRoot of pnpmRoots) {
  patchedCount += await patchUnderPnpmRoot(pnpmRoot);
}

if (patchedCount > 0) {
  console.log("Patched " + patchedCount + " rescript-envsafe installation(s) for Envio.");
}
