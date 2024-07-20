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

  // for (var y = 0; y < size; y += size) {
  //   for (var x = 0; x < size; x += size) {
  //     ctx.fillStyle = "#" + data[c];
  //     ctx.fillRect(x, y, size, size);
  //     c++;
  //     if (data.length <= c) { break; }
  //   }
  //   if (data.length <= c) { break; }
  // }
  // return imgData;
}

export async function decode(image) {

}