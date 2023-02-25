import CircomJS from "../src/circomJs";
import * as fs from "fs";

const testConfigPath = `tests/data/circomJSTestConfig.json`;
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
             "proofType": "plonk",
             "compilationMode": "wasm",
             "powerOfTauFp": "./out/powersOfTau28_hez_final_14.ptau"
           }
         ]
       },
  "networks": {
    "delhi" : {
      "RPC": "http://url:8080/v1/2323 ",
      "PRIV_KEY": "0xhfsnskndHJDbdsnskndHJDbds"
    }
  }
}
`;

describe("CircomJS test", () => {
  beforeAll(() => {
    fs.writeFileSync(testConfigPath, jsonConfig);
  });

  it("should instantiate CircomJS", () => {
    const c = new CircomJS(testConfigPath);
    expect(c._cIdToCircuit.size).toBe(2);
  });

  it("get circuit from cID", () => {
    const c = new CircomJS(testConfigPath);
    const circuit = c.getCircuit("mul");
    expect(
      circuit.hasOwnProperty("_circuitConfig") &&
        circuit.hasOwnProperty("_networks")
    ).toBe(true);
  });

  afterAll(() => {
    fs.rmSync(testConfigPath);
  });
});
