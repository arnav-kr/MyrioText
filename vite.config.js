import { defineConfig } from 'vite';
import tailwindcss from 'tailwindcss';
import SWUpdate from './src/plugins/sw-update';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

let serverOptions = {};
let mode = process.env.NODE_ENV === "development" ? "development" : "production";
if (mode == "development") {
  // Custom HTTPS server for development
  // SSL Certificate is generated locally to trust the localhost
  serverOptions = {
    server: {
      port: 443,
      https: {
        key: readFileSync(
          process.env.HTTPS_CERTIFICATE_KEY_FILENAME_PATH,
          "ascii"
        ),
        cert: readFileSync(
          process.env.HTTPS_CERTIFICATE_FILENAME_PATH,
          "ascii"
        ),
      }
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), SWUpdate("sw.js", "public")],
  ...serverOptions,
  // manifest: true, // uncomment for PWA support
})
