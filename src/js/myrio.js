import { encrypt, decrypt } from "./aes";
import { deflate, inflate } from "pako";

export async function encode({ text, canvas, unitSize = 4, key }) {
  if (!text) {
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return false;
  };
  let data = !key ? text : await encrypt(text, key);
  if (typeof unitSize !== "number") { throw new Error("Unit size must be a number") }

  // keep first 4 pixels for metadata
  let metadata = new Uint8Array(4);
  // 1: unit size
  metadata.set([unitSize], 0);
  // 2: version code (0 for now)
  metadata.set([0], 1);
  // 3: is encrypted
  metadata.set(key ? [255] : [0], 2);
  // 4: type of encoding (only 0 for now)
  metadata.set([0], 3);

  let compressed = deflate(data);

  let codePoints = new Uint8Array(metadata.length + compressed.length);
  codePoints.set(metadata, 0);
  codePoints.set(compressed, 4);

  let colorData = [];

  for (let code of codePoints) {
    colorData.push(code.toString(16).padStart(8, 0));
  }
  let size = Math.ceil(Math.sqrt(colorData.length)) * unitSize;

  if (!canvas) { throw new Error("Canvas is required to draw") }
  var ctx = canvas.getContext("2d", {
    colorSpace: "display-p3",
    willReadFrequently: true
  });
  canvas.width = size;
  canvas.height = size;
  var c = 0;
  ctx.clearRect(0, 0, size, size);
  for (let y = 0; y < size; y += unitSize) {
    for (let x = 0; x < size; x += unitSize) {
      ctx.fillStyle = `#${colorData[c]}`;
      ctx.fillRect(x, y, unitSize, unitSize);
      c++;
      if (colorData.length <= c) { break; }
    }
    if (colorData.length <= c) { break; }
  }
}

export async function decode({ canvas, key }) {
  let ctx = canvas.getContext("2d", {
    colorSpace: "display-p3",
    willReadFrequently: true
  });

  let metadata = new Array(4);
  metadata[0] = ctx.getImageData(0, 0, 1, 1).data[3];
  let unitSize = metadata[0];
  for (let i = 1; i < 4; i++) {
    let imageData = ctx.getImageData(i * unitSize, 0, 1, 1);
    metadata[i] = imageData.data.filter(c => c !== 0)[0] ?? 0;
  }
  let version = metadata[1];
  let isEncrypted = metadata[2] === 255;
  let type = metadata[3];
  console.log("Metadata:", { version, isEncrypted, type, unitSize });

  if (isEncrypted && !key) {
    return { success: false, type: "requires_key", message: "This image is encrypted, please provide a key to decrypt" };
  }

  let result = [];
  for (var y = 0; y < canvas.height; y += unitSize) {
    for (var x = 0; x < canvas.width; x += unitSize) {
      if (x < 4 * unitSize && y == 0) continue;
      var imageData = ctx.getImageData(x, y, 1, 1);
      result.push(
        imageData.data.filter(c => c !== 0)[0] ?? 0
      );
    }
  }
  let decodedText = inflate(new Uint8Array(result), { to: "string" });
  if (key) {
    decodedText = await decrypt(decodedText, key);
  }
  return { success: true, data: decodedText }
}