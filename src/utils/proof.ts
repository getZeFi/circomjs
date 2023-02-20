import {ZK_PROOF} from "../types";
import * as fs from "fs";
const {groth16} = require("snarkjs")
const {plonk} = require("snarkjs")

export const genGroth16Proof = async (inp: any, wasmPath:string, zkeyFilePath:string) => {
    return await groth16.fullProve(inp, wasmPath, zkeyFilePath)
}

export const genPlonkProof = async (inp: any, wasmPath:string, zkeyFilePath:string) => {
    return await plonk.fullProve(inp, wasmPath, zkeyFilePath)
}

export const verifyGroth16Proof = async (vKeyPath: string,p: ZK_PROOF): Promise<boolean> => {
const verifier = JSON.parse(fs.readFileSync(vKeyPath).toString())
return await groth16.verify(verifier, p.publicSignals, p.proof)
}

