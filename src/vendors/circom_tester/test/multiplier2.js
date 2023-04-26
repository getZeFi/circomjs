import { join } from 'path';
import { wasm as wasm_tester } from './../index';
import { c as c_tester } from './../index';

import { Scalar } from 'ffjavascript';
export const p = Scalar.fromString(
  '21888242871839275222246405745257275088548364400416034343698204186575808495617',
);


describe('Simple test', function () {
  this.timeout(100000);

  it('Checking the compilation of a simple circuit generating wasm', async function () {
    const circuit = await wasm_tester(
      join(__dirname, 'Multiplier2.circom'),
    );
    const w = await circuit.calculateWitness({ a: 2, b: 4 });
    await circuit.checkConstraints(w);
  });

  it('Checking the compilation of a simple circuit generating wasm in a given folder', async function () {
    const circuit = await wasm_tester(
      join(__dirname, 'Multiplier2.circom'),
      { output: join(__dirname) },
    );
    const w = await circuit.calculateWitness({ a: 2, b: 4 });
    await circuit.checkConstraints(w);
  });

  it('Checking the compilation of a simple circuit generating wasm in a given folder without recompiling', async function () {
    const circuit = await wasm_tester(
      join(__dirname, 'Multiplier2.circom'),
      { output: join(__dirname), recompile: false },
    );
    const w = await circuit.calculateWitness({ a: 6, b: 3 });
    await circuit.checkConstraints(w);
  });

  it('Checking the compilation of a simple circuit generating C', async function () {
    const circuit = await c_tester(join(__dirname, 'Multiplier2.circom'));
    try {
      const w = await circuit.calculateWitness({ a: 2, b: 4 });
      await circuit.checkConstraints(w);
    } catch (e) {
      if (e.message.includes('Illegal instruction')) {
        // GitHub Actions may run on older hardware that doesn't support ADX
        // instructions used in cpp witness calculator
        // If such a case, skip this test
        this.skip();
      } else {
        throw e;
      }
    }
  });

  it('Checking the compilation of a simple circuit generating C in a given folder', async function () {
    const circuit = await c_tester(join(__dirname, 'Multiplier2.circom'), {
      output: join(__dirname),
    });
    try {
      const w = await circuit.calculateWitness({ a: 2, b: 4 });
      await circuit.checkConstraints(w);
    } catch (e) {
      if (e.message.includes('Illegal instruction')) {
        this.skip();
      } else {
        throw e;
      }
    }
  });

  it('Checking the compilation of a simple circuit generating C in a given folder without recompiling', async function () {
    const circuit = await c_tester(join(__dirname, 'Multiplier2.circom'), {
      output: join(__dirname),
      recompile: false,
    });
    try {
      const w = await circuit.calculateWitness({ a: 6, b: 3 });
      await circuit.checkConstraints(w);
    } catch (e) {
      if (e.message.includes('Illegal instruction')) {
        this.skip();
      } else {
        throw e;
      }
    }
  });
});
