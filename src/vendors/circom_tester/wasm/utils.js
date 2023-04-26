import { hash } from 'fnv-plus';

const _fnvHash = fnvHash;
export { _fnvHash as fnvHash };
const _toArray32 = toArray32;
export { _toArray32 as toArray32 };
const _fromArray32 = fromArray32;
export { _fromArray32 as fromArray32 };
const _flatArray = flatArray;
export { _flatArray as flatArray };
const _normalize = normalize;
export { _normalize as normalize };

function toArray32(rem, size) {
  const res = []; //new Uint32Array(size); //has no unshift
  const radix = BigInt(0x100000000);
  while (rem) {
    res.unshift(Number(rem % radix));
    rem = rem / radix;
  }
  if (size) {
    var i = size - res.length;
    while (i > 0) {
      res.unshift(0);
      i--;
    }
  }
  return res;
}

function fromArray32(arr) {
  //returns a BigInt
  var res = BigInt(0);
  const radix = BigInt(0x100000000);
  for (let i = 0; i < arr.length; i++) {
    res = res * radix + BigInt(arr[i]);
  }
  return res;
}

function flatArray(a) {
  var res = [];
  fillArray(res, a);
  return res;

  function fillArray(res, a) {
    if (Array.isArray(a)) {
      for (let i = 0; i < a.length; i++) {
        fillArray(res, a[i]);
      }
    } else {
      res.push(a);
    }
  }
}

function normalize(n, prime) {
  let res = BigInt(n) % prime;
  if (res < 0) res += prime;
  return res;
}

function fnvHash(str) {
  return hash(str, 64).hex();
}
