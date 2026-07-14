import { spawnSync } from "node:child_process";
import process from "node:process";

const installs = [
  {
    label: "website DicekOut",
    args: ["ci", "--prefix", "frontend"]
  },
  {
    label: "Local Catalog Manager",
    args: [
      "ci",
      "--prefix",
      "tools/catalog-manager",
      "--registry=https://registry.npmjs.org"
    ]
  }
];

function resolveNpmInvocation(args) {
  if (process.env.npm_execpath) {
    return {
      command: process.execPath,
      args: [process.env.npm_execpath, ...args]
    };
  }

  if (process.platform === "win32") {
    return {
      command: process.env.ComSpec || "cmd.exe",
      args: ["/d", "/s", "/c", "npm", ...args]
    };
  }

  return {
    command: "npm",
    args
  };
}

console.log("\nMenyiapkan seluruh dependency DicekOut...\n");

for (const install of installs) {
  console.log(`→ Menginstal ${install.label}`);
  const invocation = resolveNpmInvocation(install.args);
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: false
  });

  if (result.error) {
    console.error(`\nInstalasi ${install.label} gagal dijalankan.`);
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`\nInstalasi ${install.label} gagal dengan exit code ${result.status}.`);
    process.exit(result.status || 1);
  }
}

console.log("\nSetup DicekOut selesai.");
console.log("Jalankan website: npm run dev");
console.log("Jalankan panel:   npm run management\n");
