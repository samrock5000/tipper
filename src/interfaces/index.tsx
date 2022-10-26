import  { Contract } from '@samrock5000/cashscript/dist/module/index.js'


export interface ContractTypes {
    contract: Contract;
    signer: ContractArg;
    receiver?: ContractArg;
    contractScriptHash?:string
}

export interface ContractArg {
    pubkey: string;
    pubkeyhashHex: string;
    privkey: string;
    privkeyHex: string;
    wif?:string
}

export interface Keys {
    addr: string;
    addrScriptHash?:string;
    signerPrivateKey: string;
    signerPublicKeyHash: string;
    signerPublicKey: string|Uint8Array;
    receiverPrivateKey?: string|undefined;
    receiverPublicKey?: string|Uint8Array|undefined;
    receiverPublicKeyHash?: string|undefined;
    receiverWif?:string|undefined;
}

export interface SpendProps {
    apicalls: number, spent: boolean, satoshis: number, rawHex: string, canSpend: boolean
}