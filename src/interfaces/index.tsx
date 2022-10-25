import type { Contract } from '@samrock5000/cashscript'


export interface ContractTypes {
    contract: Contract;
    signer: ContractArg;
    receiver?: ContractArg;
}

export interface ContractArg {
    pubkey: Uint8Array;
    pubkeyhashHex: string;
    privkey: Uint8Array;
    privkeyHex: string;
    wif?:string
}

export interface Keys {
    addr: string;
    signerPrivateKey: string;
    signerPublicKeyHash: string;
    signerPublicKey: string;
    receiverPrivateKey: string;
    receiverPublicKey: string;
    receiverPublicKeyHash: string;
    receiverWif:string;
}

export interface SpendProps {
    apicalls: number, spent: boolean, satoshis: number, send$?: QRL<(rawTx: string) => Promise<unknown>>, rawHex: string, canSpend: boolean
}