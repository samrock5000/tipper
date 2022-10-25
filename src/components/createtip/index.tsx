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
import { createTransactionHex, checkBalance, sendRawTx, chronik } from "../../services";
import { p2pkhArtifact, getNewContract } from '../../contract'
import QRCode from "qrcode";
import { ChronikClient } from "chronik-client";
import {
    binToHex,
    hexToBin,
    // generatePrivateKey,
    instantiateSecp256k1,
    // instantiateRipemd160,
    // instantiateSha256,
    Base58AddressFormatVersion,
    encodeCashAddress,
    CashAddressType,
    // cashAddressToLockingBytecode,
    // lockingBytecodeToAddressContents,
    // encodePrivateKeyWif
} from "@bitauth/libauth";
// import { ChronikNetworkProvider, Contract, NetworkProvider, Argument } from "@samrock5000/cashscript"
// import {chronik,chronikNet} from '../../services'
import type { Keys,SpendProps } from "../../interfaces";
import { ChronikNetworkProvider,SignatureTemplate,Contract } from "@samrock5000/cashscript";


export const log = console.log;



// export const sendTx = $((rawTx: string) => {
//     return sendRawTx(rawTx)
// })

export const hash160ToCash = (hex: string, network: number = 0x00) => {
    let type: string = Base58AddressFormatVersion[network] || "p2pkh";
    let prefix = "ecash";
    if (type.endsWith("Testnet")) prefix = "ectest";
    let cashType: CashAddressType = 0;
    return encodeCashAddress(prefix, cashType, hexToBin(hex));
};


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
        const interval = setInterval(async () => (log("contract address balance:",txStatus.satoshis = await getSats())), 2000);
        const getSats = async () => {

            const chronikClient = new ChronikClient("https://chronik.be.cash/xec")
            const provider = new ChronikNetworkProvider('mainnet', chronikClient)
            const utxos = provider.getUtxos(store.addr);
            // const utxos = chronikClient.script('p2sh', store.signerPublicKeyHash).utxos()
            log("chronik",utxos)
            const satoshis = await utxos.then((sats => sats.reduce((acc, utxo) => acc + utxo.satoshis, 0)))
            const spendable = satoshis > 10000
            txStatus.canSpend = spendable
            txStatus.satoshis = satoshis
            satoshis > 10000 && (txStatus.canSpend = true, clearInterval(interval))
            return satoshis
        }

       
        const createTransactionHex = async (
            contract: Contract,
            txInfo: Keys,
            // amount?: number | BigInt
        ): Promise<string> => {
        
            const secp256k1 = await instantiateSecp256k1();
            const privKey = hexToBin(txInfo.signerPrivateKey);
        
            log("valid privateKey: ", secp256k1.validatePrivateKey(privKey));
            const pubKey = hexToBin(txInfo.signerPublicKey)
            const receipient = hash160ToCash(txInfo.receiverPublicKeyHash);
            const serviceProviderAddr = "ecash:qr4jd3qejeym00u6u4lrzk3p6p3fmc545yjgvknzxr"
            const utxos = contract.getUtxos()
            const satoshis = await utxos.then((sats => sats.reduce((acc, utxo) => acc + utxo.satoshis, 0)))
            const utxoLen = (await utxos).length
            const serviceFee = 2000
            const fee = 211 + (utxoLen * 200)
            const amount = satoshis - (fee + serviceFee)
        
            // log("amount ",amt)
            log("txinfo", txInfo)
            // log("Contract Addr", contract.address)
            // log("receipient", receipient)
        
            try {
                const tx = await contract.functions
                    .spend(pubKey, new SignatureTemplate(privKey))
                    .to(receipient, amount)
                    .to(serviceProviderAddr, serviceFee)
                    .build()
                // .send();
                // console.log("TX ", tx)
                // const txRes = await chronikNet.sendRawTransaction(tx)
                // log(txRes)
                return tx
            } catch (error) {
                console.error(error);
                return "createTransactionHex error"
            }
        }

        QRCode.toCanvas(document.getElementById("canvas"), store.addr);
        // const wif = document.getElementById("wif");
        // wif.innerHTML = txStatus.spent ? store.receiverWif : 'wating';


    });

    // useServerMount$(async () => {
    //     // Put code here to fetch data from the server.
    //   });

    const getResource = async () => {

        // const createHex = useResource$<string>(async() => {
        const newContract = await getNewContract(store.signerPublicKeyHash)
        // const txHex = await createTransactionHex(newContract, store)
    //     txStatus.rawHex = txHex
        log('newContract', newContract.address)
        // log('hex is made', txHex)
        return txStatus.rawHex

        // })
    //     // return createHex
    }
    // setTimeout(()=>getResource(),1000) 

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

/*
 const createHex = async () => {
                // const satoshis = await checkBalance(value.contract.address)
                // const spendable = satoshis > 10000
                // txStatus.canSpend = spendable
                // txStatus.satoshis = satoshis

                // txStatus.apicalls = txStatus.apicalls + 1

                const contract = await value.contract
                // log("spendable", spendable)
                // log("satoshis", satoshis)
                // log("apicalls", txStatus.apicalls)
                const txHex = await createTransactionHex(contract, store)
                log("txHex ", txHex)
                txStatus.rawHex = txHex
                /*
                if (spendable == false) {
                    log("address not funded")
                } else {
                    const txHex = await createTransactionHex(contract, store)
                    log("txHex ", txHex)
                    txStatus.rawHex = txHex
                    // sendRawTx(txHex)
                    // txStatus.spent = true
                    // clearTimeout(checkBal)
                }
               
               
            }
            const canSpenTimer = setInterval(() => log("can spend ", txStatus.canSpend), 2000)
            // log("can spend?", canSpend)
            txStatus.canSpend ? createHex() : null
            // cleanup(() => log("cleaned ", clearInterval(canSpend)));

         */