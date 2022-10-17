import {
  component$,
  useStore,
  useWatch$,
  useStylesScoped$,
  useServerMount$,
  useMount$,
  useClientEffect$,
  useCleanup$, 
  PropFunction,
  NoSerialize,
  noSerialize,
  $,
  Resource,
  useResource$,
} from "@builder.io/qwik";
import { getP2phkContract } from "../contract";
import { sendTransaction, checkBalance } from "../wallet";
import QRCode from "qrcode";
import type { Keys } from "../interfaces";
import styles from "./styles.css";
export const log = console.log;



export const ShowBalance = component$((props: { addr: string }) => {
  useStylesScoped$(styles);

//   const store = useStore({
//     addr: props.addr,
//     balance: 0,
//     updateBalance: 0,
//     // cleanup: undefined,
//   });

  const timer = setInterval(async () => {
    // const res = await checkBalance(props.addr).then((val) => val);
          const res = await checkBalance('ecash:qzgpwcvkrnwtzep2m28rmlcy2x2hauypmshy5amknn')

    // store.updateBalance = res
    log("Timer Activated", res);
    //   return () => {
    // clearInterval(timer);
    //   };
  }, 2000);

//   clearInterval(timer);

  const balanceResource = useResource$<number>(async (ctx) => {
    // const balance = track(store, "balance");
    // log("balance ", balance);
    const controller = new AbortController();

    const res = await checkBalance(props.addr)
    //   const res = await checkBalance('ecash:qzgpwcvkrnwtzep2m28rmlcy2x2hauypmshy5amknn',controller)
      .then((val) => val);
      
      ctx.cleanup(() => {
  
        log("checkBalance cleaned up")
      });
    // store.balance = res;
    
    return res;
  });

  return (
    <>
      <div class="section">
        <button  onClick$={() =>log("sup") }>Check Balance</button>

        <Resource
          value={balanceResource}
          onPending={() => <>Loading...</>}
          onRejected={(error) => <>Error: {error.message}</>}
          onResolved={(value) => {
            return (
              <div>
                Address Balance:
                <p>{value}</p>
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

//   useWatch$(({ track,cleanup }) => {
    //   const address = track(store, 'addr');
    //   store.addr = address;
    //   cleanup()
//   });

  const contractResource = useResource$<any>(async (ctx) => {
 

    // const address = track(store, "addr");
    const contractRes = await getP2phkContract().then((value) => {
      // console.log("promise ", value.signer)
      store.addr = value.contract.address;
      // store.signerPrivateKey = value.signer.privkeyHex;
      store.signerPrivateKey = Buffer.from(value.signer.privkey).toString(
        "hex"
      );
      store.signerPublicKeyHash = value.signer.pubkeyhashHex;
      store.signerPublicKey = Buffer.from(value.signer.pubkey).toString("hex");
      store.receiverPrivateKey = value.receiver.privkeyHex;
      // store.receiverPk = value.receiver.
    //   log(" track(store, 'addr');", address);
      log(" store.addr", store.addr);
      // log("createContract ", store)
      // return value.contract;
      return value.contract.address;
      // return
    });
   
    ctx.cleanup(() => {
      
      
        log("contract component cleaned up")
      });

    return contractRes;
  });
  // const balanceComponent = <ShowBalance addr={store.addr} />
  useClientEffect$(async () => {
    QRCode.toCanvas(document.getElementById("canvas"), await store.addr);
    const address = document.getElementById("addr");
    address.innerHTML = await store.addr;
    console.log(addr)
  });
  // const SendTx = async () => {
  //     const contractPromise = await contractRes;
  //     const txInfo = store;
  //     // sendTransaction(contractPromise, txInfo);

  // };
  // SendTx();

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
        {/* {balanceComponent} */}
        <p id="addr"></p>
      </div>
      <Resource
        value={contractResource}
        onPending={() => <>Loading...</>}
        onRejected={(error) => <>Error: {error.message}</>}
        onResolved={(addr) => {
          return (
            <div>
              <ShowBalance addr={addr} />
              {/* {addr} */}
            </div>
          );
        }}
      />
    </>
  );
});
