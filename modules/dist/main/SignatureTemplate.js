"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const libauth_1 = require("@bitauth/libauth");
const utils_1 = require("@cashscript/utils");
const interfaces_js_1 = require("./interfaces.js");
class SignatureTemplate {
    constructor(signer, hashtype = interfaces_js_1.HashType.SIGHASH_ALL) {
        this.hashtype = hashtype;
        if (isKeypair(signer)) {
            const wif = signer.toWIF();
            this.privateKey = decodeWif(wif);
        }
        else if (typeof signer === 'string') {
            this.privateKey = decodeWif(signer);
        }
        else {
            this.privateKey = signer;
        }
    }
    generateSignature(payload, secp256k1, bchForkId) {
        const signature = secp256k1.signMessageHashSchnorr(this.privateKey, payload);
        return Uint8Array.from([...signature, this.getHashType(bchForkId)]);
    }
    getHashType(bchForkId = true) {
        return bchForkId ? (this.hashtype | libauth_1.SigningSerializationFlag.forkId) : this.hashtype;
    }
    getPublicKey(secp256k1) {
        return secp256k1.derivePublicKeyCompressed(this.privateKey);
    }
}
exports.default = SignatureTemplate;
function isKeypair(obj) {
    return typeof obj.toWIF === 'function';
}
function decodeWif(wif) {
    const result = (0, libauth_1.decodePrivateKeyWif)({ hash: utils_1.sha256 }, wif);
    if (typeof result === 'string') {
        throw new Error(result);
    }
    return result.privateKey;
}
//# sourceMappingURL=SignatureTemplate.js.map