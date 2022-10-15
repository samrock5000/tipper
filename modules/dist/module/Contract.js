var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { binToHex } from '@bitauth/libauth';
import { asmToScript, calculateBytesize, countOpcodes, generateRedeemScript, scriptToBytecode, } from '@cashscript/utils';
import { Transaction } from './Transaction.js';
import { encodeArgument } from './Argument.js';
import { scriptToAddress, } from './utils.js';
import SignatureTemplate from './SignatureTemplate.js';
import { ElectrumNetworkProvider } from './network/index.js';
export class Contract {
    constructor(artifact, constructorArgs, provider = new ElectrumNetworkProvider()) {
        this.artifact = artifact;
        this.provider = provider;
        const expectedProperties = ['abi', 'bytecode', 'constructorInputs', 'contractName'];
        if (!expectedProperties.every((property) => property in artifact)) {
            throw new Error('Invalid or incomplete artifact provided');
        }
        if (artifact.constructorInputs.length !== constructorArgs.length) {
            throw new Error(`Incorrect number of arguments passed to ${artifact.contractName} constructor`);
        }
        // Encode arguments (this also performs type checking)
        const encodedArgs = constructorArgs
            .map((arg, i) => encodeArgument(arg, artifact.constructorInputs[i].type))
            .reverse();
        // Check there's no signature templates in the constructor
        if (encodedArgs.some((arg) => arg instanceof SignatureTemplate)) {
            throw new Error('Cannot use signatures in constructor');
        }
        this.redeemScript = generateRedeemScript(asmToScript(this.artifact.bytecode), encodedArgs);
        // Populate the functions object with the contract's functions
        // (with a special case for single function, which has no "function selector")
        this.functions = {};
        if (artifact.abi.length === 1) {
            const f = artifact.abi[0];
            this.functions[f.name] = this.createFunction(f);
        }
        else {
            artifact.abi.forEach((f, i) => {
                this.functions[f.name] = this.createFunction(f, i);
            });
        }
        this.name = artifact.contractName;
        this.address = scriptToAddress(this.redeemScript, this.provider.network);
        this.bytesize = calculateBytesize(this.redeemScript);
        this.opcount = countOpcodes(this.redeemScript);
    }
    getBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            const utxos = yield this.getUtxos();
            return utxos.reduce((acc, utxo) => acc + utxo.satoshis, 0);
        });
    }
    getUtxos() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.provider.getUtxos(this.address);
        });
    }
    getRedeemScriptHex() {
        return binToHex(scriptToBytecode(this.redeemScript));
    }
    createFunction(abiFunction, selector) {
        return (...args) => {
            if (abiFunction.inputs.length !== args.length) {
                throw new Error(`Incorrect number of arguments passed to function ${abiFunction.name}`);
            }
            // Encode passed args (this also performs type checking)
            const encodedArgs = args
                .map((arg, i) => encodeArgument(arg, abiFunction.inputs[i].type));
            return new Transaction(this.address, this.provider, this.redeemScript, abiFunction, encodedArgs, selector);
        };
    }
}
//# sourceMappingURL=Contract.js.map