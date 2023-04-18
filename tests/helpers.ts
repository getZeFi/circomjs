import { ZK_PROOF } from '../types/types';

export const proofIsInValidShape = (p: ZK_PROOF) => {
  return (
    p.hasOwnProperty('proof') &&
    p.proof.hasOwnProperty('pi_a') &&
    p.proof.hasOwnProperty('pi_b') &&
    p.proof.hasOwnProperty('pi_c') &&
    p.proof.hasOwnProperty('curve') &&
    p.proof.hasOwnProperty('protocol')
  );
};
