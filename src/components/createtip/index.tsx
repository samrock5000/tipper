import {
    component$,
    useStore,
    useClientEffect$,
    Resource,
    useResource$,
    useSignal,
} from "@builder.io/qwik";
// import { Link } from '@builder.io/qwik-city';
import { getP2phkContract } from "../../contracts";
import QRCode from "qrcode";
import type { Keys, SpendProps } from "../../interfaces";
import { ChronikClient } from "chronik-client";
export const log = console.log;

export const CreateP2PKHContract = component$(() => {
    const showWIF = useStore({ show: false })
    const txStatus = useStore<SpendProps>({ apicalls: 0, spent: false, satoshis: 0, rawHex: '', canSpend: false })
    const store = useStore<Keys>({
        addr: "",
        addrScriptHash: '',
        signerPrivateKey: "",
        signerPublicKeyHash: "",
        signerPublicKey: "",
        // receiverPrivateKey: "",
        // receiverPublicKey: "",
        // receiverPublicKeyHash: "",
        // receiverWif: ''
    });



    //TODO usecleanup()
    const contractResource = useResource$<Keys>(async ({ cleanup }) => {
        // const controller = new AbortController();
        // cleanup(() => controller.abort());

        const contractResult = await getP2phkContract().then((value) => {
            store.addr = value.contract.address;
            store.addrScriptHash = value.contractScriptHash;
            // store.signerPrivateKey = Buffer.from(value.signer.privkey).toString(
            //     "hex"
            // );
            store.signerPrivateKey = value.signer.privkey
            store.signerPublicKeyHash = value.signer.pubkeyhashHex;
            // store.signerPublicKey = Buffer.from(value.signer.pubkey).toString("hex");
            store.signerPublicKey = value.signer.pubkey
            // store.receiverPrivateKey = value.receiver?.privkeyHex;
            // store.receiverPublicKey = Buffer.from(value.receiver.pubkey).toString("hex");
            // store.receiverPublicKey = value.receiver?.pubkey
            // store.receiverPublicKeyHash = value.receiver?.pubkeyhashHex;
            // store.receiverWif = value.receiver?.wif;

            log("store", store)

            return store

        });

        return contractResult;
    });


    useClientEffect$(async () => {
        QRCode.toCanvas(document.getElementById("canvas"), store.addr);
        const getSats = async () => {
            const chronikClient = new ChronikClient("https://chronik.be.cash/xec")
            const scriptHashAssert: string = store.addrScriptHash!
            const chronikUtxoResult = await chronikClient.script('p2sh', scriptHashAssert).utxos()
            // log(store.signerPublicKeyHash)
            const getUtxos = async (): Promise<any[]> => {
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
            }

            const utxos = getUtxos()
            log("chronikClient utxos ", await utxos)
            const satoshis = await utxos.then((sats => sats.reduce((acc, utxo) => acc + utxo.satoshis, 0)))
            log("satoshis", satoshis)
            const spendable = satoshis > 10000
            txStatus.canSpend = spendable
            txStatus.satoshis = satoshis
            satoshis > 10000 && (txStatus.canSpend = true, clearInterval(interval))
            return satoshis
        }

        // const wif = document.getElementById("wif");
        // wif.innerHTML = txStatus.spent ? store.receiverWif : 'wating';
        const interval = setInterval(async () => (log("contract address balance:", txStatus.satoshis = await getSats())), 800);


    });


    // txStatus.canSpend ?  : null

    // const broadcastLink = <div>
    //     <div style={{ display: (txStatus.canSpend) ? "block" : "none" }} >
    //         <Link class="mindblow" href={`test/${store.addrScriptHash},${store.signerPrivateKey}`}>
    //             {/* <button> Create Tip 🤯</button> */}
    //             SPEND 🤯
    //         </Link>
    //     </div>
    // </div>


    return (
        <>
            <div class="qrcode-container">
                <h1>Send Tip Amount</h1>
                <div class="qrcode" id="qrcode" >
                    <canvas datatype={store.addr}
                        id="canvas"
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
                            {/* <a class='mindblow' > Create Tip 🤯</a> */}
                            <p> {store.addr}</p>
                            <div  >
         
                                    <button class="mind" onClick$={() => showWIF.show = !showWIF.show} >show address keys</button>
                             
                                <ul style={{ display: showWIF.show ? "show" : "none" }} >

                                    <li>addrScriptHash: {store.addrScriptHash}</li>
                                    <li>signerPrivateKey: {store.signerPrivateKey}</li>
                                    <li>signerPublicKeyHash: {store.signerPublicKeyHash}</li>
                                    <li>signerPublicKey: {store.signerPublicKey}</li>
                                </ul>
                            </div>
                            <div>
                                {/* LINK TOOL BREAKS APP <Link class="mindblow" href={`/test/${store.signerPublicKeyHash},${store.signerPrivateKey}`}> */}
                                <div style={{ display: (txStatus.canSpend) ? "block" : "none" }} >
                                    <a class='mindblow' href={`/test/${store.signerPublicKeyHash},${store.signerPrivateKey}`}>

                                        Create Tip 🤯

                                    </a>
                                </div>
                            </div>
                        </div>

                    );
                }}
            />
            {/* {txStatus.canSpend ? */}
            {/* {broadcastLink} */}
            {/* // : null} */}
        </>

    );
});

