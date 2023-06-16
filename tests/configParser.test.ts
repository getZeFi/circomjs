import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';

import { ConfigParser } from '../src/configParser';

describe('ConfigParser test', () => {
  it('should instantiate configparser successfully', () => {
    const configPath = `tests/data/${uuidv4()}.json`;
    const jsonConfig = `
        {
          "projectName": "multiplication_circuits",
          "outputDir": "./tests/data/out",
           "build" :
               {
                 "inputDir": "tests/data/circuits",
                 "circuits": [
                    {
                      "cID": "mul",
                      "fileName": "testtemp/circuit2.circom",
                      "proofType": "groth16",
                      "compilationMode": "wasm"
                   },
                   {
                     "cID": "circ1000constraints",
                     "fileName": "circ1000constraints.circom",
                     "proofType": "groth16",
                     "compilationMode": "wasm"
                   }
                 ]
               }
        }`;
    fs.writeFileSync(configPath, jsonConfig);
    const cfgparser = new ConfigParser(configPath);
    expect(cfgparser.getCFG()).toEqual(JSON.parse(jsonConfig));
    fs.rmSync(configPath);
  });

  it('should throw a file doesnt exist error', () => {
    const configPath = `tests/data/${uuidv4()}.json`;
    expect(() => new ConfigParser(configPath)).toThrow(
      'ENOENT: no such file or directory',
    );
  });

  it('should validate JSON format', () => {
    const configPath = `tests/data/${uuidv4()}.json`;

    const jsonConfig = `
      {
        // "projectName": "multiplication_circuits",
        "outputDir": "./tests/data/out"
      }`;

    fs.writeFileSync(configPath, jsonConfig);
    expect(() => new ConfigParser(configPath)).toThrowError('Unexpected token');
    fs.rmSync(configPath);
  });

  describe('Config JSON keys validations', () => {
    it('should validate outputDir field exists', () => {
      const configPath = `tests/data/${uuidv4()}.json`;

      const jsonConfig = `
        {
          "projectName": "multiplication_circuits"
        }`;

      fs.writeFileSync(configPath, jsonConfig);
      expect(() => new ConfigParser(configPath)).toThrowError(
        'Field "outputDir" is not present in config json',
      );
      fs.rmSync(configPath);
    });

    it('should validate outputDir is writable', () => {
      const configPath = `tests/data/${uuidv4()}.json`;
      // Here, outputDir key should be pointing to the root folder "/" which is not writable
      const jsonConfig = `
          {
            "projectName": "multiplication_circuits",
            "outputDir": "../../../../../../",
             "build" :
                 {
                   "inputDir": "tests/data/circuits",
                   "circuits": [
                      {
                        "cID": "mul",
                        "fileName": "testtemp/circuit2.circom",
                        "proofType": "groth16",
                        "compilationMode": "wasm"
                     },
                     {
                       "cID": "circ1000constraints",
                       "fileName": "circ1000constraints.circom",
                       "proofType": "groth16",
                       "compilationMode": "wasm"
                     }
                   ]
                 }
          }`;

      fs.writeFileSync(configPath, jsonConfig);
      expect(() => new ConfigParser(configPath)).toThrowError(
        'Output directory is not writable',
      );
      fs.rmSync(configPath);
    });

    it('should validate build field exists', () => {
      const configPath = `tests/data/${uuidv4()}.json`;

      const jsonConfig = `
        {
          "projectName": "multiplication_circuits",
          "outputDir": "./tests/data/out"
        }`;

      fs.writeFileSync(configPath, jsonConfig);
      expect(() => new ConfigParser(configPath)).toThrowError(
        'Field "build" is not present in config json',
      );

      fs.rmSync(configPath);
    });

    it('should validate inputDir field exists', () => {
      const configPath = `tests/data/${uuidv4()}.json`;

      const jsonConfig = `
        {
          "projectName": "multiplication_circuits",
          "outputDir": "./tests/data/out",
          "build" : {}
        }`;

      fs.writeFileSync(configPath, jsonConfig);
      expect(() => new ConfigParser(configPath)).toThrowError(
        'Field "inputDir" is not present in config json',
      );

      fs.rmSync(configPath);
    });

    it('should validate circuits field exists', () => {
      const configPath = `tests/data/${uuidv4()}.json`;

      const jsonConfig = `
      {
        "projectName": "multiplication_circuits",
        "outputDir": "./tests/data/out",
         "build" :
             {
               "inputDir": "./circuits"
             }
      }`;

      fs.writeFileSync(configPath, jsonConfig);
      expect(() => new ConfigParser(configPath)).toThrowError(
        'Field "circuits" is not present in config json',
      );

      fs.rmSync(configPath);
    });

    it('should validate that circuits field is not empty', () => {
      const configPath = `tests/data/${uuidv4()}.json`;

      const jsonConfig = `
      {
        "projectName": "multiplication_circuits",
        "outputDir": "./tests/data/out",
        "build" : {
          "inputDir": "tests/data/circuits",
          "circuits": []
        }
      }`;

      fs.writeFileSync(configPath, jsonConfig);
      expect(() => new ConfigParser(configPath)).toThrowError(
        `"circuits" field doesn't have any circuit in config json`,
      );

      fs.rmSync(configPath);
    });

    it('should validate that fileName field exists', () => {
      const configPath = `tests/data/${uuidv4()}.json`;

      const jsonConfig = `
      {
        "projectName": "multiplication_circuits",
        "outputDir": "./tests/data/out",
        "build" :
          {
            "inputDir": "tests/data/circuits",
            "circuits": [
              {
                "cID": "mul",
                "proofType": "groth16",
                "compilationMode": "wasm"
              },
              {
                "cID": "circ1000constraints",
                "fileName": "circ1000constraints.circom",
                "proofType": "groth16",
                "compilationMode": "wasm"
              }
            ]
          }
      }`;

      fs.writeFileSync(configPath, jsonConfig);
      expect(() => new ConfigParser(configPath)).toThrowError(
        `Field "fileName" is not present`,
      );

      fs.rmSync(configPath);
    });

    it('should validate that cID field exists', () => {
      const configPath = `tests/data/${uuidv4()}.json`;

      const jsonConfig = `
      {
        "projectName": "multiplication_circuits",
        "outputDir": "./tests/data/out",
        "build" :
          {
            "inputDir": "tests/data/circuits",
            "circuits": [
              {
                "fileName": "circ1000constraints.circom",
                "proofType": "groth16",
                "compilationMode": "wasm"
              },
              {
                "cID": "circ1000constraints",
                "fileName": "circ1000constraints.circom",
                "proofType": "groth16",
                "compilationMode": "wasm"
              }
            ]
          }
      }`;

      fs.writeFileSync(configPath, jsonConfig);
      expect(() => new ConfigParser(configPath)).toThrowError(
        `Field "cID" is not present`,
      );

      fs.rmSync(configPath);
    });

    it('should validate that cID is unique', () => {
      const configPath = `tests/data/${uuidv4()}.json`;

      const jsonConfig = `
      {
        "projectName": "multiplication_circuits",
        "outputDir": "./tests/data/out",
        "build" :
          {
            "inputDir": "tests/data/circuits",
            "circuits": [
              {
                "cID": "mul",
                "fileName": "circ1000constraints.circom",
                "proofType": "groth16",
                "compilationMode": "wasm"
              },
              {
                "cID": "mul",
                "fileName": "circ1000constraints.circom",
                "proofType": "groth16",
                "compilationMode": "wasm"
              }
            ]
          }
      }`;

      fs.writeFileSync(configPath, jsonConfig);
      expect(() => new ConfigParser(configPath)).toThrowError(
        `Field "cID" is not unique`,
      );

      fs.rmSync(configPath);
    });

    it('should validate the proofType', () => {
      const configPath = `tests/data/${uuidv4()}.json`;

      const jsonConfig = `
      {
        "projectName": "multiplication_circuits",
        "outputDir": "./tests/data/out",
         "build" :
             {
               "inputDir": "tests/data/circuits",
               "circuits": [
                  {
                    "cID": "mul",
                    "fileName": "testtemp/circuit2.circom",
                    "proofType": "someProofType",
                    "compilationMode": "wasm"
                 },
                 {
                   "cID": "circ1000constraints",
                   "fileName": "circ1000constraints.circom",
                   "proofType": "plonk",
                   "compilationMode": "wasm"
                 }
               ]
             }
      }
      `;

      fs.writeFileSync(configPath, jsonConfig);
      expect(() => new ConfigParser(configPath)).toThrowError(
        /Proof type(.*)is not supported/,
      );

      fs.rmSync(configPath);
    });

    it('should assign default proofType', () => {
      const configPath = `tests/data/${uuidv4()}.json`;

      const jsonConfig = `
      {
        "projectName": "multiplication_circuits",
        "outputDir": "./tests/data/out",
         "build" :
             {
               "inputDir": "tests/data/circuits",
               "circuits": [
                  {
                    "cID": "mul",
                    "fileName": "testtemp/circuit2.circom",
                    "compilationMode": "wasm"
                 }
               ]
             }
      }
      `;

      fs.writeFileSync(configPath, jsonConfig);
      const config = new ConfigParser(configPath).getCircuitConfigFromId('mul');
      expect(config.compileOptions.snarkType).toBe('groth16');
      fs.rmSync(configPath);
    });

    it('should validate that input file path exists', () => {
      const configPath = `tests/data/${uuidv4()}.json`;

      const jsonConfig = `
      {
        "projectName": "multiplication_circuits",
        "outputDir": "./tests/data/out",
        "build" :
          {
            "inputDir": "./inputCircuitsDir",
            "circuits": [
              {
                "cID": "mul",
                "fileName": "circ1000constraints.circom",
                "proofType": "groth16",
                "compilationMode": "wasm",
                "powerOfTauFp": "./tests/data/powersOfTau28_hez_final_14.ptau"
              },
              {
                "cID": "circ1000constraints",
                "fileName": "circ1000constraints.circom",
                "proofType": "groth16",
                "compilationMode": "wasm"
              }
            ]
          }
      }`;

      fs.writeFileSync(configPath, jsonConfig);
      expect(() => new ConfigParser(configPath)).toThrowError(
        "Input file path doesn't exist",
      );

      fs.rmSync(configPath);
    });
  });
});
