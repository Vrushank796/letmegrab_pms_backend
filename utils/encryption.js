// const crypto = require("crypto");
// const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
// const IV_LENGTH = 16;

// function encrypt(text) {
//   let iv = crypto.randomBytes(IV_LENGTH);
//   let cipher = crypto.createCipheriv(
//     "aes-256-cbc",
//     Buffer.from(ENCRYPTION_KEY),
//     iv
//   );
//   let encrypted = cipher.update(text);
//   encrypted = Buffer.concat([encrypted, cipher.final()]);
//   return iv.toString("hex") + ":" + encrypted.toString("hex");
// }

// function decrypt(text) {
//   let parts = text.split(":");
//   let iv = Buffer.from(parts.shift(), "hex");
//   let encryptedText = Buffer.from(parts.join(":"), "hex");
//   let decipher = crypto.createDecipheriv(
//     "aes-256-cbc",
//     Buffer.from(ENCRYPTION_KEY),
//     iv
//   );
//   let decrypted = decipher.update(encryptedText);
//   decrypted = Buffer.concat([decrypted, decipher.final()]);
//   return decrypted.toString();
// }

// module.exports = { encrypt, decrypt };

const crypto = require("crypto");

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Must be 32 bytes for aes-256
const IV_LENGTH = 16; // For AES, IV length is always 16

// 🛠 Use a fixed IV instead of random IV
const FIXED_IV = Buffer.alloc(IV_LENGTH, 0); // 16 bytes filled with 0

function encrypt(text) {
  let cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    FIXED_IV
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

function decrypt(encryptedText) {
  let decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    FIXED_IV
  );
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

module.exports = { encrypt, decrypt };
