import './css/style.css';
import { getFile, copy, download, share, uniqueID } from "./js/utils";

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

// handle encode submit
encodeForm.addEventListener("submit", async (e) => {
  
});

// encode form button state
encodeForm.addEventListener("input", () => {
  encodeForm.querySelector("#encode-button").disabled = !encodeForm.checkValidity();
});

// decode form button state
decodeForm.addEventListener("input", () => {
  decodeForm.querySelector("#decode-button").disabled = !decodeForm.checkValidity();
});

// require key when "use encryption"
useEncryption.addEventListener("change", () => {
  let keyInput = document.getElementById("key");
  keyInput.required = useEncryption.checked;
  encodeForm.dispatchEvent(new Event("input"));
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