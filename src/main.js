import './css/style.css';
import { getFile, copy, download, share, Toast, parseChannels, encodeChannels } from "./js/utils";
import { encode, decode } from "./js/myrio";
import { PWAManager } from './js/PWAManager';
globalThis.Toast = Toast;

let urlParams = new URLSearchParams(window.location.search);
let urlData = {
  text: urlParams.get("text"),
  image: urlParams.get("image"),
  key: urlParams.get("key"),
  unitSize: urlParams.get("unit_size"),
  mode: urlParams.get("mode"),
  live: urlParams.get("live"),
  encryption: urlParams.get("encryption"),
}

const encodeForm = document.getElementById("encode-form");
const decodeForm = document.getElementById("decode-form");
const useEncryption = document.getElementById("use-encryption");
const imageInput = document.getElementById("image-file");

// set processing mode
if (urlData.mode !== null) {
  if (urlData.mode === "0") openProcessingMode("encode");
  if (urlData.mode === "1") openProcessingMode("decode");
}

// set live mode
if (urlData.live !== null) {
  const live = document.getElementById("live-convert")
  if (urlData.live === "1") live.checked = true;
  if (urlData.live === "0") live.checked = false;
}

// set unit size
if (urlData.unitSize !== null && Number.isInteger(parseInt(urlData.unitSize))) {
  document.getElementById("unit-size").value = urlData.unitSize;
}

// set use encryption
if (urlData.encryption !== null) {
  if (urlData.encryption === "1") {
    useEncryption.checked = true;
    setTimeout(() => { useEncryption.dispatchEvent(new CustomEvent("change")) });
  }
  if (urlData.encryption === "0") {
    useEncryption.checked = false;
    setTimeout(() => { useEncryption.dispatchEvent(new CustomEvent("change")) });
  }
}

// set key
if (urlData.key !== null && urlData.key !== "" && urlData.encryption !== "0") {
  console.log(urlData.key, urlData.text, urlData.encryption);
  if (urlData.text !== null && urlData.text !== "") {
    document.getElementById("key").value = urlData.key;
    useEncryption.checked = true;
    setTimeout(() => { useEncryption.dispatchEvent(new CustomEvent("change")) });
  }
  if (urlData.image !== null && urlData.image !== "invalid") {
    document.getElementById("decryption-key").value = urlData.key;
  }
}

// set text
if (urlData.text !== null && urlData.text !== "") {
  document.getElementById("text-input").value = urlData.text;
  openProcessingMode("encode");
  setTimeout(() => { encodeForm.dispatchEvent(new CustomEvent("input")); });
}

// load image from data uri if valid
if (urlData.image === "invalid") {
  new Toast({ message: "Invalid Image", type: "error" });
}
if (urlData.image !== null && urlData.image !== "invalid") {
  (async () => {
    try {
      let url = decodeURIComponent(urlData.image);
      let file = await fetch(url).then(response => response.blob());
      let data = new DataTransfer();
      data.items.add(new File([file], "image.png", { type: "image/png" }));
      imageInput.files = data.files;
      openProcessingMode("decode");
      setTimeout(() => {
        imageInput.dispatchEvent(new CustomEvent("change"));
        decodeForm.dispatchEvent(new CustomEvent("input"));
      });
    } catch (error) {
      new Toast({ message: "Invalid Image", type: "error" });
    }
  })();
}

// file_handle
if ('launchQueue' in window) {
  launchQueue.setConsumer(async launchParams => {
    if (launchParams.files && launchParams.files.length) {
      const fileHandle = launchParams.files[0];
      console.log(fileHandle);
      if (fileHandle.kind == "file" && fileHandle.name.endsWith(".png")) {
        let file = await fileHandle.getFile();
        let dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        imageInput.files = dataTransfer.files;
        openProcessingMode("decode");
        setTimeout(() => {
          imageInput.dispatchEvent(new CustomEvent("change"));
          decodeForm.dispatchEvent(new CustomEvent("input"));
        });
      }
    }
  });
}

// theme toggle
document.getElementById("theme-toggle").addEventListener("click", () => {
  document.documentElement.classList.toggle('dark');
});

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

document.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.stopPropagation();
  document.getElementById("drag-popup").classList.remove("hidden");
});

// decode on drop
document.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
  document.getElementById("drag-popup").classList.add("hidden");
  if (!e.dataTransfer) return false;
  imageInput.files = e.dataTransfer.files;
  openProcessingMode("decode");
  imageInput.dispatchEvent(new CustomEvent("change"));
});

// decode on paste
document.addEventListener('paste', function (e) {
  // Get the data of clipboard
  if (!e.clipboardData) return false;
  if (!e.clipboardData.files.length) return false;
  imageInput.files = e.clipboardData.files;
  openProcessingMode("decode");
  imageInput.dispatchEvent(new CustomEvent("change"));
});

// require key when "use encryption"
useEncryption.addEventListener("input", (e) => {
  let keyInput = document.getElementById("key");
  keyInput.required = useEncryption.checked;
  // see if e is custom even, if so, then dispatch an event to encode form
  if(e instanceof CustomEvent) {
    encodeForm.dispatchEvent(new CustomEvent("input"));
  }
});

encodeForm.addEventListener("input", async () => {
  // encode form button state
  encodeForm.querySelector("#encode-button").disabled = !encodeForm.checkValidity();

  // live mode
  let live = document.getElementById("live-convert");
  if (live.checked) {
    let text = document.getElementById("text-input").value;
    let unitSize = parseInt(document.getElementById("unit-size").value);
    // let colorChannels = Array.from(document.querySelectorAll(".color-channel")).map(channel => channel.checked ? 1 : 0);
    // disable multi channel support, stick to alpha channel
    let colorChannels = [0, 0, 0, 1];
    let key = useEncryption.checked ? document.getElementById("key").value : null;
    // if (!key && useEncryption.checked) {

    //   document.getElementById("key").setCustomValidity("Key is required for encryption");
    //   return encodeForm.reportValidity();
    // }
    // else {
    //   document.getElementById("key").setCustomValidity("");
    //   encodeForm.reportValidity();
    // }
    // encode text
    let canvas = document.getElementById("render");
    let result = await encode({ text, canvas, unitSize, key, colorChannels });
    if (!result.success && ["invalid_unit_size"].includes(result.type)) {
      document.getElementById("unit-size").setCustomValidity(result.message);
      encodeForm.reportValidity();
      new Toast({ message: result.message, type: "error" });
    }
    else {
      document.getElementById("unit-size").setCustomValidity("");
      encodeForm.reportValidity();
    }
  }
}, false);

decodeForm.addEventListener("input", () => {
  // decode form button state
  decodeForm.querySelector("#decode-button").disabled = !decodeForm.checkValidity();
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
    decodeForm.dispatchEvent(new CustomEvent("decryption-key", { detail: { isRequired: result.metadata.isEncrypted } }))

    if (!result.success && result.metadata.isEncrypted && result.type === "requires_key") {
      new Toast({ message: result.message, type: "info" });
    }
    if (!result.success && ["invalid_image", "invalid_credentials"].includes(result.type)) {
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
  setTimeout(() => { radio.dispatchEvent(new CustomEvent("change")) });
  return true;
}
let installButton = document.getElementById("install-button");

// PWAManager
let PWAManagerInstance = new PWAManager({
  serviceWorkerPath: './sw.js',
  beforeInstallPrompt: () => {
    installButton.classList.toggle("hidden", false);
  },
  appInstalled: () => {
    installButton.classList.toggle("hidden", true);
  },
  updateAvailable: () => {
    new Toast({ message: "An Update is Available.\nReloading to Apply Updates", type: "info" });
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  },
  controllerChange: () => { },
});
PWAManagerInstance.init();

installButton.addEventListener("click", () => {
  PWAManagerInstance.showInstallPrompt();
});