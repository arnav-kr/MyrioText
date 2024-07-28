import './css/style.css';
import { getFile, copy, download, share, Toast } from "./js/utils";
import { encode, decode } from "./js/myrio";
globalThis.Toast = Toast;
// processing modes
document.querySelectorAll(".mode").forEach((element) => {
  element.addEventListener("change", handleProcessingMode);
});

// copy render
document.getElementById("copy-button").addEventListener("click", async () => {
  let canvas = document.getElementById("render");
  let result = await copy(await getFile(canvas));
  let type = result.success ? "success" : "error";
  new Toast({ message: result.message, type });
});

// download render
document.getElementById("download-button").addEventListener("click", async (e) => {
  let canvas = document.getElementById("render");
  let result = download(await getFile(canvas));
  let type = result.success ? "success" : "error";
  new Toast({ message: result.message, type });
});

// share render
document.getElementById("share-button").addEventListener("click", async () => {
  let canvas = document.getElementById("render");
  let result = await share(await getFile(canvas));
  let type = result.success ? "success" : "error";
  new Toast({ message: result.message, type });
});

// copy decoded text
document.getElementById("copy-text-button").addEventListener("click", async () => {
  let text = document.getElementById("output-text").value;
  let result = await copy(text);
  let type = result.success ? "success" : "error";
  new Toast({ message: result.message, type });
});

const encodeForm = document.getElementById("encode-form");
const decodeForm = document.getElementById("decode-form");
const useEncryption = document.getElementById("use-encryption");
const imageInput = document.getElementById("image-file");

// handle encode submit
encodeForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  let text = document.getElementById("text-input").value;
  let unitSize = parseInt(document.getElementById("unit-size").value);
  let key = useEncryption.checked ? document.getElementById("key").value : null;
  // encode text
  let canvas = document.getElementById("render");
  let result = await encode({ text, canvas, unitSize, key });
  if (!result.success && ["invalid_unit_size"].includes(result.type)) {
    document.getElementById("unit-size").setCustomValidity(result.message);
    encodeForm.reportValidity();
    new Toast({ message: result.message, type: "error" });
  }
});

// handle decode submit
decodeForm.addEventListener("submit", handleDecode);

// decode on drop


// decode on paste
document.addEventListener('paste', function (e) {
  // Get the data of clipboard
  if (!e.clipboardData) return false;
  imageInput.files = e.clipboardData.files;
  openProcessingMode("decode");
  imageInput.dispatchEvent(new Event("change"));
});

encodeForm.addEventListener("input", async () => {
  // encode form button state
  encodeForm.querySelector("#encode-button").disabled = !encodeForm.checkValidity();

  // live mode
  let live = document.getElementById("live-convert");
  if (live.checked) {
    let text = document.getElementById("text-input").value;
    let unitSize = parseInt(document.getElementById("unit-size").value);
    let key = useEncryption.checked ? document.getElementById("key").value : null;
    // encode text
    let canvas = document.getElementById("render");
    let result = await encode({ text, canvas, unitSize, key });
    if (!result.success && ["invalid_unit_size"].includes(result.type)) {
      document.getElementById("unit-size").setCustomValidity(result.message);
      encodeForm.reportValidity();
      new Toast({ message: result.message, type: "error" });
    }
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

decodeForm.addEventListener("decryption-key", (e) => {
  let keyInput = document.getElementById("decryption-key");
  keyInput.closest("div").classList.toggle("hidden", !e.detail.isRequired);
  keyInput.required = e.detail.isRequired;
  decodeForm.reportValidity();
});

// process image file
imageInput.addEventListener("change", handleDecode);

// shortcut keys handler
document.addEventListener("keydown", (e) => {
  // ignore if input
  if (e.target.tagName === "INPUT") return;
  /**
   * Encode: Shift + Alt + E 
   * Decode: Shift + Alt + D
   */
  if (e.altKey && e.shiftKey) {
    let key = e.key.toLowerCase();
    switch (key) {
      case "e":
        openProcessingMode("encode");
        break;
      case "d":
        openProcessingMode("decode");
        break;
    }
  }
});

async function handleDecode(e) {
  e.preventDefault();
  console.log(imageInput.files)

  let file = imageInput.files[0];
  if (!file) return new Toast({ message: "Pasted item is not an Image", type: "error" });
  if (file.type !== "image/png") return new Toast({ message: "Invalid File Type", type: "error" });
  let { name, size } = file;
  document.getElementById("file-count").textContent = `1 File Uploaded`;
  document.getElementById("file-name").textContent = `${name} (${Math.round(size / 1024) < 1 ? (Math.round(size) + "B") : (Math.round(size / 1024) + "KB")})`;

  let key = document.getElementById("decryption-key").value
  key = key == "" ? null : key;

  let canvas = document.getElementById("render");
  let ctx = canvas.getContext("2d",);
  let img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = async () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    let result = await decode({ canvas, key });
    if (!result.success && result.type === "requires_key") {
      new Toast({ message: result.message, type: "info" });
      return decodeForm.dispatchEvent(new CustomEvent("decryption-key", { detail: { isRequired: true } }))
    }
    if (!result.success && result.type !== "requires_key" && result.type !== "invalid_credentials") {
      decodeForm.dispatchEvent(new CustomEvent("decryption-key", { detail: { isRequired: false } }))
    }
    if (!result.success && ["invalid_image", "invalid_credentials", "requires_key"].includes(result.type)) {
      new Toast({ message: result.message, type: "error" });
    }
    if (result.success) {
      let decodedText = result.data;
      document.getElementById("output-text").value = decodedText;
      new Toast({ message: result.message, type: "success" });
    }
  };
}

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