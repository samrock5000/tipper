import { cashAddressToLockingBytecode, AddressType, addressContentsToLockingBytecode, lockingBytecodeToCashAddress, binToHex, createTransactionContextCommon, bigIntToBinUint64LE, generateSigningSerializationBCH, utf8ToBin, hexToBin, flattenBinArray, } from '@bitauth/libauth';
import { encodeInt, hash160, Op, scriptToBytecode, sha256, } from '@cashscript/utils';
import { Network, } from './interfaces.js';
import { P2PKH_OUTPUT_SIZE, VERSION_SIZE, LOCKTIME_SIZE, DUST_LIMIT, } from './constants.js';
import { OutputSatoshisTooSmallError, Reason, FailedTransactionError, FailedRequireError, FailedTimeCheckError, FailedSigCheckError, } from './Errors.js';
// ////////// PARAMETER VALIDATION ////////////////////////////////////////////
export function validateRecipient(recipient) {
    if (recipient.amount < DUST_LIMIT) {
        throw new OutputSatoshisTooSmallError(recipient.amount);
    }
}
// ////////// SIZE CALCULATIONS ///////////////////////////////////////////////
export function getInputSize(inputScript) {
    const scriptSize = inputScript.byteLength;
    const varIntSize = scriptSize > 252 ? 3 : 1;
    return 32 + 4 + varIntSize + scriptSize + 4;
}
export function getPreimageSize(script) {
    const scriptSize = script.byteLength;
    const varIntSize = scriptSize > 252 ? 3 : 1;
    return 4 + 32 + 32 + 36 + varIntSize + scriptSize + 8 + 4 + 32 + 4 + 4;
}
export function getTxSizeWithoutInputs(outputs) {
    // Transaction format:
    // Version (4 Bytes)
    // TxIn Count (1 ~ 9B)
    // For each TxIn:
    //   Outpoint (36B)
    //   Script Length (1 ~ 9B)
    //   ScriptSig(?)
    //   Sequence (4B)
    // TxOut Count (1 ~ 9B)
    // For each TxOut:
    //   Value (8B)
    //   Script Length(1 ~ 9B)*
    //   Script (?)*
    // LockTime (4B)
    let size = VERSION_SIZE + LOCKTIME_SIZE;
    size += outputs.reduce((acc, output) => {
        if (typeof output.to === 'string') {
            return acc + P2PKH_OUTPUT_SIZE;
        }
        // Size of an OP_RETURN output = byteLength + 8 (amount) + 2 (scriptSize)
        return acc + output.to.byteLength + 8 + 2;
    }, 0);
    // Add tx-out count (accounting for a potential change output)
    size += encodeInt(outputs.length + 1).byteLength;
    return size;
}
// ////////// BUILD OBJECTS ///////////////////////////////////////////////////
export function createInputScript(redeemScript, encodedArgs, selector, preimage) {
    // Create unlock script / redeemScriptSig (add potential preimage and selector)
    const unlockScript = encodedArgs.reverse();
    if (preimage !== undefined)
        unlockScript.push(preimage);
    if (selector !== undefined)
        unlockScript.push(encodeInt(selector));
    // Create input script and compile it to bytecode
    const inputScript = [...unlockScript, scriptToBytecode(redeemScript)];
    return scriptToBytecode(inputScript);
}
export function createOpReturnOutput(opReturnData) {
    const script = [
        Op.OP_RETURN,
        ...opReturnData.map((output) => toBin(output)),
    ];
    return { to: encodeNullDataScript(script), amount: 0 };
}
function toBin(output) {
    const data = output.replace(/^0x/, '');
    const encode = data === output ? utf8ToBin : hexToBin;
    return encode(data);
}
export function createSighashPreimage(transaction, input, inputIndex, coveredBytecode, hashtype) {
    const state = createTransactionContextCommon({
        inputIndex,
        sourceOutput: { satoshis: bigIntToBinUint64LE(BigInt(input.satoshis)) },
        spendingTransaction: transaction,
    });
    const sighashPreimage = generateSigningSerializationBCH({
        correspondingOutput: state.correspondingOutput,
        coveredBytecode,
        forkId: new Uint8Array([0, 0, 0]),
        locktime: state.locktime,
        outpointIndex: state.outpointIndex,
        outpointTransactionHash: state.outpointTransactionHash,
        outputValue: state.outputValue,
        sequenceNumber: state.sequenceNumber,
        sha256: { hash: sha256 },
        signingSerializationType: new Uint8Array([hashtype]),
        transactionOutpoints: state.transactionOutpoints,
        transactionOutputs: state.transactionOutputs,
        transactionSequenceNumbers: state.transactionSequenceNumbers,
        version: 2,
    });
    return sighashPreimage;
}
export function buildError(reason, meepStr) {
    const require = [
        Reason.EVAL_FALSE, Reason.VERIFY, Reason.EQUALVERIFY, Reason.CHECKMULTISIGVERIFY,
        Reason.CHECKSIGVERIFY, Reason.CHECKDATASIGVERIFY, Reason.NUMEQUALVERIFY,
    ];
    const timeCheck = [Reason.NEGATIVE_LOCKTIME, Reason.UNSATISFIED_LOCKTIME];
    const sigCheck = [
        Reason.SIG_COUNT, Reason.PUBKEY_COUNT, Reason.SIG_HASHTYPE, Reason.SIG_DER,
        Reason.SIG_HIGH_S, Reason.SIG_NULLFAIL, Reason.SIG_BADLENGTH, Reason.SIG_NONSCHNORR,
    ];
    if (toRegExp(require).test(reason)) {
        return new FailedRequireError(reason, meepStr);
    }
    if (toRegExp(timeCheck).test(reason)) {
        return new FailedTimeCheckError(reason, meepStr);
    }
    if (toRegExp(sigCheck).test(reason)) {
        return new FailedSigCheckError(reason, meepStr);
    }
    return new FailedTransactionError(reason, meepStr);
}
function toRegExp(reasons) {
    return new RegExp(reasons.join('|').replace(/\(/g, '\\(').replace(/\)/g, '\\)'));
}
// ////////// MISC ////////////////////////////////////////////////////////////
export function meep(tx, utxos, script) {
    const scriptPubkey = binToHex(scriptToLockingBytecode(script));
    return `meep debug --tx=${tx} --idx=0 --amt=${utxos[0].satoshis} --pkscript=${scriptPubkey}`;
}
export function scriptToAddress(script, network) {
    const lockingBytecode = scriptToLockingBytecode(script);
    const prefix = getNetworkPrefix(network);
    const address = lockingBytecodeToCashAddress(lockingBytecode, prefix);
    return address;
}
export function scriptToLockingBytecode(script) {
    const scriptHash = hash160(scriptToBytecode(script));
    const addressContents = { payload: scriptHash, type: AddressType.p2sh };
    const lockingBytecode = addressContentsToLockingBytecode(addressContents);
    return lockingBytecode;
}
/**
* Helper function to convert an address to a locking script
*
* @param address   Address to convert to locking script
*
* @returns a locking script corresponding to the passed address
*/
export function addressToLockScript(address) {
    const result = cashAddressToLockingBytecode(address);
    if (typeof result === 'string')
        throw new Error(result);
    return result.bytecode;
}
export function getNetworkPrefix(network) {
    switch (network) {
        case Network.MAINNET:
            return 'ecash';
        case Network.STAGING:
            return 'echtest';
        case Network.TESTNET:
            return 'echtest';
        case Network.REGTEST:
            return 'ecreg';
        default:
            return 'ecash';
    }
}
// ////////////////////////////////////////////////////////////////////////////
// For encoding OP_RETURN data (doesn't require BIP62.3 / MINIMALDATA)
function encodeNullDataScript(chunks) {
    return flattenBinArray(chunks.map((chunk) => {
        if (typeof chunk === 'number') {
            return new Uint8Array([chunk]);
        }
        const pushdataOpcode = getPushDataOpcode(chunk);
        return new Uint8Array([...pushdataOpcode, ...chunk]);
    }));
}
function getPushDataOpcode(data) {
    const { byteLength } = data;
    if (byteLength === 0)
        return Uint8Array.from([0x4c, 0x00]);
    if (byteLength < 76)
        return Uint8Array.from([byteLength]);
    if (byteLength < 256)
        return Uint8Array.from([0x4c, byteLength]);
    throw Error('Pushdata too large');
}
//# sourceMappingURL=utils.js.map