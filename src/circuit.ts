import * as path from "path";
import log from "log"
import * as fs from "fs";

const {wasm: wasmTester} = require("./vendors/circom_tester")

import {CircuitConfig, Networks, Witness, ZK_PROOF} from "./types";
import {genGrothZKey, genPlonkZKey, genVerificationKey} from "./utils/zKey";
import {genGroth16Proof, genPlonkProof, verifyGroth16Proof, verifyPlonkProof} from "./utils/proof";
import {
    deploySolidityVerifier,
    getGroth16SolidityCallData,
    getPlonkSolidityCallData,
    getSolidityVerifierCode, getVerifierContract
} from "./utils/verifier";
import {grothVerifierABI, plonkVerifierABI} from "./utils/data";
import {Contract} from "ethers";

export class Circuit {
    private _circuitConfig: CircuitConfig;
    // @ts-ignore // TODO: Remove ts-ignore and use _networks variable in the file
    private _networks: Networks
    private _wasmTester: typeof wasmTester;

    constructor(circuitConfig: CircuitConfig, networks: Networks) {
        this._circuitConfig = circuitConfig;
        this._networks = networks
        this._wasmTester = undefined;
    }

    async compile() {
        log.info('compiling circuit:%s, out:%s', this._circuitConfig.inputFilePath, this._circuitConfig.outputDir)
        this._wasmTester = await wasmTester(this._circuitConfig.inputFilePath, {
            output: this._circuitConfig.outputDir,
            ...this._circuitConfig.compileOptions
        })
    }

    calculateWitness(inp: any): Promise<Witness> {
        log.info('calculating witness, wasm:%s, inp:', this._circuitConfig.outputDir, inp)
        return this._wasmTester.calculateWitness(inp)
    }

    checkConstraints(w: any): Promise<void> {
        // throws if there is an error
        return this._wasmTester.checkConstraints(w)
    }

    genZKey() {
        log.info("generating zKey, ckt:%s, pTau:%s, zKey:%s",
            this._circuitConfig.cktName,
            this._circuitConfig.powerOfTauFp,
            this._circuitConfig.zKeyPath
        )
        switch (this._circuitConfig.compileOptions.snarkType) {
            case "plonk":
                const r1csFp = path.resolve(this._circuitConfig.outputDir, `${this._circuitConfig.cktName}.r1cs`)
                return genPlonkZKey(r1csFp, this._circuitConfig.powerOfTauFp, this._circuitConfig.zKeyPath)
            case "groth16":
            default:
                return genGrothZKey(this._circuitConfig.outputDir, this._circuitConfig.cktName, this._circuitConfig.powerOfTauFp)
        }

    }

    async genProof(inp: any) {
        const wasmPath = path.join(this._circuitConfig.outputDir, this._circuitConfig.cktName + '_js', this._circuitConfig.cktName + ".wasm")
        log.info('generating proof, wasm:%s, zKey:%s', wasmPath, this._circuitConfig.zKeyPath)
        switch (this._circuitConfig.compileOptions.snarkType) {
            case "plonk":
                return await genPlonkProof(inp, wasmPath, this._circuitConfig.zKeyPath)
            case "groth16":
            default:
                return await genGroth16Proof(inp, wasmPath, this._circuitConfig.zKeyPath)        }
    }

    async genVKey() {
        log.info('generating verification key, zKey:%s, vKey:%s',
            this._circuitConfig.zKeyPath,
            this._circuitConfig.vKeyPath

        )
        return await genVerificationKey(this._circuitConfig.zKeyPath, this._circuitConfig.vKeyPath)
    }

    async verifyProof(p: ZK_PROOF) {
        switch (this._circuitConfig.compileOptions.snarkType) {
            case "plonk":
                return await verifyPlonkProof(this._circuitConfig.vKeyPath, p)
            case "groth16":
            default:
                return await verifyGroth16Proof(this._circuitConfig.vKeyPath, p)
        }
    }

    getOutputDIR(){
        return this._circuitConfig.outputDir
    }

    async deploySmartContractVerifier(networkName: string) {

        if(typeof this._networks[networkName] === "undefined"){
            throw new Error(`cannot find network by the name ${networkName} in config file`)
        }

        // pass -> circuit's zkey has not been generated yet
        if(!fs.existsSync(this._circuitConfig.zKeyPath)){
            // pass -> circuit hasn't been compiled yet
            if(!fs.existsSync(this.getOutputDIR())){
                this.compile()
            }
            this.genZKey()
        }

        const verifierCode = await getSolidityVerifierCode(this._circuitConfig.zKeyPath)
        const {RPC: rpcURL, PRIV_KEY: privKey} = this._networks[networkName]
        const contractAddress = await deploySolidityVerifier(verifierCode, rpcURL, privKey, this._circuitConfig.compileOptions.snarkType)

        return contractAddress
    }


    async verifyProofOnChain(p: ZK_PROOF, verifierAddress: string, networkName: string): Promise<boolean> {
        if(typeof this._networks[networkName] === "undefined"){
            throw new Error(`cannot find network by the name ${networkName} in config file`)
        }

        const callData = await this.getSolidityCallData(p)
        const {RPC: rpcURL} = this._networks[networkName]
        let contract: Contract

        switch (p.proof.protocol){
            case "plonk":
                contract = getVerifierContract({address: verifierAddress, abi:plonkVerifierABI, rpc: rpcURL})
                break;
            case "groth16":
                contract = getVerifierContract({address: verifierAddress, abi: grothVerifierABI, rpc: rpcURL})
                break;
            default:
                throw new Error(`protocol ${p.proof.protocol} not supported`)
        }

        return await contract.verifyProof(...callDataToContractArgs(callData, p.proof.protocol))
    }

    getSolidityCallData(p: ZK_PROOF): Promise<string> {
        switch (p.proof.protocol){
            case "plonk":
                return getPlonkSolidityCallData(p)
            case "groth16":
                return getGroth16SolidityCallData(p)
            default:
                throw new Error(`protocol ${p.proof.protocol} not supported`)
        }
    }
}

const callDataToContractArgs = (callData:string, protocol: string) => {
    switch (protocol){
        case "groth16":
            return JSON.parse(`[${callData}]`)
            break;
        case "plonk":
            const l = callData.split(",")
            const proof = l[0]
            const pubSingals = JSON.parse(l[1])
            return [proof, pubSingals]
            break;
        default:
            throw new Error(`protocl ${protocol} not supported`)
    }
}