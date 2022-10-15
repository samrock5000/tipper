var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const RpcClientRetry = require('bitcoin-rpc-promise-retry');
export default class BitcoinRpcNetworkProvider {
    constructor(network, url, opts) {
        this.network = network;
        this.rpcClient = new RpcClientRetry(url, opts);
    }
    getUtxos(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.rpcClient.listUnspent(0, 9999999, [address]);
            const utxos = result.map((utxo) => ({
                txid: utxo.txid,
                vout: utxo.vout,
                satoshis: utxo.amount * 1e8,
            }));
            return utxos;
        });
    }
    getBlockHeight() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.rpcClient.getBlockCount();
        });
    }
    getRawTransaction(txid) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.rpcClient.getRawTransaction(txid);
        });
    }
    sendRawTransaction(txHex) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.rpcClient.sendRawTransaction(txHex);
        });
    }
    getClient() {
        return this.rpcClient;
    }
}
//# sourceMappingURL=BitcoinRpcNetworkProvider.js.map