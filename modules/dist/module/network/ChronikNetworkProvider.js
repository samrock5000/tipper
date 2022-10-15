var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { binToHex, cashAddressToLockingBytecode, 
// hexToBin,
lockingBytecodeToAddressContents, } from "@bitauth/libauth";
export default class ChronikNetworkProvider {
    constructor(network, chronik) {
        this.network = network;
        this.chronik = chronik;
    }
    getUtxos(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const addr = cashAddressToLockingBytecode(address);
            const addressBytecode = addr.bytecode;
            const addrContent = lockingBytecodeToAddressContents(addressBytecode);
            const addrType = addrContent.type;
            // const addrScriptType = addrType//addrContent.type === 'P2SH' ? "p2sh" : "p2pkh"
            // const payload = binToHex(addrContent.payload)
            const chronikUtxoResult = yield this.chronik
                .script(addrType.toLowerCase().toString(), binToHex(addrContent.payload))
                .utxos();
            if (chronikUtxoResult[0] === undefined) {
                const utxos = [null].map((utxo) => ({
                    txid: null,
                    vout: null,
                    satoshis: parseInt("0"),
                    //
                }));
                return utxos;
            }
            const utxos = chronikUtxoResult[0].utxos.map((utxo) => ({
                txid: utxo.outpoint.txid,
                vout: utxo.outpoint.outIdx,
                satoshis: parseInt(utxo.value, 10),
                //
            }));
            return utxos;
        });
    }
    getBlockHeight() {
        return __awaiter(this, void 0, void 0, function* () {
            const height = this.chronik.blockchainInfo();
            return (yield height).tipHeight;
        });
    }
    getRawTransaction(txid) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = this.chronik.tx(txid);
            return JSON.stringify(tx);
        });
    }
    sendRawTransaction(txHex) {
        return __awaiter(this, void 0, void 0, function* () {
            const rawTx = this.chronik.broadcastTx(txHex, true);
            return (yield rawTx).txid;
        });
    }
}
// interface ChronikClientClass {
//   Address: {
//     utxo(address: string): Promise<{ utxos: Utxo[] }>;
//   };
//   Blockchain: {
//     getBlockCount(): Promise<number>;
//   };
//   RawTransactions: {
//     getRawTransaction(txid: string): Promise<string>;
//     sendRawTransaction(txHex: string): Promise<string>;
//   };
// }
//# sourceMappingURL=ChronikNetworkProvider.js.map