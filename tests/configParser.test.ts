import { v4 as uuidv4 } from 'uuid';
import * as fs from "fs";

import {ConfigParser} from "../src/configParser";



describe('ConfigParser test', ()=> {
    beforeAll(async () => {
    })

    it('should instantiate configparser successfully', ()=>{
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
        fs.writeFileSync(configPath, jsonConfig)
        const cfgparser = new ConfigParser(configPath)
        expect(cfgparser._userConfig).toEqual(JSON.parse(jsonConfig))
        fs.rmSync(configPath)
    })

    it('should throw a file doesnt exist error', ()=>{
        const configPath = `tests/data/${uuidv4()}.json`;
        expect ( () => new ConfigParser(configPath)).toThrow("ENOENT: no such file or directory")
    })
})