const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

const cacheDirs = [
  path.join(root, ".next"),
  path.join(root, "node_modules", ".cache"),
];

for (const dir of cacheDirs) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`Removed ${path.relative(root, dir)}`);
  }
}

console.log("Cache limpiada. Ejecuta npm run dev o npm run build.");
