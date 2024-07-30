import ServiceWorkerManager from './serviceWorkerManager';

/**
 * @class PWAManager
 * @description This class is responsible for managing the PWA Installation/Update process.
 * @param {Object} options - The options object.
 * @param {String} options.serviceWorkerPath - The path to the service worker file.
 * @param {Function} options.beforeInstallPrompt - The callback function to be called before the installation prompt. Usuallly used to show an install button when this event fires.
 * @param {Function} options.appInstalled - The callback function to be called after the app is installed. Usually used to show a popup dialog to let user know the app is installed. or remove the install popup when app is installed.
 * @param {Function} options.updateAvailable - The callback function to be called when an update is Available, usually used to alert user about update, and reload page to apply updates
 * @param {Function} options.controllerChange - The callback function to be called after the controller changes. i.e. when the power goes in the hands of the new service worker. usually used to the page.
 * 
 * @example
 * import { PWAManager } from './PWAManager';
 * let PWAManagerInstance = new PWAManager({
 *  serviceWorkerPath: './sw.js',
 * beforeInstallPrompt: () => { document.querySelector('#install-button').style.display = 'block'; },
 * appInstalled: () => { document.querySelector('#install-button').style.display = 'none'; },
 * updateAvailable: () => { console.log("New Update") }
 * controllerChange: () => { document.querySelector('#update-popup').style.display = 'block'; },
 * });
 * PWAManagerInstance.init();
 * 
 * @returns {Object} - The PWAManager instance.
 */
export class PWAManager {

  constructor({
    serviceWorkerPath = './sw.js',
    beforeInstallPrompt = () => { },
    appInstalled = () => { },
    updateAvailable = () => { },
    controllerChange = () => { },
  }) {
    this.serviceWorkerPath = serviceWorkerPath;
    this.deferredPrompt = null;
    this.refreshing = false;

    this.beforeInstallPrompt = beforeInstallPrompt;
    this.appInstalled = appInstalled;
    this.updateAvailable = updateAvailable;
    this.controllerChange = controllerChange;

    if (!('serviceWorker' in navigator)) {
      console.error('ServiceWorker is not supported in this browser');
    }
  }

  init() {
    if (('serviceWorker' in navigator)) {
      this.swManager = new ServiceWorkerManager(this.serviceWorkerPath);
      this.swManager.init();

      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredPrompt = e;
        this.beforeInstallPrompt(e);
      });

      // on app installed
      window.addEventListener('appinstalled', (e) => {
        this.appInstalled(e);
        this.deferredPrompt = null;
      });

      // on service worker controller change
      navigator.serviceWorker.addEventListener('controllerchange', (e) => {
        if (this.refreshing) return;
        this.controllerChange(e);
        this.refreshing = true;
      });

      // on new update found
      window.addEventListener("updatefound", (e) => {
        this.updateAvailable(e);
      });
    }
    else {
      console.error('ServiceWorker is not supported in this browser');
    }
  }

  // show the PWA install ui in browser
  async showInstallPrompt() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      if (outcome === 'accepted') {
        this.deferredPrompt = null;
      }
    }
  }
}