function getEncryptionKey(byteLen = 32) {
    const array = new Uint8Array(byteLen);
    crypto.getRandomValues(array); // cryptographically secure
    // convert bytes to base64
    let binary = "";
    for (let i = 0; i < array.length; i++) {
        binary += String.fromCharCode(array[i]);
    }
    return btoa(binary); // base64 string
}

const secretKey = getEncryptionKey();
sessionStorage.setItem("encryptionKey", secretKey);