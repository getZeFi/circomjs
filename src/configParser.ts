import * as fs from "fs";
import * as path from "path";
import log = require('log');

import {UserConfig, BuildCircuitInfo, CircuitConfig, Networks,} from "./types";
import {NodeWorker} from "inspector";

export class ConfigParser {
    _fp: string;
    _cfg: any;  // FIXME: any type should not be used
    _userConfig: UserConfig;
    _idToCircuitCfg: Map<string, CircuitConfig>;

    constructor(cfgFp: string) {
        this._fp = path.resolve(cfgFp);
        this._idToCircuitCfg = new Map();

        this._cfg = this.parse(this._fp)
        this._userConfig = this._validate()
        this._prepareIdToCircuitCfg()
    }

    parse(fp: string): any {
        log.info("reading config, path:", fp)
        const cfgBuff = fs.readFileSync(fp)
        // TODO: JSON might be incorrect due to commas comments etc
        return JSON.parse(cfgBuff.toString());
    }

    _validate(): UserConfig {
        // can throw errors
        // throws an error if a config file is invalid
        // If it doesn't throw error, then safe to assume that `cfg` can be cast to type `CFG`
        // ASSIGN: Shivam
        // one example is that cIDs for each build info should be unique throw an error if that fails

        if (!this._cfg && !this._cfg.outputDir && !this._cfg.build && this._cfg.networks) {
            throw new Error(`config parsing failed, filepath:${this._fp}`)
        }
        return Object.assign({}, this._cfg) as UserConfig;
    }

    _prepareIdToCircuitCfg() {
        const {outputDir} = this._userConfig;
        const {inputDir, powerOfTauFp, circuits} = this._userConfig.build;

        circuits.forEach((c: BuildCircuitInfo) => {
            const cktName = this._getCircuitName(c.fileName)
            const cktOutputDir = path.join(outputDir, `${cktName}`)
            const cID = c.cID ? c.cID : cktName
            const opts: CircuitConfig = {
                cId: cID,
                cktName: cktName,
                inputFilePath: path.join(inputDir, c.fileName),
                outputDir: cktOutputDir,
                powerOfTauFp: path.resolve(powerOfTauFp),
                // This is not used since circom spits the output files in a fixed dir structure. It is here for consistency.
                jsPath: path.join(cktOutputDir, `${cktName}_js`),
                // This is here for consistency. It is not used but the output of wasm file in same as wasmPath.
                wasmPath: path.join(cktOutputDir, `${cktName}_js`, `${cktName}.wasm`),
                zKeyPath: path.join(cktOutputDir, "circuit_final.zkey"),    // DO NOT change the names
                vKeyPath: path.join(cktOutputDir, "verification_key.json"), // DO NOT change the names
                compileOptions: {
                    include: [],
                    snarkType: "groth16",
                    sym: true,
                    r1cs: true,
                    json: false,
                    prime: false,
                    O: 0,
                    verbose: false
                }
            }
            this._idToCircuitCfg.set(cID, opts)
        })
    }

    _getCircuitName(fileName: string) {
        return fileName.split(".")[0]
    }

    getCircuitConfigFromId(cid: string): CircuitConfig {
        if (this._idToCircuitCfg.has(cid)) {
            return this._idToCircuitCfg.get(cid) as CircuitConfig; // ASKME how to avoid typecasting here
        }
        throw new Error(`Invalid ckt ID requested, cid:${cid}`)
    }

    listCircuitIds(): string[] {
        return Array.from(this._idToCircuitCfg.keys());
    }

    getNewtworks(): Networks {
        return this._userConfig.networks;
    }
}