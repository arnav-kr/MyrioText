import './css/style.css';
import { getFile, copy, download, share } from "./js/utils";
import { encode, decode } from "./js/myrio";
import { deflate } from 'pako';

window.deflate = deflate

// processing modes
document.querySelectorAll(".mode").forEach((element) => {
  element.addEventListener("change", handleProcessingMode);
});

// copy render
document.getElementById("copy-button").addEventListener("click", async () => {
  let canvas = document.getElementById("render");
  let response = await copy(await getFile(canvas));
  console.log(response);
});

// download render
document.getElementById("download-button").addEventListener("click", async (e) => {
  let canvas = document.getElementById("render");
  let response = download(await getFile(canvas));
  console.log(response);
});

// share render
document.getElementById("share-button").addEventListener("click", async () => {
  let canvas = document.getElementById("render");
  let response = await share(await getFile(canvas));
  console.log(response);
});

// copy decoded text
document.getElementById("copy-text-button").addEventListener("click", async () => {
  let text = document.getElementById("output-text").value;
  let result = await copy(text);
  console.log(result);
});

const encodeForm = document.getElementById("encode-form");
const decodeForm = document.getElementById("decode-form");
const useEncryption = document.getElementById("use-encryption");
const imageInput = document.getElementById("image-file");

// handle encode submit
encodeForm.addEventListener("submit", async (e) => {

});

encodeForm.addEventListener("input", async () => {
  // encode form button state
  encodeForm.querySelector("#encode-button").disabled = !encodeForm.checkValidity();

  // live mode
  let live = document.getElementById("live-convert");
  if (live.checked) {
    let text = document.getElementById("text-input").value;
    let unitSize = parseInt(document.getElementById("unit-size").value);
    let key = useEncryption.checked ? document.getElementById("key").value : undefined;
    // encode text
    let canvas = document.getElementById("render");
    await encode({ text, canvas, unitSize, key });
  }
});

decodeForm.addEventListener("input", () => {
  // decode form button state
  decodeForm.querySelector("#decode-button").disabled = !decodeForm.checkValidity();
});

// require key when "use encryption"
useEncryption.addEventListener("change", () => {
  let keyInput = document.getElementById("key");
  keyInput.required = useEncryption.checked;
  encodeForm.dispatchEvent(new Event("input"));
});
// process image file
imageInput.addEventListener("change", async () => {
  let file = imageInput.files[0];
  let { name, size, type } = file;
  if (type !== "image/png") throw new Error("Only Images are allowed");
  document.getElementById("file-count").textContent = `1 File Uploaded`;
  document.getElementById("file-name").textContent = `${name} (${Math.round(size / 1024) < 1 ? (Math.round(size) + "B") : (Math.round(size / 1024) + "KB")})`;

  let canvas = document.getElementById("render");
  let ctx = canvas.getContext("2d",);
  let img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = async () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    let decodedText = await decode({ canvas, undefined });
    document.getElementById("output-text").value = decodedText;
  };
});

function handleProcessingMode(event) {
  if (event.target.value == "encode") {
    document.body.classList.add("tab-encode");
    document.body.classList.remove("tab-decode");
  } else {
    document.body.classList.add("tab-decode");
    document.body.classList.remove("tab-encode");
  }
}

function openProcessingMode(mode) {
  if (mode != "encode" && mode != "decode") return false;
  let radio = document.getElementById(`${mode}-checkbox`);
  radio.checked = true;
  radio.dispatchEvent(new Event("change"));
  return true;
}

// TODO: Uncomment the following lines to enable PWA Support
// // PWAManager
// import { PWAManager } from './js/PWAManager';
// let PWAManagerInstance = new PWAManager({
//   serviceWorkerPath: './sw.js',
//   beforeInstallPrompt: () => { },
//   appInstalled: () => { },
//   controllerChange: () => { },
//   installButton: null,
//   updateButton: null,
// });
//
// PWAManagerInstance.init();