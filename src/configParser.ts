import * as fs from 'fs';
import * as path from 'path';
import log from 'log';
import { CFG, BuildCircuitInfo, CircuitConfig, Networks } from './types';

export class ConfigParser {
  private _fp: string;
  private _cfg: CFG;
  private _idToCircuitCfg: Map<string, CircuitConfig>;

  constructor(cfgFp: string) {
    this._fp = path.resolve(cfgFp);
    this._idToCircuitCfg = new Map();

    this._cfg = this._parseAndValidate(this._fp);
    this._prepareIdToCircuitCfg();
  }

  private _parseAndValidate(fp: string): CFG {
    log.info('reading config, path:', fp);

    fs.accessSync(fp, fs.constants.R_OK);

    const cfgBuff = fs.readFileSync(fp);

    const parsedConfig: CFG = JSON.parse(cfgBuff.toString());

    if (!parsedConfig) {
      throw new Error(`Config parsing failed, filepath:${this._fp}`);
    } else if (!parsedConfig.outputDir) {
      throw new Error(
        `Field "outputDir" is not present in config json, File Path : ${this._fp}`,
      );
    } else if (!parsedConfig.build) {
      throw new Error(
        `Field "build" is not present in config json, File Path : ${this._fp}`,
      );
    } else if (!parsedConfig.build.inputDir) {
      throw new Error(
        `Field "inputDir" is not present in config json, File Path : ${this._fp}`,
      );
    } else if (!parsedConfig.build?.circuits) {
      throw new Error(
        `Field "circuits" is not present in config json, filepath:${this._fp}`,
      );
    }

    const circuitsValidation = this._areCircuitsValid(parsedConfig);
    if (circuitsValidation !== '') {
      throw new Error(circuitsValidation);
    }

    // Check if ouput directory path is valid
    const outputDirectory = path.resolve(parsedConfig.outputDir);
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory, { recursive: true });
    } else {
      try {
        fs.accessSync(outputDirectory, fs.constants.W_OK);
      } catch (err) {
        throw new Error(
          `Output directory is not writable. Please check outputDir in config json, filepath:${this._fp}`,
        );
      }
    }

    return Object.assign({}, parsedConfig);
  }

  private _areCircuitsValid(config: CFG): string {
    const cIDListSoFar = Object.create(null);
    const circuitList = config.build?.circuits;
    const {
      build: { inputDir },
    } = config;

    if (!circuitList || circuitList.length < 1) {
      return `"circuits" field doesn't have any circuit in config json, File Path : ${this._fp}`;
    }

    for (let i = 0; i < circuitList.length; i++) {
      // Check for circuit file name
      if (!circuitList[i].fileName) {
        return `Field "fileName" is not present in circuit on index ${i}, File Path : ${this._fp}`;
      }

      // Check for circuit cID
      if (!circuitList[i].cID) {
        return `Field "cID" is not present in circuit on index ${i}, File Path : ${this._fp}`;
      }

      // Check for unique cID
      const currentID = circuitList[i].cID;
      if (currentID in cIDListSoFar) {
        return `Field "cID" is not unique in the circuits, File Path : ${this._fp}`;
      }

      // Check for circuit proofType is valid
      switch (circuitList[i].proofType) {
        case undefined:
          break;
        case 'plonk':
          break;
        case 'groth16':
          break;
        default:
          return `Proof type ${circuitList[i].proofType} is not supported`;
      }

      cIDListSoFar[currentID] = true;

      // Check if input path is valid
      const inputFilePath = this._getCircuitInputPath(inputDir, circuitList[i]);
      if (!fs.existsSync(inputFilePath)) {
        return `Input file path doesn't exist. Check "inputDir" field in config json, File Path : ${this._fp}`;
      }
    }

    return '';
  }

  private _getCircuitInputPath(
    inputDir: string,
    circuit: BuildCircuitInfo,
  ): string {
    return path.join(inputDir, `${circuit.fileName}`);
  }

  private _prepareIdToCircuitCfg() {
    const { outputDir } = this._cfg;
    const { inputDir, circuits } = this._cfg.build;

    circuits.forEach((c: BuildCircuitInfo) => {
      const cktName = this._getCircuitName(c.fileName);
      const cktOutputDir = path.join(outputDir, `${cktName}`);
      const cID = c.cID ? c.cID : cktName;

      const opts: CircuitConfig = {
        cId: cID,
        cktName: cktName,
        inputFilePath: this._getCircuitInputPath(inputDir, c),
        outputDir: cktOutputDir,
        // powerOfTau file is dowloaded according to the total constraints and this powerOfTauFp is assigned in downloadPowerOfTauFile function
        powerOfTauFp: c.powerOfTauFp ? path.resolve(c.powerOfTauFp) : '',
        // This is not used since circom spits the output files in a fixed dir structure. It is here for consistency.
        jsPath: path.join(cktOutputDir, `${cktName}_js`),
        // This is here for consistency. It is not used but the output of wasm file in same as wasmPath.
        wasmPath: path.join(cktOutputDir, `${cktName}_js`, `${cktName}.wasm`),
        zKeyPath: path.join(cktOutputDir, 'circuit_final.zkey'), // DO NOT change the names
        vKeyPath: path.join(cktOutputDir, 'verification_key.json'), // DO NOT change the names
        r1csPath: path.join(cktOutputDir, `${cktName}.r1cs`),
        compileOptions: {
          include: [],
          snarkType: c.proofType ? c.proofType : 'groth16',
          sym: true,
          r1cs: true,
          json: false,
          prime: false,
          c: false,
          wat: false,
          O: c.compileOptions ? c.compileOptions.O : 0,
          verbose: false,
        },
      };
      this._idToCircuitCfg.set(cID, opts);
    });
  }

  private _getCircuitName(fileName: string) {
    return path.basename(fileName).split('.')[0];
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

  getNetworks(): Networks {
    return this._cfg.networks;
  }

  getCFG() {
    return this._cfg;
  }
}
