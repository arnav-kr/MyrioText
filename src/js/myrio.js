import { encrypt, decrypt } from "./aes";
import { deflate } from "pako";

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
  // 1: version code (0 for now)
  metadata.set([0], 0);
  // 2: is encrypted
  metadata.set(key ? [255] : [0], 1);
  // 3: type of encoding (only 0 for now)
  metadata.set([0], 2);
  // 4: unit size
  metadata.set([unitSize], 3);

  let compressed = deflate(data);

  let codePoints = new Uint8Array(metadata.length + compressed.length);
  codePoints.set(metadata, 0);
  codePoints.set(compressed, 4);
  console.log(codePoints);

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
      console.log(x, y, unitSize, colorData[c]);
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

  console.log(ctx.getImageData(0, 0, 1, 1));
  let metadata = Array.from(ctx.getImageData(0, 0, 1, 1).data);
  let version = metadata[0];
  let isEncrypted = metadata[1] === 255;
  let type = metadata[2];
  let unitSize = metadata[3];
  console.log("Metadata:", { version, isEncrypted, type, unitSize });

  let result = []
  for (var y = 0; y < canvas.width; y += unitSize) {
    for (var x = 0; x < canvas.height; x += unitSize) {
      var imageData = ctx.getImageData(x + unitSize / 2, y + unitSize / 2, 1, 1);
      console.log(imageData.data);
      result.push(
        new TextDecoder('utf-8')
          .decode(
            new Uint8ClampedArray(
              imageData.data.filter(c => c !== 0)
            )
          )
      );
    }
  }
  let decodedText = result.join("").trim();
  if (key) {
    decodedText = await decrypt(decodedText, key);
  }
  console.log("Decoded:", decodedText);
  return decodedText;
}