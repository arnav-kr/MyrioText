/**
 * encrypts a text with a password
 * @param {string} text text to be encrypted
 * @param {string} keyText password
 * @returns {Promise<string>} encrypted text
 */
export async function encrypt(text, keyText) {
  // convert to bytes
  let data = new TextEncoder("utf-8").encode(text);
  // generate iv
  let iv = window.crypto.getRandomValues(new Uint8Array(16));
  // convert plain text key to bytes
  let keyBytes = await window.crypto.subtle.digest("SHA-256", new TextEncoder("utf-8").encode(keyText));
  // prepare key
  let key = await window.crypto.subtle.importKey("raw", keyBytes, "AES-CBC", false, ["encrypt"]);
  // encrypt
  let encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    key,
    data
  );
  encrypted = new Uint8Array(encrypted);
  // prefix iv to the encrypted data
  let result = new Uint8Array(iv.length + encrypted.length);
  result.set(iv);
  result.set(encrypted, iv.length);
  // convert to base64
  return result;
}

/**
 * decrypts an encrypted text with a password
 * @param {Uint8Array} text text to be decrypted
 * @param {string} keyText password
 * @returns {promise<string>} decrypted text
 * @throws {Error} if decryption fails
 */
export async function decrypt(data, keyText) {
  // first 16 bytes is iv
  let iv = data.slice(0, 16);
  // rest is data
  data = data.slice(16);
  // convert plain text key to bytes
  let keyBytes = await window.crypto.subtle.digest("SHA-256", new TextEncoder("utf-8").encode(keyText));
  // prepare key
  let key = await window.crypto.subtle.importKey("raw", keyBytes, "AES-CBC", false, ["decrypt"]);
  // decrypt
  let decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-CBC", iv },
    key,
    data
  );
  // convert to text
  return new TextDecoder("utf-8").decode(decrypted);
}