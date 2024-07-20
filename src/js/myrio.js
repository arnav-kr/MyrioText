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
  // 1: unit size
  metadata.push(unitSize.toString(16));
  // 2: is encrypted
  metadata.push(key ? "11" : "00");
  // 3: type of encoding (only 0 for now)
  metadata.push("00");
  // 4: version code (0 for now)
  metadata.push("00");


  let colorData = [metadata];
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
  // get first pixel and extract metadata
  let metadata = imgData[0];
  let unitSize = parseInt(metadata[0], 16);
  let isEncrypted = metadata[1] === "11";
  let type = metadata[2];
  let version = metadata[3];

  // now use unitSize info to get the centre of each individual unit pixel and remove rest of data from the image data, then use textEncoder to decode it back to text
  // as unitSize can be any number, we need to get the centre of each pixel, and get color data from that pixel, that'd be possible by offesing the values and only keep the data from centre of pixels
  let data = imgData.slice(1).map(i => parseInt(i, 16));
  
  return isEncrypted ? await decrypt(data) : data;
}