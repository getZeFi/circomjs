import * as fs from "fs";
import * as path from "path";

import CircomJS from "../src/circomJs";
import { ZK_PROOF } from "../src/types";

const testConfigPath = `tests/data/circuitTestConfig.json`;
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

describe("Circuit test", () => {
  beforeAll(() => {
    fs.writeFileSync(testConfigPath, jsonConfig);
  });

  it("should instantiate wasmTester", async () => {
    const c = new CircomJS(testConfigPath);
    const circuit = await c.getCircuit("mul");
    await circuit.compile();

    expect(typeof circuit._wasmTester).toEqual("object");
  });

  it("should generate zKey", async () => {
    const c = new CircomJS(testConfigPath);

    const circuit = c.getCircuit("mul");
    await circuit.compile();
    await circuit.genZKey();
    const zKeyFinalPath = path.join(
      circuit._circuitConfig.outputDir,
      "circuit_final.zkey"
    );

    const isZKeyCreated = fs.existsSync(zKeyFinalPath);
    expect(isZKeyCreated).toBe(true);
  }, 20000);

  it("should calculate witness", async () => {
    const c = new CircomJS(testConfigPath);
    const circuit = c.getCircuit("mul");
    await circuit.compile();
    await circuit.genZKey();
    const w = await circuit.calculateWitness({ x: 3, y: 2 });
    const testWitness = "1,6,3,2"; // For this cID and inputs, this should be the witness string

    expect(w.toString()).toEqual(testWitness);
  }, 30000);

  it("should generate proof", async () => {
    const input = { x: 3, y: 2 };

    const c = new CircomJS(testConfigPath);
    const circuit = c.getCircuit("mul");
    await circuit.compile();
    await circuit.genZKey();
    await circuit.calculateWitness(input);
    const p = (await circuit.genProof(input)) as ZK_PROOF;

    expect(
      p.hasOwnProperty("proof") &&
        p.proof.hasOwnProperty("pi_a") &&
        p.proof.hasOwnProperty("pi_b") &&
        p.proof.hasOwnProperty("pi_c") &&
        p.proof.hasOwnProperty("curve") &&
        p.proof.hasOwnProperty("protocol")
    ).toBe(true);
  }, 30000);

  it("should generate verification Key", async () => {
    const input = { x: 3, y: 2 };
    const c = new CircomJS(testConfigPath);
    const circuit = c.getCircuit("mul");

    await circuit.compile();
    await circuit.genZKey();
    await circuit.calculateWitness(input);
    await circuit.genProof(input);
    await circuit.genVKey();

    const vKeyPath = path.join(
      circuit._circuitConfig.outputDir,
      "verification_key.json"
    );

    const vKeyObject = JSON.parse(fs.readFileSync(vKeyPath, "utf8"));

    expect(
      vKeyObject.hasOwnProperty("protocol") &&
        vKeyObject.hasOwnProperty("curve") &&
        vKeyObject.hasOwnProperty("vk_alpha_1") &&
        vKeyObject.hasOwnProperty("vk_beta_2") &&
        vKeyObject.hasOwnProperty("vk_gamma_2") &&
        vKeyObject.hasOwnProperty("vk_delta_2") &&
        vKeyObject.hasOwnProperty("vk_alphabeta_12")
    ).toBe(true);
  }, 30000);

  it("should verify proof", async () => {
    const input = { x: 3, y: 2 };

    const c = new CircomJS(testConfigPath);
    const circuit = c.getCircuit("mul");
    await circuit.compile();
    await circuit.genZKey();
    await circuit.calculateWitness(input);
    const p = (await circuit.genProof(input)) as ZK_PROOF;
    await circuit.genVKey();
    const verificationRes = await circuit.verifyProof(p);

    expect(verificationRes).toBe(true);
  }, 30000);

  afterAll(() => {
    fs.rmSync(testConfigPath);
  });
});
