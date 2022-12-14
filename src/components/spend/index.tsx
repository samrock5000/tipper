/* eslint-disable no-console */
import { component$, useStore, Resource, useResource$, } from '@builder.io/qwik';
import { sendRawTx } from '../../services'

export const log = console.log

export const Spend = component$((props: { rawTx: string }) => { 
    const store = useStore({ txHex: props.rawTx, txid: '' })

 
    const txResonseResource = useResource$<Promise<string>>(async () => {
        const tx = sendRawTx(store.txHex).then(val => {
            return val
        })
        const res:string = await tx!
        log("tx", tx)

        store.txid = res
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
                    <a href={`https://explorer.e.cash/tx/${txid}`} target="_blank">
                    <p>txid: {txid}</p>
                    </a>
                    
                </div>
            );
        }}
    />

</>)

})