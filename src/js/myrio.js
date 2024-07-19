import { encrypt, decrypt } from "./aes";

export async function encode(text, unitSize, key) {
  let data = !key ? text : await encrypt(text, key);
  let colorData = [];
  for (let char of data) {
    let code = Array.from(new TextEncoder().encode(char));
    colorData.push(code);
  }
  let imgData = new ImageData(unitSize, unitSize);
  return imgData;
}

export async function decode(image) {

}