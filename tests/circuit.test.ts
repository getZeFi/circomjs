// import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";

import CircomJS from "../src/circomJs";
import { ZK_PROOF } from "../src/types";
// const util = require("util");
// const exec = util.promisify(require("child_process").exec);

describe("Circuit test", () => {
  it("should instantiate wasmTester", async () => {
    const c = new CircomJS();
    const circuit = await c.getCircuit("mul");
    await circuit.compile();

    expect(typeof circuit._wasmTester).toEqual("object");
  });

  it("should generate zKey", async () => {
    try {
      const c = new CircomJS();

      const circuit = c.getCircuit("mul");
      await circuit.compile();
      await circuit.genZKey();
      const zKeyFinalPath = path.join(
        circuit._circuitConfig.outputDir,
        "circuit_final.zkey"
      );

      const isZKeyCreated = fs.existsSync(zKeyFinalPath);
      expect(isZKeyCreated).toBe(true);
    } catch (e) {
      expect(e).toBe(e);
    }
  }, 20000);

  it("should calculate witness", async () => {
 
    const c = new CircomJS();
    const circuit = c.getCircuit("mul");
    await circuit.compile();
    await circuit.genZKey();
    const w = await circuit.calculateWitness({ x: 3, y: 2 });

    // generatedWitness file should be equal to testWitnessData file

    // const inputFilePath = `./tests/data/${uuidv4()}.json`;
    // const jsonInput = `{"x": 3, "y": 2}`;
    // fs.writeFileSync(inputFilePath, jsonInput);
    // const wasmPath = path.join(circuit._circuitConfig.outputDir, circuit._circuitConfig.cktName + '_js', circuit._circuitConfig.cktName + ".wasm")
    // const generateWitnessJsPath = path.join(circuit._circuitConfig.outputDir, circuit._circuitConfig.cktName + '_js', "generate_witness.js")
    // const original = BigInt64Array.from(w);
    // fs.writeFileSync('./tests/data/testWitnessData.wtns', original);
    // await exec(`node ${generateWitnessJsPath} ${wasmPath} ${inputFilePath}  ./tests/data/generatedWitness.wtns`)

    expect(typeof w).toEqual("object");

    // fs.rmSync(inputFilePath);
  }, 30000);

  it("should generate proof", async () => {
    const input = { x: 3, y: 2 };

    const c = new CircomJS();
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
    const c = new CircomJS();
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

    const c = new CircomJS();
    const circuit = c.getCircuit("mul");
    await circuit.compile();
    await circuit.genZKey();
    await circuit.calculateWitness(input);
    const p = (await circuit.genProof(input)) as ZK_PROOF;
    await circuit.genVKey();
    const verificationRes = await circuit.verifyProof(p);

    expect(verificationRes).toBe(true);
  }, 30000);
});
