var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export default class FullStackNetworkProvider {
    /**
     * @example
     * const BCHJS = require("@psf/bch-js")
     * let bchjs = new BCHJS({
     *   restURL: 'https://api.fullstack.cash/v3/',
     *   apiToken: 'eyJhbGciO...' // Your JWT token here.
     * })
     */
    constructor(network, bchjs) {
        this.network = network;
        this.bchjs = bchjs;
    }
    getUtxos(address) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.bchjs.Electrumx.utxo(address);
            const utxos = ((_a = result.utxos) !== null && _a !== void 0 ? _a : []).map((utxo) => ({
                txid: utxo.tx_hash,
                vout: utxo.tx_pos,
                satoshis: utxo.value,
                height: utxo.height,
            }));
            return utxos;
        });
    }
    getBlockHeight() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bchjs.Blockchain.getBlockCount();
        });
    }
    getRawTransaction(txid) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bchjs.RawTransactions.getRawTransaction(txid);
        });
    }
    sendRawTransaction(txHex) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bchjs.RawTransactions.sendRawTransaction(txHex);
        });
    }
}
//# sourceMappingURL=FullStackNetworkProvider.js.map