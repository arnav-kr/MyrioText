export async function copy(data = "", name = "download") {
  let isImage = data instanceof Blob;

  if (data instanceof File) {
    name = data.name;
    data = new Blob([data], { type: data.type });
    isImage = true;
  }

  // use clipboard api if available
  if (navigator && navigator.clipboard) {
    // check for permissions
    const status = await navigator.permissions.query({
      name: 'clipboard-write',
    });
    if (status.state == "granted") {
      if (isImage) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              [data.type]: data
            })
          ]);
          return { success: true, message: "Copied Image Successfully!" };
        } catch (e) {
          console.error(e);
          return { success: false, message: "An Error Occured While Copying Image!" };
        }
      } else {
        try {
          await navigator.clipboard.writeText(data);
          return { success: true, message: "Copied Text Successfully!" };
        }
        catch (e) {
          console.error(e);
          return { success: false, message: "An Error Occured While Copying Text!" };
        }
      }
    }
    else {
      return { success: false, message: "Clipboard Permission Denied!" };
    }
  }
  // fallback to legacy trick otherwise
  else {
    if (isImage) {
      return { success: false, message: "Copying Image Not Supported on This Device!" };
    }
    else {
      let el = document.createElement('textarea');
      el.value = data;
      el.style.position = "fixed";
      el.style.left = "-9999px";
      el.style.top = "-9999px";

      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      return { success: true, message: "Copied Text Successfully!" };
    }
  }
}

export function download(data, name = "download") {
  if (data instanceof File) {
    name = data.name;
    data = new Blob([data], { type: data.type });
  }
  let url = URL.createObjectURL(data);
  let a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
  return { success: true, message: "Initiated Download!" };
}

export async function share(file) {
  if (navigator.canShare && navigator.canShare({
    title: window.title,
    files: [file]
  })) {
    try {
      await navigator.share({
        title: window.title,
        text: "",
        files: [file]
      });
      return { success: true, message: "Shared Successfully!" };
    }
    catch (e) {
      console.error(e);
      return { success: false, message: "An Error Occured While Sharing!" };
    }
  }
  else {
    return { success: false, message: "Sharing Not Supported on This Device!" };
  }
}

export function uniqueID() {
  return new Date().getTime().toString(36).slice(-6);
}

export async function getFile(canvas) {
  let result = await fetch(canvas.toDataURL("image/png")).then(r => r.blob());
  return new File([result], `${uniqueID()}_myrio.txt.png`, { type: "image/png" });
}

// Toast
export class Toast {
  constructor({ message = "", duration = 3000, type = "default" }) {
    if (!["success", "info", "error"].includes(type)) type = "default";
    this.type = type
    this.message = message;
    this.duration = duration;
    this.container = document.getElementById("toasts");
    this.icons = {
      success: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5 transition-none"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd" /></svg>',
      info: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5 transition-none"><path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clip-rule="evenodd"/></svg>',
      error: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5 transition-none"><path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" /></svg>',
      warning: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5 transition-none"><path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" /></svg>',
      default: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 20" class="w-0.5 h-5 transition-none"></svg>',
    }
    this.create();
  }

  create() {
    let toast = document.createElement("div");
    toast.classList.add("toast", this.type);
    let icon = new DOMParser().parseFromString(this.icons[this.type], "image/svg+xml").documentElement;
    let content = document.createElement("span");
    content.classList.add("transition-none");
    content.textContent = this.message;
    toast.appendChild(icon);
    toast.appendChild(content);
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("show");
      setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
          toast.remove();
        }, 300);
      }, this.duration);
    }, 100);
  }
}