import * as fs from 'fs';
import * as path from 'path';

import CircomJS from '../src/circomJs';
import { ZK_PROOF } from '../src/types';
import { proofIsInValidShape } from './helpers';

const testConfigPath = `tests/data/circuitTestConfig.json`;
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
             "compilationMode": "wasm"
           }
         ]
       }
}
`;

describe('Circuit test', () => {
  beforeAll(() => {
    fs.writeFileSync(testConfigPath, jsonConfig);
  });

  it('should generate zKey', async () => {
    const c = new CircomJS(testConfigPath);
    const circuit = c.getCircuit('mul');

    await circuit.compile();
    const zKeyFinalPath = path.join(
      circuit.getOutputDIR(),
      'circuit_final.zkey',
    );

    const isZKeyCreated = fs.existsSync(zKeyFinalPath);
    expect(isZKeyCreated).toBe(true);
  }, 20000);

  it('should calculate witness', async () => {
    const c = new CircomJS(testConfigPath);
    const circuit = c.getCircuit('mul');
    await circuit.compile();
    const w = await circuit.calculateWitness({ x: 3, y: 2 });
    const testWitness = '1,6,3,2'; // For this cID and inputs, this should be the witness string

    expect(w.toString()).toEqual(testWitness);
  }, 30000);

  it('should calculate witness with multiple input interfaces', async () => {
    const c = new CircomJS(testConfigPath);
    const circuit = c.getCircuit('mul');
    await circuit.compile();
    const w = await circuit.calculateWitness({ x: 3, y: 2 });
    const testWitness = '1,6,3,2'; // For this cID and inputs, this should be the witness string

    expect(w.toString()).toEqual(testWitness);
  }, 30000);

  it('should generate proof', async () => {
    const input = { x: 3, y: 2 };

    const c = new CircomJS(testConfigPath);
    const circuit = c.getCircuit('mul');
    await circuit.compile();
    await circuit.calculateWitness(input);
    const p = (await circuit.genProof(input)) as ZK_PROOF;

    expect(proofIsInValidShape(p)).toBe(true);
    expect(await circuit.verifyProof(p)).toBe(true);
  }, 30000);

  it('should generate proof with multiple interfaces', async () => {
    const input = { x: 3, y: 2 };
    const inputStrings = { x: '3', y: '2' };
    const inputBigInts = { x: BigInt(3), y: BigInt(2) };

    const c = new CircomJS(testConfigPath);
    const circuit = c.getCircuit('mul');
    await circuit.compile();

    const p0 = (await circuit.genProof(input)) as ZK_PROOF;
    const p1 = (await circuit.genProof(inputStrings)) as ZK_PROOF;
    const p2 = (await circuit.genProof(inputBigInts)) as ZK_PROOF;

    expect(proofIsInValidShape(p0)).toBe(true);
    expect(proofIsInValidShape(p1)).toBe(true);
    expect(proofIsInValidShape(p2)).toBe(true);

    expect(await circuit.verifyProof(p0)).toBe(true);
    expect(await circuit.verifyProof(p1)).toBe(true);
    expect(await circuit.verifyProof(p2)).toBe(true);
  }, 30000);

  it('should generate verification Key', async () => {
    const input = { x: 3, y: 2 };
    const c = new CircomJS(testConfigPath);
    const circuit = c.getCircuit('mul');

    await circuit.compile();
    await circuit.calculateWitness(input);
    await circuit.genProof(input);

    const vKeyPath = path.join(circuit.getOutputDIR(), 'verification_key.json');
    const vKeyObject = JSON.parse(fs.readFileSync(vKeyPath, 'utf8'));

    expect(
      Object.prototype.hasOwnProperty.call(vKeyObject, 'protocol') &&
        Object.prototype.hasOwnProperty.call(vKeyObject, 'curve') &&
        Object.prototype.hasOwnProperty.call(vKeyObject, 'vk_alpha_1') &&
        Object.prototype.hasOwnProperty.call(vKeyObject, 'vk_beta_2') &&
        Object.prototype.hasOwnProperty.call(vKeyObject, 'vk_gamma_2') &&
        Object.prototype.hasOwnProperty.call(vKeyObject, 'vk_delta_2') &&
        Object.prototype.hasOwnProperty.call(vKeyObject, 'vk_alphabeta_12'),
    ).toBe(true);
  }, 30000);

  it('should verify proof', async () => {
    const input = { a: 3, b: 11 };

    const c = new CircomJS(testConfigPath);
    const circuit = c.getCircuit('circ1000constraints');
    await circuit.compile();
    await circuit.calculateWitness(input);
    const p = (await circuit.genProof(input)) as ZK_PROOF;
    const verificationRes = await circuit.verifyProof(p);

    expect(verificationRes).toBe(true);
  }, 30000);

  it('should calculate total constraints in a circuit', async () => {
    const c = new CircomJS(testConfigPath);
    const n1 = await c.getCircuit('mul').getTotalConstraints();
    const n1000 = await c
      .getCircuit('circ1000constraints')
      .getTotalConstraints();

    expect(n1).toEqual(1);
    expect(n1000).toEqual(1001);
  });

  afterAll(() => {
    fs.rmSync(testConfigPath);
  });
});
