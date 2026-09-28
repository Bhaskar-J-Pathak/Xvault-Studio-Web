const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const sourceDir = "/home/arthur/Pictures/Screenshots";
const output = "/tmp/xvault-contact-sheet.png";

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

async function main() {
  const files = fs.readdirSync(sourceDir)
    .filter((file) => file.endsWith(".png"))
    .sort()
    .slice(-28);
  const cells = [];

  for (let index = 0; index < files.length; index += 1) {
    const left = (index % 4) * 330;
    const top = Math.floor(index / 4) * 220;
    const thumbnail = await sharp(path.join(sourceDir, files[index]))
      .resize({ width: 320, height: 180, fit: "contain", background: "#eae7e2" })
      .png()
      .toBuffer();
    const label = escapeXml(files[index].replace("Screenshot From ", "").replace(".png", ""));
    const labelSvg = Buffer.from(
      '<svg width="320" height="32"><text x="4" y="21" font-family="sans-serif" font-size="12" fill="#111">' +
      label +
      "</text></svg>"
    );
    cells.push({ input: thumbnail, left, top });
    cells.push({ input: labelSvg, left, top: top + 182 });
  }

  await sharp({
    create: {
      width: 1310,
      height: Math.ceil(files.length / 4) * 220,
      channels: 3,
      background: "#f5f3ef",
    },
  }).composite(cells).png().toFile(output);
  process.stdout.write(files.join("\n") + "\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
