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
// import { DocumentHead, useLocation } from '@builder.io/qwik-city';


export const hash160ToCash = (hex: string, network: number = 0x00) => {
    let type: string = Base58AddressFormatVersion[network] || "p2pkh";
    let prefix = "ecash";
    if (type.endsWith("Testnet")) prefix = "ectest";
    let cashType: CashAddressType = 0;
    return encodeCashAddress(prefix, cashType, hexToBin(hex));
};

export default component$(() => {

    const store = useStore({ data: '' })
    const contractResource = useResource$<string>(async ({ cleanup }) => {
      const res = await hash160ToCash("625f489a8877045cb1ed9e2711ddf1e60d2a25e0")
      store.data = res
        console.log(res)
        return store.data
    })


    return (<>
        <Resource
            value={contractResource}
            onResolved={(addr) => {
                return (
                    <div>
                        <p> {addr}</p>
                    </div>
                );
            }} />
    </>)
})

