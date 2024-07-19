import { encrypt, decrypt } from "./aes";

export async function encode(text, unitSize, key) {
  let data = !key ? text : await encrypt(text, key);

  // keep first 4 pixels for metadata
  let metadata = []
  // 1: unit size
  metadata.push(unitSize);
  // 2: is encrypted
  metadata.push(key ? 1 : 0);
  // 3: type of encoding (only 0 for now)
  metadata.push(0);
  // 4: version code (0 for now)
  metadata.push(0);


  // array of [r, g, b, a] values
  let colorData = [metadata];
  for (let char of data) {
    let code = Array.from(new TextEncoder().encode(char));
    while (code.length < 4) {
      code.unshift(0);
    }
    colorData.push(code);
  }
  let size = Math.ceil(Math.sqrt(colorData.length * Math.pow(unitSize, 2))) + unitSize;
  let imgData = new ImageData(size, size);
  for (let i = 0; i < size; i+= 4 * unitSize) {
    for (let j = 0; j < size; j++) {
      let index = i * size + j;
      console.log(index)
      let color = colorData[Math.floor(index / Math.pow(unitSize, 2))];
      let unit = Math.floor((index % Math.pow(unitSize, 2)) / unitSize);
      let offset = (index % Math.pow(unitSize, 2)) % unitSize;
      let pixelIndex = (i * size + j) * 4;
      imgData.data[pixelIndex] = color[0];
      imgData.data[pixelIndex + 1] = color[1];
      imgData.data[pixelIndex + 2] = color[2];
      imgData.data[pixelIndex + 3] = color[3];
    }
  }
  return imgData;
}

export async function decode(image) {

}