/* eslint-disable no-console */
import { component$, useMount$, $, useStore, useWatch$, Resource, useResource$, useClientEffect$ } from '@builder.io/qwik';
// import { chronikBroadcastTx } from '../../services'
import { sendRawTx } from '../../services'

export const log = console.log

export const Spend = component$((props: { rawTx: string }) => { 
    const store = useStore({ txHex: props.rawTx, txid: '' })

 
    const txResonseResource = useResource$<Promise<string>>(async () => {
        const tx = sendRawTx(store.txHex).then(val => {
            return val
        })
        log("tx", tx)

        store.txid = tx
      return store.txid

 
})

return (<>
    <Resource
        value={txResonseResource}
        onPending={() => <>Loading...</>}
        onRejected={(error) => <>Error: {error.message}</>}
        onResolved={(txid) => {
            return (
                <div>

                    <p>txid: {txid}</p>


                </div>
            );
        }}
    />

</>)

})