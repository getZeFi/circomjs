import { CircuitInput, ZK_PROOF } from '../types';
import * as fs from 'fs';

import { groth16, plonk } from 'snarkjs';

export const genGroth16Proof = async (
  inp: CircuitInput,
  wasmPath: string,
  zkeyFilePath: string,
) => {
  return await groth16.fullProve(inp, wasmPath, zkeyFilePath);
};

export const genPlonkProof = async (
  inp: CircuitInput,
  wasmPath: string,
  zkeyFilePath: string,
) => {
  return await plonk.fullProve(inp, wasmPath, zkeyFilePath);
};

export const verifyGroth16Proof = async (
  vKeyPath: string,
  p: ZK_PROOF,
): Promise<boolean> => {
  const verifier = JSON.parse(fs.readFileSync(vKeyPath).toString());
  return await groth16.verify(verifier, p.publicSignals, p.proof);
};

export const verifyPlonkProof = async (
  vKeyPath: string,
  p: ZK_PROOF,
): Promise<boolean> => {
  const verifier = JSON.parse(fs.readFileSync(vKeyPath).toString());
  return await plonk.verify(verifier, p.publicSignals, p.proof);
};
