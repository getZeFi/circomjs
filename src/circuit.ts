import {CircuitCircomTester, Networks, SnarkType, Witness, ZK_PROOF} from "./types";
import {genGrothZKey, genVerificationKey} from "./utils/zKey";
import * as path from "path";
import {genGroth16Proof, verifyGroth16Proof} from "./utils/proof";
import {getSolidityVerifier} from "./utils/verifier";
import {Contract, ContractFactory, JsonRpcProvider, JsonRpcSigner, Wallet} from "ethers";
import {sign} from "crypto";
import {json} from "stream/consumers";
const solc = require("solc")

export class Circuit {

    _zKeyPath: string
    _vKeyPath: string
    _wasmPath:string
    _networks: Networks

    constructor(public readonly _c: CircuitCircomTester, public readonly cName: string, public readonly _snarkType: SnarkType, public readonly outputDir: string , networks: Networks) {
        this._zKeyPath = path.join(outputDir, "circuit_final.zkey")
        this._vKeyPath = path.join(outputDir, "verification_key.json")
        this._wasmPath = path.join(outputDir, `${cName}_js`,`${cName}.wasm`)
        this._networks = networks
    }

    calculateWitness(inp: any) : Promise<Witness>
    {
        return this._c.calculateWitness(inp)
    }

    // throws if there is an error
    checkConstraints(w: any): Promise<void>{
        return this._c.checkConstraints(w)
    }

    //generate zkey
    genZKey () {
        return genGrothZKey(this.outputDir, this.cName, "power_of_tau.ptau")
    }

    async genProof(inp: any){
         return await genGroth16Proof(inp, this._wasmPath,this._zKeyPath)
    }

    async genVKey() {
        return await genVerificationKey(this._zKeyPath, this._vKeyPath)
    }

    async verifyProof(p: ZK_PROOF){
       return await verifyGroth16Proof(this._vKeyPath,p)
    }

    async _deploySmartContractVerifier (networkName: string) {
        const verifierCode = await getSolidityVerifier(this._zKeyPath)

        const inp =  {
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

        let c =  JSON.parse(await solc.compile(JSON.stringify(inp)))
        let {abi, evm} = c.contracts["verifier.sol"]["Verifier"]
        abi = JSON.stringify(abi)
        const bytecode = "0x"+ evm.bytecode.object

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