import {
    component$,
    useStore,
    useWatch$,
    useStylesScoped$,
    PropFunction,
    useClientEffect$,
    QRL,
    $,
    Resource,
    useResource$,
    useOn,
    useServerMount$
} from "@builder.io/qwik";
import { Link } from '@builder.io/qwik-city';
import { getP2phkContract } from "../../contract";
import { createTransactionHex, checkBalance, sendRawTx } from "../../services";
import { p2pkhArtifact, getNewContract } from '../../contract'
import QRCode from "qrcode";
import { ChronikClient } from "chronik-client";
import { ChronikNetworkProvider, Contract, NetworkProvider, Argument } from "@samrock5000/cashscript"
import type { Keys, } from "../../interfaces";

export const log = console.log;

export interface SpendProps {
    apicalls: number, spent: boolean, satoshis: number, send$?: QRL<(rawTx: string) => Promise<unknown>>, rawHex: string, canSpend: boolean
}

// export const sendTx = $((rawTx: string) => {
//     return sendRawTx(rawTx)
// })

export const ShowBalance = component$((props: { keys: Keys, txstatus: SpendProps }) => {
    log("can spend", props.txstatus.canSpend)
    const store = useStore({ balance: 0, updatesBal: 0, addr: props.keys.addr, txid: '' })

    useClientEffect$(async () => {
        log("can spend", props.txstatus.canSpend)
        const chronik = new ChronikClient("https://chronik.be.cash/xec")
        const chronikNet = new ChronikNetworkProvider("mainnet", chronik)

        const interval = setInterval(async () => (log(store.updatesBal = await getSats())), 2000);

        const getSats = async () => {
            const utxos = chronikNet.getUtxos(props.keys.addr)
            const satoshis = await utxos.then((sats => sats.reduce((acc, utxo) => acc + utxo.satoshis, 0)))
            satoshis > 10000 && (props.txstatus.canSpend = true, clearInterval(interval))
            return satoshis
        }

        log("sats ", props.txstatus.rawHex)

        props.txstatus.spent ? clearInterval(interval) : null

    });

    return (
        <>
            <div class="section">
                <p>Tip Amount: {store.updatesBal}</p>
            </div>
            {/* <div style={{ display: props.txstatus.canSpend ? "block" : "none" }} >
                <Spend rawTx={props.txstatus.rawHex} />
            </div> */}
        </>
    );
});


export const CreateP2PKHContract = component$(() => {
    const clearIntervalStatus = useStore({ cleared: false })
    const txStatus = useStore<SpendProps>({ apicalls: 0, spent: false, satoshis: 0, rawHex: '', canSpend: false })
    const store = useStore<Keys>({
        addr: "",
        signerPrivateKey: "",
        signerPublicKeyHash: "",
        signerPublicKey: "",
        receiverPrivateKey: "",
        receiverPublicKey: "",
        receiverPublicKeyHash: "",
        receiverWif: ''
    });


    //TODO usecleanup()
    const contractResource = useResource$<Keys>(async ({ cleanup }) => {
        // const controller = new AbortController();
        // cleanup(() => controller.abort());

        const contractResult = await getP2phkContract().then((value) => {
            store.addr = value.contract.address;

            store.signerPrivateKey = Buffer.from(value.signer.privkey).toString(
                "hex"
            );
            store.signerPublicKeyHash = value.signer.pubkeyhashHex;
            store.signerPublicKey = Buffer.from(value.signer.pubkey).toString("hex");
            store.receiverPrivateKey = value.receiver.privkeyHex;
            store.receiverPublicKey = Buffer.from(value.receiver.pubkey).toString("hex");
            store.receiverPublicKeyHash = value.receiver.pubkeyhashHex;
            store.receiverWif = value.receiver?.wif;

            log("store", store)

            return store

        });

        return contractResult;
    });


    useClientEffect$(async () => {
        const chronik = new ChronikClient("https://chronik.be.cash/xec")
        const chronikNet = new ChronikNetworkProvider("mainnet", chronik)
        const interval = setInterval(async () => (log(txStatus.satoshis = await getSats())), 2000);
        const getSats = async () => {
            const utxos = chronikNet.getUtxos(store.addr)
            const satoshis = await utxos.then((sats => sats.reduce((acc, utxo) => acc + utxo.satoshis, 0)))
            const spendable = satoshis > 10000
            txStatus.canSpend = spendable
            txStatus.satoshis = satoshis
            satoshis > 10000 && (txStatus.canSpend = true, clearInterval(interval))
            return satoshis
        }
        QRCode.toCanvas(document.getElementById("canvas"), store.addr);
        // const wif = document.getElementById("wif");
        // wif.innerHTML = txStatus.spent ? store.receiverWif : 'wating';


    });

    useServerMount$(async () => {
        // Put code here to fetch data from the server.
      });
    const getResource = async () => {

        // const createHex = useResource$<string>(async() => {
        const newContract = await getNewContract(store.signerPublicKeyHash)

        const txHex = await createTransactionHex(newContract, store)
        txStatus.rawHex = txHex
        log('hex is made', txHex)
        return txStatus.rawHex

        // })
        // return createHex
    }
    txStatus.canSpend ? getResource() : null

    const broadcastLink = <div>
        <div style={{ display: (txStatus.canSpend && txStatus.rawHex.length > 0) ? "block" : "none" }} >
            <Link class="mindblow" href={`broadcast/${txStatus.rawHex},${store.receiverWif}`}>
                <button>SPEND 🤯</button>
            </Link>
        </div>
    </div>


    return (
        <>
            <div class="qrcode-container">
                <h1>Send Tip Amount</h1>
                <div class="qrcode" id="qrcode">
                    <canvas
              /*ref={useRef()}*/ id="canvas"
                        width="150"
                        height="150"
                    ></canvas>
                </div>
                <p>Tip Amount: {txStatus.satoshis}</p>

            </div>
            <div class="section">
                {/* <p id="addr"></p> */}

            </div>
            <Resource
                value={contractResource}
                onPending={() => <>Loading...</>}
                onRejected={(error) => <>Error: {error.message}</>}
                onResolved={(store) => {
                    return (
                        <div>
                            <p> {store.addr}</p>
                        </div>
                    );
                }}
            />
            {txStatus.canSpend ?
              broadcastLink
                : null}
        </>

    );
});
