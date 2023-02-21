import {ContractFactory, JsonRpcProvider} from "ethers";

import {CircuitConfig, Networks, Witness, ZK_PROOF} from "./types";
import {genGrothZKey, genPlonkZKey, genVerificationKey} from "./utils/zKey";
import {genGroth16Proof, genPlonkProof, verifyGroth16Proof, verifyPlonkProof} from "./utils/proof";
import {getSolidityVerifier} from "./utils/verifier";
import * as path from "path";

const log = require("log")
const solc = require("solc")
const {wasm: wasmTester} = require("./vendors/circom_tester")

export class Circuit {
    _circuitConfig: CircuitConfig;
    _networks: Networks
    _wasmTester: typeof wasmTester;

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

    async _deploySmartContractVerifier(networkName: string) {
        const verifierCode = await getSolidityVerifier(this._circuitConfig.zKeyPath)

        const inp = {
            language: 'Solidity',
            sources: {
                'verifier.sol': {
                    content: verifierCode,
                }
            },
            settings: {
                outputSelection: {
                    '*': {
                        '*': ['*']
                    }
                }
            }
        };

        let c = JSON.parse(await solc.compile(JSON.stringify(inp)))
        let {abi, evm} = c.contracts["verifier.sol"]["Verifier"]
        abi = JSON.stringify(abi)
        const bytecode = "0x" + evm.bytecode.object

        // const provider = new JsonRpcProvider(this._networks[networkName].RPC)
        // const signer =  new Wallet(this._networks[networkName].PRIV_KEY, provider)
        const provider = new JsonRpcProvider()
        const signer = await provider.getSigner(0)
        const cFactory = new ContractFactory(abi, bytecode, signer)

        const txReceipt = await cFactory.deploy()
        await txReceipt.waitForDeployment()

        const contractAddresss = await txReceipt.getAddress()
        return contractAddresss
    }
}