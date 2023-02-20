import * as fs from "fs";
import * as path from "path";
import log = require("log");

import { UserConfig, BuildCircuitInfo, CircuitConfig, Networks } from "./types";
import { NodeWorker } from "inspector";

export class ConfigParser {
  _fp: string;
  _userConfig: UserConfig;
  _idToCircuitCfg: Map<string, CircuitConfig>;

  constructor(cfgFp: string) {
    this._fp = path.resolve(cfgFp);
    this._idToCircuitCfg = new Map();

    this._userConfig = this._parseAndValidate(this._fp);
    this._prepareIdToCircuitCfg();
  }

  _areCircuitsValid(config: UserConfig): boolean {
    let isValid = true;
    let cIDListSoFar = Object.create(null);
    const circuitList = config.build.circuits;
    const {
      build: { inputDir },
    } = config;

    for (let i = 0; i < circuitList.length; i++) {
      // Check for all the circuit fields
      if (!circuitList[i].fileName || !circuitList[i].cID) {
        isValid = false;
        break;
      }

      // Check for unique cID
      let currentID = circuitList[i].cID;
      if (currentID in cIDListSoFar) {
        isValid = false;
        break;
      }

      cIDListSoFar[currentID] = true;

      // Check if input path is valid
      const inputFilePath = this._getCircuitInputPath(inputDir, circuitList[i]);
      if (!fs.existsSync(inputFilePath)) {
        isValid = false;
        break;
      }

      // Check if ouput path is valid
      const outputFilePath = path.resolve(".");
      try {
        fs.accessSync(outputFilePath, fs.constants.W_OK);
      } catch (err) {
        isValid = false;
        break;
      }
    }

    return isValid;
  }

  _parseAndValidate(fp: string): UserConfig {
    log.info("reading config, path:", fp);
    const cfgBuff = fs.readFileSync(fp);

    const parsedConfig: UserConfig = JSON.parse(cfgBuff.toString());
    try {
      if (
        !parsedConfig ||
        !parsedConfig.outputDir ||
        !parsedConfig.build?.inputDir ||
        !parsedConfig.build?.circuits ||
        !this._areCircuitsValid(parsedConfig) ||
        !parsedConfig.networks
      ) {
        throw new Error(`config parsing failed, filepath:${this._fp}`);
      }

      return Object.assign({}, parsedConfig);
    } catch (err) {
      //   throw new Error(`config parsing failed, filepath:${this._fp}`);
      console.log(`config parsing failed, filepath:${this._fp}`);
      process.exit(0);
    }
  }

  _getCircuitInputPath(inputDir: string, circuit: BuildCircuitInfo): string {
    return path.join(inputDir, `${circuit.fileName}`);
  }

  _prepareIdToCircuitCfg() {
    const { outputDir } = this._userConfig;
    const { inputDir, circuits } = this._userConfig.build;

    circuits.forEach((c: BuildCircuitInfo) => {
      const cktName = this._getCircuitName(c.fileName);
      const cktOutputDir = path.join(outputDir, `${cktName}`);
      const cID = c.cID ? c.cID : cktName;

      const opts: CircuitConfig = {
        cId: cID,
        cktName: cktName,
        inputFilePath: this._getCircuitInputPath(inputDir, c),
        outputDir: cktOutputDir,
        powerOfTauFp: path.resolve(
          c.powerOfTauFp ? c.powerOfTauFp : "./circuits/power_of_tau.ptau" // Calculate total constraints from r1cs file, and download it
        ),
        // This is not used since circom spits the output files in a fixed dir structure. It is here for consistency.
        jsPath: path.join(cktOutputDir, `${cktName}_js`),
        // This is here for consistency. It is not used but the output of wasm file in same as wasmPath.
        wasmPath: path.join(cktOutputDir, `${cktName}_js`, `${cktName}.wasm`),
        zKeyPath: path.join(cktOutputDir, "circuit_final.zkey"), // DO NOT change the names
        vKeyPath: path.join(cktOutputDir, "verification_key.json"), // DO NOT change the names
        compileOptions: {
          include: [],
          snarkType: "groth16",
          sym: true,
          r1cs: true,
          json: false,
          prime: false,
          O: 0,
          verbose: false,
        },
      };
      this._idToCircuitCfg.set(cID, opts);
    });
  }

  _getCircuitName(fileName: string) {
    return fileName.split(".")[0];
  }

  getCircuitConfigFromId(cid: string): CircuitConfig {
    if (this._idToCircuitCfg.has(cid)) {
      return this._idToCircuitCfg.get(cid) as CircuitConfig; // ASKME how to avoid typecasting here
    }
    throw new Error(`Invalid ckt ID requested, cid:${cid}`);
  }

  listCircuitIds(): string[] {
    return Array.from(this._idToCircuitCfg.keys());
  }

  getNewtworks(): Networks {
    return this._userConfig.networks;
  }
}
