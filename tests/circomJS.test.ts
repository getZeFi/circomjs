import CircomJS from "../src/circomJs";
import * as fs from "fs";
import { Circuit } from "./../src/circuit";

const testConfigPath = `tests/data/circomJSTestConfig.json`;
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
              "compilationMode": "wasm",
              "powerOfTauFp": "./tests/data/powersOfTau28_hez_final_14.ptau"
           },
           {
             "cID": "circ1000constraints",
             "fileName": "circ1000constraints.circom",
             "proofType": "plonk",
             "compilationMode": "c"
           }
         ]
       }
}
`;

describe("CircomJS test", () => {
  beforeAll(() => {
    fs.writeFileSync(testConfigPath, jsonConfig);
  });

  it("should instantiate CircomJS", () => {
    const c = new CircomJS(testConfigPath);

    expect(c instanceof CircomJS).toBe(true);
  });

  it("should get circuit from cID", () => {
    const c = new CircomJS(testConfigPath);

    const cIDList = c.getCIDs()
    
    cIDList.forEach((cID) => {
      const circuit = c.getCircuit(cID);
      expect(circuit instanceof Circuit).toBe(true);
    });
  });

  afterAll(() => {
    fs.rmSync(testConfigPath);
  });
});
