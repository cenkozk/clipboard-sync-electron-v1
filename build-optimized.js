const fs = require("fs");
const path = require("path");

// Clean up unnecessary files before building
function cleanupBeforeBuild() {
  console.log("🧹 Cleaning up before build...");

  const dirsToClean = ["dist", "renderer"];
  dirsToClean.forEach((dir) => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`✅ Removed ${dir}`);
    }
  });
}

// Clean up after build to reduce size
function cleanupAfterBuild() {
  console.log("🧹 Cleaning up after build...");

  const distPath = path.join(__dirname, "dist");
  if (!fs.existsSync(distPath)) return;

  // Remove unnecessary files from dist
  const filesToRemove = ["latest.yml", "latest-mac.yml", "latest-linux.yml"];

  filesToRemove.forEach((file) => {
    const filePath = path.join(distPath, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Removed ${file}`);
    }
  });

  console.log("🎯 Build cleanup completed!");
}

// Main function
function main() {
  const command = process.argv[2];

  switch (command) {
    case "pre":
      cleanupBeforeBuild();
      break;
    case "post":
      cleanupAfterBuild();
      break;
    default:
      console.log("Usage: node build-optimized.js [pre|post]");
      console.log("  pre  - Clean before build");
      console.log("  post - Clean after build");
  }
}

main();
