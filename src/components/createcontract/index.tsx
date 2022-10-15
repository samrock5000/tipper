import { component$, useStore, useWatch$, useStylesScoped$, useServerMount$, useClientEffect$, PropFunction, $, Resource, useResource$ } from '@builder.io/qwik'
import { getP2phkContract } from '../contract'
import { sendTransaction, checkBalance } from '../wallet'
import QRCode from "qrcode";
import type { Keys } from '../interfaces'
import styles from './styles.css'
export const log = console.log;

export const ShowBalance = component$((props: { addr: string }) => {
    useStylesScoped$(styles);
    const store = useStore({
        //updataBalance: ()=> checkBalance(props.addr),
        balance: 5456,
    });
    const balanceResource = useResource$<number>(async ({ track, cleanup }) => {
        // const balance = track(store, 'balance');
        const abortController = new AbortController();
        cleanup(() => abortController.abort('cleanup'));
        // const res = await checkBalance(props.addr)      
        const res = await checkBalance('ecash:qzgpwcvkrnwtzep2m28rmlcy2x2hauypmshy5amknn')
            .then((val) => val)


        return res;

    });

    return (<>
        <div class='section'>
        <button onClick$={()=> store.updataBalance} >checkBalance</button>
            <Resource
                value={balanceResource}
                onPending={() => <>Loading...</>}
                onRejected={(error) => <>Error: {error.message}</>}
                onResolved={(bal) => {
                    return (
                        <div>Address Balance: {bal}</div>
                    );
                }}
            />


        </div>
    </>)
})

export const CreateContract = component$(() => {

    const store = useStore<Keys>({
        addr: "",
        signerPrivateKey: "",
        signerPublicKeyHash: "",
        signerPublicKey: "",
        receiverPrivateKey: "",
        receivePublicKey: "",
        // contract:null as unknown
    });

    useWatch$(({ track }) => {
        const address = track(store, 'addr');
        store.addr = address;
    });
    const contract = async () => await getP2phkContract();

    const contractRes = contract().then((value) => {
        // console.log("promise ", value.signer)
        store.addr = value.contract.address;
        // store.signerPrivateKey = value.signer.privkeyHex;
        store.signerPrivateKey = Buffer.from(value.signer.privkey).toString("hex");
        store.signerPublicKeyHash = value.signer.pubkeyhashHex;
        store.signerPublicKey = Buffer.from(value.signer.pubkey).toString("hex");
        store.receiverPrivateKey = value.receiver.privkeyHex
        // store.receiverPk = value.receiver.
        log(" store.addr.length", store.addr.length)
        // log("createContract ", store)
        return value.contract;
        // return
    });

    useClientEffect$(async () => {
        QRCode.toCanvas(document.getElementById("canvas"), await store.addr);
        const address = document.getElementById("addr");
        address.innerHTML = await store.addr;
        // console.log(addr)
    });
    const SendTx = async () => {
        const contractPromise = await contractRes;
        const txInfo = store;
        sendTransaction(contractPromise, txInfo);


    };
    SendTx();
    const balanceComponent = <ShowBalance addr={store.addr} />
    return (
        <>
            <div class="qrcode-container">
                <h1>Send Tip Amount</h1>
                <div class="qrcode" id="qrcode">
                    <canvas /*ref={useRef()}*/ id="canvas" width="150" height="150"></canvas>
                </div>
            </div>
            <div class='section' >
                {balanceComponent}
                <p id="addr"></p>
            </div>


        </>
    );
});




