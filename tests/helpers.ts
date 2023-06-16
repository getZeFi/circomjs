import { ZK_PROOF } from '../types/types';

export const proofIsInValidShape = (p: ZK_PROOF) => {
  return (
    Object.prototype.hasOwnProperty.call(p, 'proof') &&
    Object.prototype.hasOwnProperty.call(p.proof, 'pi_a') &&
    Object.prototype.hasOwnProperty.call(p.proof, 'pi_b') &&
    Object.prototype.hasOwnProperty.call(p.proof, 'pi_c') &&
    Object.prototype.hasOwnProperty.call(p.proof, 'curve') &&
    Object.prototype.hasOwnProperty.call(p.proof, 'protocol')
  );
};
