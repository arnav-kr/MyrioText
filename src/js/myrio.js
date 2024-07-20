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
  for (let char of data) {
    let code = Array.from(new TextEncoder("utf-8").encode(char)).map(i => i.toString(16));
    colorData.push(code.join("").padStart(8, 0));
  }
  let size = Math.ceil(Math.sqrt(colorData.length)) * unitSize;

  if (!canvas) { throw new Error("Canvas is required to draw") }
  var ctx = canvas.getContext("2d");
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

export async function decode(imgData) {
  console.log(imgData)

  let metadata = imgData.data[0];
  let unitSize = parseInt(metadata[0], 16);
  let isEncrypted = metadata[1] === "11";
  let type = metadata[2];
  let version = metadata[3];

  let data = imgData.data.slice(1).map(i => parseInt(i, 16));
  console.log(unitSize, isEncrypted, type, version);
  console.log(data);

  return isEncrypted ? await decrypt(data) : data;
}