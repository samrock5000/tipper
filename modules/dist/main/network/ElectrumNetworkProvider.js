"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const libauth_1 = require("@bitauth/libauth");
const utils_1 = require("@cashscript/utils");
const electrum_cash_1 = require("electrum-cash");
const interfaces_js_1 = require("../interfaces.js");
const utils_js_1 = require("../utils.js");
class ElectrumNetworkProvider {
    constructor(network = interfaces_js_1.Network.MAINNET, electrum, manualConnectionManagement) {
        this.network = network;
        this.manualConnectionManagement = manualConnectionManagement;
        this.concurrentRequests = 0;
        // If a custom Electrum Cluster is passed, we use it instead of the default.
        if (electrum) {
            this.electrum = electrum;
            return;
        }
        if (network === interfaces_js_1.Network.MAINNET) {
            // Initialise a 2-of-3 Electrum Cluster with 6 reliable hardcoded servers
            // using the first three servers as "priority" servers
            this.electrum = new electrum_cash_1.ElectrumCluster('CashScript Application', '1.4.1', 2, 3, electrum_cash_1.ClusterOrder.PRIORITY);
            this.electrum.addServer('bch.imaginary.cash', 50004, electrum_cash_1.ElectrumTransport.WSS.Scheme, false);
            this.electrum.addServer('blackie.c3-soft.com', 50004, electrum_cash_1.ElectrumTransport.WSS.Scheme, false);
            this.electrum.addServer('electroncash.de', 60002, electrum_cash_1.ElectrumTransport.WSS.Scheme, false);
            this.electrum.addServer('electroncash.dk', 50004, electrum_cash_1.ElectrumTransport.WSS.Scheme, false);
            this.electrum.addServer('bch.loping.net', 50004, electrum_cash_1.ElectrumTransport.WSS.Scheme, false);
            this.electrum.addServer('electrum.imaginary.cash', 50004, electrum_cash_1.ElectrumTransport.WSS.Scheme, false);
        }
        else if (network === interfaces_js_1.Network.TESTNET) {
            // Initialise a 1-of-2 Electrum Cluster with 2 hardcoded servers
            this.electrum = new electrum_cash_1.ElectrumCluster('CashScript Application', '1.4.1', 1, 2, electrum_cash_1.ClusterOrder.PRIORITY);
            this.electrum.addServer('blackie.c3-soft.com', 60004, electrum_cash_1.ElectrumTransport.WSS.Scheme, false);
            this.electrum.addServer('electroncash.de', 60004, electrum_cash_1.ElectrumTransport.WSS.Scheme, false);
            // this.electrum.addServer('bch.loping.net', 60004, ElectrumTransport.WSS.Scheme, false);
            // this.electrum.addServer('testnet.imaginary.cash', 50004, ElectrumTransport.WSS.Scheme);
        }
        else if (network === interfaces_js_1.Network.STAGING) {
            this.electrum = new electrum_cash_1.ElectrumCluster('CashScript Application', '1.4.1', 1, 1, electrum_cash_1.ClusterOrder.PRIORITY);
            this.electrum.addServer('testnet4.imaginary.cash', 50004, electrum_cash_1.ElectrumTransport.WSS.Scheme, false);
        }
        else {
            throw new Error(`Tried to instantiate an ElectrumNetworkProvider for unsupported network ${network}`);
        }
    }
    getUtxos(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const scripthash = addressToElectrumScriptHash(address);
            const result = yield this.performRequest('blockchain.scripthash.listunspent', scripthash);
            const utxos = result.map((utxo) => ({
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
            const { height } = yield this.performRequest('blockchain.headers.subscribe');
            return height;
        });
    }
    getRawTransaction(txid) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.performRequest('blockchain.transaction.get', txid);
        });
    }
    sendRawTransaction(txHex) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.performRequest('blockchain.transaction.broadcast', txHex);
        });
    }
    connectCluster() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.electrum.startup();
            }
            catch (e) {
                return [];
            }
        });
    }
    disconnectCluster() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.electrum.shutdown();
        });
    }
    performRequest(name, ...parameters) {
        return __awaiter(this, void 0, void 0, function* () {
            // Only connect the cluster when no concurrent requests are running
            if (this.shouldConnect()) {
                this.connectCluster();
            }
            this.concurrentRequests += 1;
            yield this.electrum.ready();
            let result;
            try {
                result = yield this.electrum.request(name, ...parameters);
            }
            finally {
                // Always disconnect the cluster, also if the request fails
                // as long as no other concurrent requests are running
                if (this.shouldDisconnect()) {
                    yield this.disconnectCluster();
                }
            }
            this.concurrentRequests -= 1;
            if (result instanceof Error)
                throw result;
            return result;
        });
    }
    shouldConnect() {
        if (this.manualConnectionManagement)
            return false;
        if (this.concurrentRequests !== 0)
            return false;
        return true;
    }
    shouldDisconnect() {
        if (this.manualConnectionManagement)
            return false;
        if (this.concurrentRequests !== 1)
            return false;
        return true;
    }
}
exports.default = ElectrumNetworkProvider;
/**
 * Helper function to convert an address to an electrum-cash compatible scripthash.
 * This is necessary to support electrum versions lower than 1.4.3, which do not
 * support addresses, only script hashes.
 *
 * @param address Address to convert to an electrum scripthash
 *
 * @returns The corresponding script hash in an electrum-cash compatible format
 */
function addressToElectrumScriptHash(address) {
    // Retrieve locking script
    const lockScript = (0, utils_js_1.addressToLockScript)(address);
    // Hash locking script
    const scriptHash = (0, utils_1.sha256)(lockScript);
    // Reverse scripthash
    scriptHash.reverse();
    // Return scripthash as a hex string
    return (0, libauth_1.binToHex)(scriptHash);
}
//# sourceMappingURL=ElectrumNetworkProvider.js.map