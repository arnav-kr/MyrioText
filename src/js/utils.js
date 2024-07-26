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
  return { success: true, message: "Downloaded Successfully!" };
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
  constructor({ message = "", type = "info", duration = 3000 }) {
    this.message = message;
    this.type = type;
    this.duration = duration;
    this.create();
  }

  create() {
    let toast = document.createElement("div");
    toast.classList.add("toast", this.type);
    toast.textContent = this.message;
    document.body.appendChild(toast);
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