import {Contract, ContractFactory, JsonRpcProvider, Wallet} from "ethers";

const fs  = require("fs");
const path = require("path");
const {zKey}  = require("snarkjs")
const solc = require("solc")
const {plonk, groth16} = require("snarkjs")
const {exportSolidityCallData: plonkExportSolidityCallData}=   plonk
const {exportSolidityCallData: groth16ExportSolidityCallData}=   groth16


import {Templates, ZK_PROOF} from "../types";

const getTemplates = async (): Promise<Templates> => {
    const templates: Templates = {
        groth16:"",
        plonk:"",
        fflonk:""
    }
    templates.groth16 = await fs.promises.readFile(path.join(__dirname, "templates", "verifier_groth16.sol.ejs"), "utf8");
    templates.plonk = await fs.promises.readFile(path.join(__dirname, "templates", "verifier_plonk.sol.ejs"), "utf8");
    templates.fflonk = await fs.promises.readFile(path.join(__dirname, "templates", "verifier_fflonk.sol.ejs"), "utf8");

    return templates
}

export const getSolidityVerifierCode = async (zKeyPath:string): Promise<string> => {
    const templates = await getTemplates()
    const verifierCode = await zKey.exportSolidityVerifier(zKeyPath, templates)
    return verifierCode
}

export const deploySolidityVerifier = async (verifierCode: string, rpcURL: string, privKey:string, snarkType: string) : Promise<string> => {
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

    const solc = await getSolidityCompiler(snarkType)
    let c = JSON.parse(await solc.compile(JSON.stringify(inp)))

    let {abi, evm} = c.contracts["verifier.sol"][ snarkType === "groth16" ? "Verifier" : "PlonkVerifier"]
    abi = JSON.stringify(abi)
    const bytecode = "0x" + evm.bytecode.object

    const cFactory = getVerifierContractFactory({ abi, bytecode, rpcURL, privKey })

    const txReceipt = await cFactory.deploy()
    await txReceipt.waitForDeployment()
    const contractAddresss = await txReceipt.getAddress()

    return contractAddresss
}

const getVerifierContractFactory = (arg: {abi: string, bytecode:string, rpcURL: string, privKey: string}) => {
    const {abi, bytecode, rpcURL, privKey} = arg

    const provider = new JsonRpcProvider(rpcURL)
    const signer =  new Wallet(privKey, provider)
    const cFactory = new ContractFactory(abi, bytecode, signer)

    return cFactory
}

export const getVerifierContract  = (arg:{
    address,
    abi,
    rpc,
})=>
{
    const {address, abi, rpc} = arg
    const provider = new JsonRpcProvider(rpc)
    const contract = new Contract(address, abi, provider)
    return contract
}

export const getPlonkSolidityCallData = (p:ZK_PROOF)=> {
    return plonkExportSolidityCallData(p.proof, p.publicSignals)
}

export const getGroth16SolidityCallData = (p:ZK_PROOF)=> {
    return groth16ExportSolidityCallData(p.proof, p.publicSignals)
}

export const getSolidityCompiler = (snarkType: string) : Promise<typeof solc> =>{
    let compilerVersion = ""

    switch (snarkType){
        case "groth16":
            compilerVersion = "v0.6.12+commit.27d51765"
            break;
        case "plonk":
            compilerVersion = "v0.7.0+commit.9e61f92b"
            break;
        default:
            throw new Error(`protocol ${snarkType} not supported`)
    }

    return new Promise((resolve, reject)=>{
        solc.loadRemoteVersion(compilerVersion,(err, solc)=>{
            if(err) {
                reject(err)
            }

             resolve(solc)
        })
    })
}