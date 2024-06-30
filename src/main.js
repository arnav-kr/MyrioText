import './css/style.css';

// modes
document.querySelectorAll(".mode").forEach((element) => {
  console.log(element)
  element.addEventListener("input", (e) => {
    if (e.target.value == "encode") {
      document.body.classList.add("tab-encode");
      document.body.classList.remove("tab-decode");
    } else {
      document.body.classList.add("tab-decode");
      document.body.classList.remove("tab-encode");
    }
  });
});

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