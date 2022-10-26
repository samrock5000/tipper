/* eslint-disable no-console */
import { component$, useStore, useClientEffect$, useResource$, Resource } from '@builder.io/qwik';
import { DocumentHead, useLocation } from '@builder.io/qwik-city';

import { Spend } from '../../../components/spend'


export default component$(() => {
  const txHex = useLocation()
  const store = useStore({ wif: '', hex: '' })

  const hexDataResource = useResource$(async () => {
    const params = await txHex.params.params
    const paramObject = params
    const paramArr = paramObject.split(',')
    store.hex = paramArr[0]
    store.wif = paramArr[1]
    // store.wif = "paramArr[1]"
    console.log(store)
    return store
  })

  console.log("/broadcast ", hexDataResource)
  useClientEffect$(() => {
  });


  return (<>

    <Resource
      value={hexDataResource}
      onPending={() => <>Loading...</>}
      onRejected={(error) => <>Error: {error.message}</>}
      onResolved={(res) => {
        return (
          <div>
            {/* <h1>{res.wif}</h1> */}
            {/* <Spend rawTx={res.hex} /> */}
            <p>{store.hex}</p>
      <p>{store.wif}</p>
          </div>
        );
      }}
    />
     
  </>)

})

export const head: DocumentHead = {
  title: 'Qwik HEX',
};
