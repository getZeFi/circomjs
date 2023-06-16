// throws  if generationFails
import * as path from 'path';
import * as fs from 'fs';

import { zKey } from 'snarkjs';
import { plonk } from 'snarkjs';
import { getCurveFromName } from './curves';
import util from 'util';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const exec = util.promisify(require('child_process').exec);

export const genGrothZKey = async (
  outputDir: string,
  circuitName: string,
  powerofTauPath: string,
): Promise<void> => {
  const r1cs = path.join(outputDir, circuitName + '.r1cs');
  const zKeyPath_0000 = path.join(outputDir, 'circuit_0000.zkey');
  const zKeyPath_0001 = path.join(outputDir, 'circuit_0001.zkey');
  const zKeyPath_0002 = path.join(outputDir, 'circuit_0002.zkey');
  const zKeyPath_0003 = path.join(outputDir, 'circuit_0003.zkey');
  const zKeyFinal = path.join(outputDir, 'circuit_final.zkey');

  const challenge_phase2_0003 = path.join(outputDir, 'challenge_phase2_0003');
  const response_phase2_0003 = path.join(outputDir, 'response_phase2_0003');

  await zKey.newZKey(r1cs, powerofTauPath, zKeyPath_0000);
  await zKey.contribute(
    zKeyPath_0000,
    zKeyPath_0001,
    '1st Contributor Name',
    'askljdaklsdjkls',
  );
  await zKey.contribute(
    zKeyPath_0001,
    zKeyPath_0002,
    '2nd Contributor Name',
    'askljdaklsdjkls',
  );

  await zKey.exportBellman(zKeyPath_0002, challenge_phase2_0003);
  const curve = await getCurveFromName('bn128');
  await zKey.bellmanContribute(
    curve,
    challenge_phase2_0003,
    response_phase2_0003,
    'asjdakdklasjdkl',
  );
  await zKey.importBellman(
    zKeyPath_0002,
    response_phase2_0003,
    zKeyPath_0003,
    'third contribution name',
  );

  await zKey.verifyFromR1cs(r1cs, powerofTauPath, zKeyPath_0003);

  await zKey.beacon(
    zKeyPath_0003,
    zKeyFinal,
    'Final beacon phase 2',
    '0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
    10,
  );

  // TODO: this must node take place from shell, quick fix for now
  await exec(
    `snarkjs zkey beacon ${zKeyPath_0003} ${zKeyFinal} 0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="Final Beacon phase2"`,
  );
  // if(stderr){
  //     throw new Error(stderr)
  // }

  await zKey.verifyFromR1cs(r1cs, powerofTauPath, zKeyFinal);
  return;
};

export const genPlonkZKey = async (
  cktr1csFp: string,
  ptauFp: string,
  zkeyFp: string,
): Promise<void> => {
  return plonk.setup(cktr1csFp, ptauFp, zkeyFp);
};

export const genVerificationKey = async (
  zKeyPath: string,
  vKeyPath: string,
): Promise<void> => {
  const res = await zKey.exportVerificationKey(zKeyPath);
  fs.writeFileSync(vKeyPath, JSON.stringify(res));
};
