class EncryptionService {
    static generateKey() {
        return CryptoJS.lib.WordArray.random(256/8).toString();
    }

    static async encryptFile(file, key) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const wordArray = CryptoJS.lib.WordArray.create(e.target.result);
                const encrypted = CryptoJS.AES.encrypt(wordArray, key).toString();
                resolve(encrypted);
            };
            reader.readAsArrayBuffer(file);
        });
    }

    static decryptFile(encryptedData, key) {
        const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
        return decrypted.toString(CryptoJS.enc.Utf8);
    }
}