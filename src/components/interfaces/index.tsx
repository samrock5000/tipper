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
}

export interface ContractTypes {
    contract: Contract;
    signer: ContractArg;
    receiver?: ContractArg;
}

export interface Keys {
    addr: string;
    signerPrivateKey: string;
    signerPublicKeyHash: string;
    signerPublicKey: string;
    receiverPrivateKey: string;
    receivePublicKey: string;
}