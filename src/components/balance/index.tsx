import {
    component$,
    useStore,
    useClientEffect$,

} from "@builder.io/qwik";
import {chronik,chronikNet} from '../../services'
import {Keys,SpendProps} from '../../interfaces'
export const log = console.log;

export const ShowBalance = component$((props: { keys: Keys, txstatus: SpendProps }) => {
    log("can spend", props.txstatus.canSpend)
    const store = useStore({ balance: 0, updatesBal: 0, addr: props.keys.addr, txid: '' })

    useClientEffect$(async () => {
        log("can spend", props.txstatus.canSpend)
        // const chronik = new ChronikClient("https://chronik.be.cash/xec")
        // const chronikNet = new ChronikNetworkProvider("mainnet", chronik)

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