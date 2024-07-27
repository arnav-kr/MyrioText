import { encrypt, decrypt } from "./aes";
import { deflate, inflate } from "pako";

export async function encode({ text, canvas, unitSize = 10, key }) {
  if (typeof unitSize !== "number") {
    return { success: false, type: "invalid_unit_size", message: "Unit size must be a number" };
  }
  if (!Number.isInteger(unitSize) || unitSize <= 0) {
    return { success: false, type: "invalid_unit_size", message: "Unit size must be an positive natural number" };
  }
  if (!text) {
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return { success: false, type: "requires_text", message: "No text provided" };
  };
  let data = !key ? text : await encrypt(text, key);
  // keep first 4 pixels for metadata
  let metadata = new Uint8Array(4);
  // 1: unit size
  metadata.set([unitSize], 0);
  // 2: version code (1 for now)
  metadata.set([1], 1);
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
  return { success: true, message: "Encoded Successfully!" };
}

export async function decode({ canvas, key }) {
  let ctx = canvas.getContext("2d", {
    colorSpace: "display-p3",
    willReadFrequently: true
  });

  let metadata = new Array(4);
  try {
    metadata[0] = ctx.getImageData(0, 0, 1, 1).data[3];
    if (metadata[0] <= 0 || !Number.isInteger(metadata[0])) {
      return { success: false, type: "invalid_image", message: "Invalid Image" };
    }
  }
  catch (e) {
    console.log(e)
    return { success: false, type: "invalid_image", message: "Invalid Image" };
  }
  let unitSize = metadata[0];
  for (let i = 1; i < 4; i++) {
    let imageData = ctx.getImageData(i * unitSize, 0, 1, 1);
    metadata[i] = imageData.data.filter(c => c !== 0)[0] ?? 0;
  }
  let version = metadata[1];
  let isEncrypted = metadata[2] === 255;
  let type = metadata[3];
  console.log("Metadata:", { unitSize, version, isEncrypted, type });

  if (version === 0) {
    return { success: false, type: "invalid_image", message: "Invalid Image" };
  }

  if (canvas.width !== canvas.height) {
    return { success: false, type: "invalid_image", message: "Invalid Image" };
  }

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
  let decodedText;
  try {
    decodedText = inflate(new Uint8Array(result), { to: "string" });
  }
  catch (e) {
    if (isEncrypted) {
      return { success: false, type: "invalid_credentials", message: "Invalid Credentials" };
    } else {
      return { success: false, type: "invalid_image", message: "Invalid Image" };
    }
  }
  if (key) {
    decodedText = await decrypt(decodedText, key);
  }
  return { success: true, data: decodedText }
}