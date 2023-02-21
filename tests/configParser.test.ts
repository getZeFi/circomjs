import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";

import { ConfigParser } from "../src/configParser";

describe("ConfigParser test", () => {
  beforeAll(async () => {});

  it("should instantiate configparser successfully", () => {
    const configPath = `tests/data/${uuidv4()}.json`;
    const jsonConfig = `
        {
          "projectName": "multiplication_circuits",
          "outputDir": "./out",
           "build" :
               {
                 "inputDir": "./circuits",
                 "circuits": [
                    {
                      "cID": "mul",
                      "fileName": "circuit2.circom",
                      "proofType": "groth16",
                      "compilationMode": "wasm",
                      "powerOfTauFp": "./out/powersOfTau28_hez_final_14.ptau"
                   },
                   {
                     "cID": "circ1000constraints",
                     "fileName": "circ1000constraints.circom",
                     "proofType": "groth16",
                     "compilationMode": "wasm",
                     "powerOfTauFp": "./out/powersOfTau28_hez_final_14.ptau"
                   }
                 ]
               },
          "networks": {
            "mumbai" : {
              "RPC": "https://polygon-mumbai.g.alchemy.com/v2/r15gVaDKI0GNNov_-T5PGSBfxxDLLcNN",
              "PRIV_KEY": "0xbE8052f1c93A45Cf71ce06540C8b0B3c8e96dAfD"
            }
          }
        }`;
    fs.writeFileSync(configPath, jsonConfig);
    const cfgparser = new ConfigParser(configPath);
    expect(cfgparser._userConfig).toEqual(JSON.parse(jsonConfig));
    fs.rmSync(configPath);
  });

  it("should throw a file doesnt exist error", () => {
    const configPath = `tests/data/${uuidv4()}.json`;
    expect(() => new ConfigParser(configPath)).toThrow(
      "ENOENT: no such file or directory"
    );
  });

  it("should validate JSON format", () => {
    const configPath = `tests/data/${uuidv4()}.json`;

    const jsonConfig = `
      {
        // "projectName": "multiplication_circuits",
        "outputDir": "./out"
      }`;

    fs.writeFileSync(configPath, jsonConfig);
    expect(() => new ConfigParser(configPath)).toThrowError("Unexpected token");
    fs.rmSync(configPath);
  });

  describe("Config JSON enum validations", () => {
    it("should validate outputDir field exists", () => {
      const configPath = `tests/data/${uuidv4()}.json`;

      const jsonConfig = `
        {
          "projectName": "multiplication_circuits"
        }`;

      fs.writeFileSync(configPath, jsonConfig);
      expect(() => new ConfigParser(configPath)).toThrowError(
        'Field "outputDir" is not present in config json'
      );
      fs.rmSync(configPath);
    });

    it("should validate build field exists", () => {
      const configPath = `tests/data/${uuidv4()}.json`;

      const jsonConfig = `
        {
          "projectName": "multiplication_circuits",
          "outputDir": "./out"
        }`;

      fs.writeFileSync(configPath, jsonConfig);
      expect(() => new ConfigParser(configPath)).toThrowError(
        'Field "build" is not present in config json'
      );

      fs.rmSync(configPath);
    });

    it("should validate inputDir field exists", () => {
      const configPath = `tests/data/${uuidv4()}.json`;

      const jsonConfig = `
        {
          "projectName": "multiplication_circuits",
          "outputDir": "./out",
          "build" : {}
        }`;

      fs.writeFileSync(configPath, jsonConfig);
      expect(() => new ConfigParser(configPath)).toThrowError(
        'Field "inputDir" is not present in config json'
      );

      fs.rmSync(configPath);
    });

    it("should validate circuits field exists", () => {
      const configPath = `tests/data/${uuidv4()}.json`;

      const jsonConfig = `
      {
        "projectName": "multiplication_circuits",
        "outputDir": "./out",
         "build" :
             {
               "inputDir": "./circuits"
             }
      }`;

      fs.writeFileSync(configPath, jsonConfig);
      expect(() => new ConfigParser(configPath)).toThrowError(
        'Field "circuits" is not present in config json'
      );

      fs.rmSync(configPath);
    });

    it("should validate networks field exists", () => {
      const configPath = `tests/data/${uuidv4()}.json`;

      const jsonConfig = `
      {
        "projectName": "multiplication_circuits",
        "outputDir": "./out",
         "build" :
             {
               "inputDir": "./circuits",
               "circuits": [
                  {
                    "cID": "mul",
                    "fileName": "circuit2.circom",
                    "proofType": "groth16",
                    "compilationMode": "wasm",
                    "powerOfTauFp": "./out/powersOfTau28_hez_final_14.ptau"
                  },
                  {
                    "cID": "circ1000constraints",
                    "fileName": "circ1000constraints.circom",
                    "proofType": "groth16",
                    "compilationMode": "wasm",
                    "powerOfTauFp": "./out/powersOfTau28_hez_final_14.ptau"
                  }
                ]
             }
      }`;

      fs.writeFileSync(configPath, jsonConfig);
      expect(() => new ConfigParser(configPath)).toThrowError(
        'Field "networks" is not present in config json'
      );

      fs.rmSync(configPath);
    });

    it("should validate that circuits field is not empty", () => {
      const configPath = `tests/data/${uuidv4()}.json`;

      const jsonConfig = `
      {
        "projectName": "multiplication_circuits",
        "outputDir": "./out",
        "build" : {
          "inputDir": "./circuits",
          "circuits": []
        },
        "networks": {
          "mumbai" : {
            "RPC": "https://polygon-mumbai.g.alchemy.com/v2/r15gVaDKI0GNNov_-T5PGSBfxxDLLcNN",
            "PRIV_KEY": "0xbE8052f1c93A45Cf71ce06540C8b0B3c8e96dAfD"
          }
        }
      }`;

      fs.writeFileSync(configPath, jsonConfig);
      expect(() => new ConfigParser(configPath)).toThrowError(
        `"circuits" field doesn't have any circuit in config json`
      );

      fs.rmSync(configPath);
    });

    it("should validate that fileName field exists", () => {
      const configPath = `tests/data/${uuidv4()}.json`;

      const jsonConfig = `
      {
        "projectName": "multiplication_circuits",
        "outputDir": "./out",
        "build" :
          {
            "inputDir": "./circuits",
            "circuits": [
              {
                "cID": "mul",
                "proofType": "groth16",
                "compilationMode": "wasm",
                "powerOfTauFp": "./out/powersOfTau28_hez_final_14.ptau"
              },
              {
                "cID": "circ1000constraints",
                "fileName": "circ1000constraints.circom",
                "proofType": "groth16",
                "compilationMode": "wasm",
                "powerOfTauFp": "./out/powersOfTau28_hez_final_14.ptau"
              }
            ]
          },
        "networks": {
          "mumbai" : {
            "RPC": "https://polygon-mumbai.g.alchemy.com/v2/r15gVaDKI0GNNov_-T5PGSBfxxDLLcNN",
            "PRIV_KEY": "0xbE8052f1c93A45Cf71ce06540C8b0B3c8e96dAfD"
          }
        }
      }`;

      fs.writeFileSync(configPath, jsonConfig);
      expect(() => new ConfigParser(configPath)).toThrowError(
        `Field "fileName" is not present`
      );

      fs.rmSync(configPath);
    });

    it("should validate that cID field exists", () => {
      const configPath = `tests/data/${uuidv4()}.json`;

      const jsonConfig = `
      {
        "projectName": "multiplication_circuits",
        "outputDir": "./out",
        "build" :
          {
            "inputDir": "./circuits",
            "circuits": [
              {
                "fileName": "circ1000constraints.circom",
                "proofType": "groth16",
                "compilationMode": "wasm",
                "powerOfTauFp": "./out/powersOfTau28_hez_final_14.ptau"
              },
              {
                "cID": "circ1000constraints",
                "fileName": "circ1000constraints.circom",
                "proofType": "groth16",
                "compilationMode": "wasm",
                "powerOfTauFp": "./out/powersOfTau28_hez_final_14.ptau"
              }
            ]
          },
        "networks": {
          "mumbai" : {
            "RPC": "https://polygon-mumbai.g.alchemy.com/v2/r15gVaDKI0GNNov_-T5PGSBfxxDLLcNN",
            "PRIV_KEY": "0xbE8052f1c93A45Cf71ce06540C8b0B3c8e96dAfD"
          }
        }
      }`;

      fs.writeFileSync(configPath, jsonConfig);
      expect(() => new ConfigParser(configPath)).toThrowError(
        `Field "cID" is not present`
      );

      fs.rmSync(configPath);
    });

    it("should validate that cID is unique", () => {
      const configPath = `tests/data/${uuidv4()}.json`;

      const jsonConfig = `
      {
        "projectName": "multiplication_circuits",
        "outputDir": "./out",
        "build" :
          {
            "inputDir": "./circuits",
            "circuits": [
              {
                "cID": "mul",
                "fileName": "circ1000constraints.circom",
                "proofType": "groth16",
                "compilationMode": "wasm",
                "powerOfTauFp": "./out/powersOfTau28_hez_final_14.ptau"
              },
              {
                "cID": "mul",
                "fileName": "circ1000constraints.circom",
                "proofType": "groth16",
                "compilationMode": "wasm",
                "powerOfTauFp": "./out/powersOfTau28_hez_final_14.ptau"
              }
            ]
          },
        "networks": {
          "mumbai" : {
            "RPC": "https://polygon-mumbai.g.alchemy.com/v2/r15gVaDKI0GNNov_-T5PGSBfxxDLLcNN",
            "PRIV_KEY": "0xbE8052f1c93A45Cf71ce06540C8b0B3c8e96dAfD"
          }
        }
      }`;

      fs.writeFileSync(configPath, jsonConfig);
      expect(() => new ConfigParser(configPath)).toThrowError(
        `Field "cID" is not unique`
      );

      fs.rmSync(configPath);
    });

    it("should validate that input file path exists", () => {
      const configPath = `tests/data/${uuidv4()}.json`;

      const jsonConfig = `
      {
        "projectName": "multiplication_circuits",
        "outputDir": "./out",
        "build" :
          {
            "inputDir": "./inputCircuitsDir",
            "circuits": [
              {
                "cID": "mul",
                "fileName": "circ1000constraints.circom",
                "proofType": "groth16",
                "compilationMode": "wasm",
                "powerOfTauFp": "./out/powersOfTau28_hez_final_14.ptau"
              },
              {
                "cID": "circ1000constraints",
                "fileName": "circ1000constraints.circom",
                "proofType": "groth16",
                "compilationMode": "wasm",
                "powerOfTauFp": "./out/powersOfTau28_hez_final_14.ptau"
              }
            ]
          },
        "networks": {
          "mumbai" : {
            "RPC": "https://polygon-mumbai.g.alchemy.com/v2/r15gVaDKI0GNNov_-T5PGSBfxxDLLcNN",
            "PRIV_KEY": "0xbE8052f1c93A45Cf71ce06540C8b0B3c8e96dAfD"
          }
        }
      }`;

      fs.writeFileSync(configPath, jsonConfig);
      expect(() => new ConfigParser(configPath)).toThrowError(
        "Input file path doesn't exist"
      );

      fs.rmSync(configPath);
    });
  });
});
