import { encrypt, decrypt } from "./aes";

export async function encode({ text, canvas, unitSize = 4, key }) {
  if (!text) {
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return false;
  };
  let data = !key ? text : await encrypt(text, key);
  if (typeof unitSize !== "number") { throw new Error("Unit size must be a number") }
  // keep first 4 pixels for metadata
  let metadata = []
  // 1: version code (0 for now)
  metadata.push(0);
  // 2: is encrypted
  metadata.push(key ? 255 : 0);
  // 3: type of encoding (only 0 for now)
  metadata.push(0);
  // 4: unit size
  metadata.push(unitSize);


  let colorData = [metadata.map(i => i.toString(16).padStart(2, 0)).join("")];
  console.log(colorData);
  for (let char of data) {
    let code = Array.from(new TextEncoder("utf-8").encode(char)).map(i => i.toString(16));
    colorData.push(code.join("").padStart(8, 0));
  }
  let size = Math.ceil(Math.sqrt(colorData.length)) * unitSize;

  if (!canvas) { throw new Error("Canvas is required to draw") }
  var ctx = canvas.getContext("2d", {
    willReadFrequently: true,
    colorSpace: "display-p3",
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
  canvas.willReadFrequently = true;
  canvas.colorSpace = "display-p3";
  let ctx = canvas.getContext("2d", {
    willReadFrequently: true,
    colorSpace: "display-p3",
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