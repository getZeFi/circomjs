import { r1cs } from 'snarkjs';
const { info } = r1cs;

// TODO: provide typescript type for the return type
const getR1CSInfo = async (r1csFilePath: string) => {
  return await info(r1csFilePath);
};

export const getTotalConstraints = async (
  r1csFilePath: string,
): Promise<number> => {
  const { nConstraints } = await getR1CSInfo(r1csFilePath);
  return nConstraints;
};
