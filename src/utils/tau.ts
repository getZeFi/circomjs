import { tauRangeMap } from '../data';

export const getTauFileUrlByConstraints = (c: number): string => {
  const k = Object.keys(tauRangeMap).find((k) => {
    return c <= parseInt(k);
  });
  if (typeof k === 'undefined') {
    throw new Error(`no matching entry found for constraints size ${c}`);
  }

  return tauRangeMap[k];
};
