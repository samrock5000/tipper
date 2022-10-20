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
  useMount$,
} from "@builder.io/qwik";
import { getP2phkContract } from "../../contract";
import { createTransactionHex, checkBalance } from "../../services";
import QRCode from "qrcode";
import type { Keys, } from "../../interfaces";
import styles from "./styles.css";
// import { clearInterval } from "timers";
import { encodePrivateKeyWif, hexToBin , instantiateSha256 } from "@bitauth/libauth";
export const log = console.log;


// const balanceResource = useResource$<number>(async () => {
  // const res = await checkBalance(props.addr)
    // .then((val) => val);
  // return res;
// });


// export const canSpendTx = async (addr:string) => {
//   try {
//     const satoshis = await checkBalance(addr)
//     const spendable =  satoshis>10000
//     // log("utxos",satoshis)
//     // log("contract.address",addr)
//     return spendable
//   }  catch (error) {
//     console.error(error);
   
//   }
 
// }

export const Balance = component$((props: { addr: string }) => {
  useStylesScoped$(styles);

  const balanceResource = useResource$<number>(async () => {
    const res = await checkBalance(props.addr)
      .then((val) => val);
    return res;
  });


  return (
    <>
      <div class="section">
        {/* <button onClick$={() => log("tip amount", balanceResource)}>updata balance</button> */}
        <Resource
          value={balanceResource}
          onPending={() => <>Loading...</>}
          onRejected={(error) => <>Error: {error.message}</>}
          onResolved={(value) => {
            return (
              <div>

                <p>Tip Amount:{value}</p>
                {/* <p>{store.balance}</p> */}
                {/* <p>{store.updateBalance}</p> */}
              </div>
            );
          }}
        />
      </div>
    </>
  );
});



export const CreateP2PKHContract = component$(() => {
  const counter = useStore({count:0})
  const store = useStore<Keys>({
    addr: "",
    signerPrivateKey: "",
    signerPublicKeyHash: "",
    signerPublicKey: "",
    receiverPrivateKey: "",
    receiverPublicKey: "",
  });
  
  const contractResource = useResource$<string>(async () => {
 
    const contractResult = await getP2phkContract().then((value) => {
      store.addr = value.contract.address;
   
      store.signerPrivateKey = Buffer.from(value.signer.privkey).toString(
        "hex"
      );
      store.signerPublicKeyHash = value.signer.pubkeyhashHex;
      store.signerPublicKey = Buffer.from(value.signer.pubkey).toString("hex");
      store.receiverPrivateKey = value.receiver.privkeyHex;
        const createTx = async()=>{
          // const spendable = await canSpendTx(value.contract.address)
          const satoshis = await checkBalance(value.contract.address)
          const spendable =  satoshis>10000      
          counter.count = counter.count + 1
          const checkBal = setTimeout(()=>createTx(),2000) 
         
          log("spendable", spendable)
          log("satoshis", satoshis)
          if (spendable==false){
            log("addr not funded")          
          } else {
            const txHex = await createTransactionHex(value.contract, store, amount )
            log("txHex ",txHex)
            clearTimeout(checkBal)
          }            
        }
        createTx()
      
      return value.contract.address
    });
  
    return contractResult;
  });


  useClientEffect$(async () => {
    const sha256 = await instantiateSha256()
    const privkey = encodePrivateKeyWif(sha256, hexToBin(store.signerPrivateKey),"mainnet")  

    QRCode.toCanvas(document.getElementById("canvas"), store.addr);
    const address = document.getElementById("addr");
    const wif = document.getElementById("wif");
    wif.innerHTML =  privkey;
    address.innerHTML = store.addr;
    // log(addr)
    log("Keys",store )


  });

  // const onClickShowBalance = $(()=> checkBalance(store.addr))

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
      </div>
      <div class="section">
      {/* <button onClick$={onClickShowBalance}>GET BALANCE</button> */}
        <p id="addr"></p>
        <p id="wif"></p>
      </div>
      <Resource
        value={contractResource}
        onPending={() => <>Loading...</>}
        onRejected={(error) => <>Error: {error.message}</>}
        onResolved={(addr) => {
          return (
            <div>
              <Balance addr={addr} />
            </div>
          );
        }}
      />
    </>
  );
});
