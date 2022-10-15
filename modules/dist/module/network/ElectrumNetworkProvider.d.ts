import { ElectrumCluster } from 'electrum-cash';
import { Utxo, Network } from '../interfaces.js';
import NetworkProvider from './NetworkProvider.js';
export default class ElectrumNetworkProvider implements NetworkProvider {
    network: Network;
    private manualConnectionManagement?;
    private electrum;
    private concurrentRequests;
    constructor(network?: Network, electrum?: ElectrumCluster, manualConnectionManagement?: boolean);
    getUtxos(address: string): Promise<Utxo[]>;
    getBlockHeight(): Promise<number>;
    getRawTransaction(txid: string): Promise<string>;
    sendRawTransaction(txHex: string): Promise<string>;
    connectCluster(): Promise<void[]>;
    disconnectCluster(): Promise<boolean[]>;
    private performRequest;
    private shouldConnect;
    private shouldDisconnect;
}
