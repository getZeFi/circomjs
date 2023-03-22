import * as path from "path";
import log from "log"

const {wasm: wasmTester} = require("./vendors/circom_tester")

import {CircuitConfig, Networks, Witness, ZK_PROOF} from "./types";
import {genGrothZKey, genPlonkZKey, genVerificationKey} from "./utils/zKey";
import {genGroth16Proof, genPlonkProof, verifyGroth16Proof, verifyPlonkProof} from "./utils/proof";
import * as fs from "fs";
import {getTotalConstraints} from "./utils/r1cs";
import https from 'https';
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

    private async _compile() {
        log.info('compiling circuit:%s, out1:%s', this._circuitConfig.inputFilePath, this._circuitConfig.outputDir)

        if(!fs.existsSync(this._circuitConfig.outputDir)) {
             fs.mkdirSync(this._circuitConfig.outputDir, {recursive:true})
        }

        this._wasmTester = await wasmTester(this._circuitConfig.inputFilePath, {
            output: this._circuitConfig.outputDir,
            ...this._circuitConfig.compileOptions
        })

       
    }

    async compile() {
        await this._compile()
  
        if(!this._circuitConfig.powerOfTauFp || this._circuitConfig.powerOfTauFp.length < 1){
            await this.downloadPowerOfTauFile()
        }
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

    async getTotalConstraints(): Promise<number>{
        if(!fs.existsSync(this._circuitConfig.r1csPath)){
            await this._compile()
        }

        return getTotalConstraints(this._circuitConfig.r1csPath)
    }

    async downloadFileOverHttp (fileUrl, outputPath) {
        log.info('Downloading File: %s', fileUrl)

        const file = fs.createWriteStream(outputPath);
        return new Promise((resolve, reject) => {
            https.get(fileUrl, function(response) {
                response.pipe(file);

                file.on("finish", () => {
                    file.close();
                    resolve(true)
                });
            });
        })
    }

    getTauFileUrlByConstraints (c: number):string {
        let url = ""

        const tauRangeMap ={
            256: "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_08.ptau",
            512: "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_09.ptau",
            1000: "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_10.ptau",
            2000: "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_11.ptau",
            4000: "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau",
            8000: "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_13.ptau",
            16000: "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_14.ptau",
            32000: "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_15.ptau",
            64000: "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_16.ptau",
            128000: "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_17.ptau",
            256000: "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_18.ptau",
            512000: "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_19.ptau",
            1000000: "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_20.ptau",
            2000000: "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_21.ptau",
            4000000: "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_22.ptau",
            8000000: "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_23.ptau",
            16000000: "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_24.ptau",
            32000000: "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_25.ptau",
            64000000: "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_26.ptau",
            128000000: "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_27.ptau",
            256000000: "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final.ptau",
        }

        for (var key in tauRangeMap) {
            if (Object.prototype.hasOwnProperty.call(tauRangeMap, key)) {
                if(c <= (parseInt(key))) {
                    url = tauRangeMap[key]
                    break;
                }
            }
        }

        return url
    }
 
    async downloadPowerOfTauFile(){
        const tauFolderPath =  this._circuitConfig.outputDir + '/tau'

        // tau folder will be created if it doesn't exist
        if(!fs.existsSync(tauFolderPath)) {
            fs.mkdirSync(tauFolderPath, {recursive:true})
        }

        // get tau file url according to total constraints
        const totalConstraints = await this.getTotalConstraints()
        log.info('TotalConstraints: %s', totalConstraints)
        const tauFileUrl = this.getTauFileUrlByConstraints(totalConstraints)

        // creating tau file name according to total constraints
        let stringSplit = tauFileUrl.split("/")
        let tauFileName = stringSplit[stringSplit.length - 1]
        const localTaufilePath = path.resolve(tauFolderPath, tauFileName)

        // change tau file path to the new file path
        this._circuitConfig.powerOfTauFp = localTaufilePath
       
        // if the same tau file is already present, then return
        if (fs.existsSync(tauFolderPath + "/" + tauFileName)) {
            return
        }

        try{
            await this.downloadFileOverHttp(tauFileUrl, localTaufilePath)
        } catch(err){
            log.error("Tau File Download Error: ", err)
        }
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
