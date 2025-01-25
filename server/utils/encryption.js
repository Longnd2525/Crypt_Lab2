const CryptoJS = require('crypto-js');
const crypto = require('crypto');

class EncryptionUtils {
    // Generate a random encryption key
    static generateKey() {
        return crypto.randomBytes(32).toString('hex');
    }

    // Encrypt content using AES
    static encrypt(content, key) {
        return CryptoJS.AES.encrypt(content, key).toString();
    }

    // Decrypt content using AES
    static decrypt(encryptedContent, key) {
        const decrypted = CryptoJS.AES.decrypt(encryptedContent, key);
        return decrypted.toString(CryptoJS.enc.Utf8);
    }

    // Generate a random share token
    static generateShareToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    // Hash sensitive data (if needed)
    static hash(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}

module.exports = EncryptionUtils;