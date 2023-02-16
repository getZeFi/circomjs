import * as fs from "fs";
import * as path from "path";
import {CompileOptions} from "./options";
import {BuildCircuitInfo, CFG, CircuitCircomTester} from "./types";
import {checkConfigIsValid, getPathFromCID, getPathWithoutCircomExtension, isCID} from "./utils/cfg";
import {Circuit} from "./circuit";

const circomTester = require("/Users/harshbajpai/Desktop/Projects/circom_tester")
const {wasm}=  circomTester

const outputDir = path.join(process.cwd(), "./out")

export default class CircomWrapper {
    _circuitMap: Map<string, CompileOptions> = new Map()
    _cfg: CFG

    constructor() {
       const cfgBuff = fs.readFileSync("./circuit.config.json")
       this._cfg = this.parseCfg(cfgBuff)
    }

    parseCfg(cfgBuff: Buffer) : CFG{
        const cfg =  JSON.parse(cfgBuff.toString())
        checkConfigIsValid(cfg)


        const {inputDir, circuits} = cfg.build
        circuits.forEach((c: BuildCircuitInfo) => {
            const cID = c.cID? c.cID: this._getCID(c.name)
            const o = new CompileOptions(path.join(outputDir, inputDir+"_"+ this._getFileName(c.name)))
            this._circuitMap.set(cID, o)
        })

        return cfg
    }

    _getFileName(cNameWithExtn: string):string{
       return cNameWithExtn.split(".")[0]
    }

    async getCircuit(cID: string): Promise<Circuit> {
        const circuitOptions = this._circuitMap.get(cID)
        if(!circuitOptions){
            throw new Error(`error: no circuit found for circuit ID => ${cID}`)

        }

        let cPath: string
        if(isCID(this._cfg,cID)){
            cPath = this._getCircuitPath(getPathFromCID(this._cfg,cID))
        }
        else {
            // in this case cID is the relative path of the circuit
            cPath = this._getCircuitPath(cID)
        }

        const opts = this._circuitMap.get(cID)
        const c = await wasm(cPath, opts)

        const cName = this._getFileName(path.basename(cPath))
        return new Circuit(c, cName,"groth16", circuitOptions.output, this._cfg.networks)
    }

    _getCircuitPath(cPath:string) : string {
        return path.join(process.cwd(), this._cfg.build.inputDir, cPath)
    }

    _getCID(cName: string) : string{
        return cName
    }
}