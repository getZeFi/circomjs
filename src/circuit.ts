import * as path from "path";
import log from "log"

const {wasm: wasmTester} = require("./vendors/circom_tester")

import {CircuitConfig, Networks, Witness, ZK_PROOF} from "./types";
import {genGrothZKey, genPlonkZKey, genVerificationKey} from "./utils/zKey";
import {genGroth16Proof, genPlonkProof, verifyGroth16Proof, verifyPlonkProof} from "./utils/proof";
import * as fs from "fs";

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
        log.info('compiling circuit:%s, out1:%s', this._circuitConfig.inputFilePath, this._circuitConfig.outputDir)

        if(!fs.existsSync(this._circuitConfig.outputDir)) {
             fs.mkdirSync(this._circuitConfig.outputDir, {recursive:true})
        }

        this._wasmTester = await wasmTester(this._circuitConfig.inputFilePath, {
            output: this._circuitConfig.outputDir,
            ...this._circuitConfig.compileOptions
        })

        await this._genZKey()
        await this._genVKey()
    }

    calculateWitness(inp: any): Promise<Witness> {
        log.info('calculating witness, wasm:%s, inp:', this._circuitConfig.outputDir, inp)
        return this._wasmTester.calculateWitness(inp)
    }

    checkConstraints(w: any): Promise<void> {
        // throws if there is an error
        return this._wasmTester.checkConstraints(w)
    }

    private _genZKey() {
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

    private _genVKey() {
        log.info('generating verification key, zKey:%s, vKey:%s',
            this._circuitConfig.zKeyPath,
            this._circuitConfig.vKeyPath

        )
        return genVerificationKey(this._circuitConfig.zKeyPath, this._circuitConfig.vKeyPath)
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
}
