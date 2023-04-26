import { assert as _assert } from 'chai';
const assert = _assert;

import { promises, writeFile } from 'fs';
import { setGracefulCleanup, dir as _dir } from 'tmp-promise';
import { basename, join } from 'path';
import * as path from 'path';

import { promisify } from 'util';
import { F1Field } from 'ffjavascript';
import childProcess from 'child_process';

const exec = promisify(childProcess.exec);

import { readR1cs } from 'r1csfile';
import { wtns } from 'snarkjs';

const readWtns = wtns.exportJson;

export default c_tester;

BigInt.prototype.toJSON = function () {
  return this.toString();
};

async function c_tester(circomInput, _options) {
  assert(
    await compiler_above_version('2.0.0'),
    'Wrong compiler version. Must be at least 2.0.0',
  );

  const baseName = basename(circomInput, '.circom');
  const options = Object.assign({}, _options);

  options.c = true;

  options.sym = true;
  options.json = options.json || false; // costraints in json format
  options.r1cs = true;
  options.compile =
    typeof options.recompile === 'undefined' ? true : options.recompile; // by default compile

  if (typeof options.output === 'undefined') {
    setGracefulCleanup();
    const dir = await _dir({ prefix: 'circom_', unsafeCleanup: true });
    //console.log(dir.path);
    options.output = dir.path;
  } else {
    try {
      await promises.access(options.output);
    } catch (err) {
      assert(
        options.compile,
        'Cannot set recompile to false if the output path does not exist',
      );
      await promises.mkdir(options.output, { recursive: true });
    }
  }
  if (options.compile) {
    await compile(baseName, circomInput, options);
  } else {
    const jsPath = join(options.output, baseName + '_js');
    try {
      await promises.access(jsPath);
    } catch (err) {
      assert(
        false,
        'Cannot set recompile to false if the ' +
          jsPath +
          ' folder does not exist',
      );
    }
  }
  return new CTester(options.output, baseName);
}

async function compile(baseName, fileName, options) {
  var flags = '--c ';
  if (options.include) {
    if (Array.isArray(options.include)) {
      for (let i = 0; i < options.include.length; i++) {
        flags += '-l ' + options.include[i] + ' ';
      }
    } else {
      flags += '-l ' + options.include + ' ';
    }
  }
  if (options.sym) flags += '--sym ';
  if (options.r1cs) flags += '--r1cs ';
  if (options.json) flags += '--json ';
  if (options.output) flags += '--output ' + options.output + ' ';
  if (options.O === 0) flags += '--O0 ';
  if (options.O === 1) flags += '--O1 ';
  if (options.verbose) flags += '--verbose ';

  try {
    let b = await exec('circom ' + flags + fileName);
    if (options.verbose) {
      console.log(b.stdout);
    }
  } catch (e) {
    assert(false, 'circom compiler error \n' + e);
  }

  const c_folder = join(options.output, baseName + '_cpp/');
  let b = await exec('make -C ' + c_folder);
  assert(
    b.stderr == '',
    'error building the executable C program\n' + b.stderr,
  );
}

class CTester {
  constructor(dir, baseName) {
    this.dir = dir;
    this.baseName = baseName;
  }

  async release() {
    await this.dir.cleanup();
  }

  async calculateWitness(input) {
    const inputjson = JSON.stringify(input);
    const inputFile = join(
      this.dir,
      this.baseName + '_cpp/' + this.baseName + '.json',
    );
    const wtnsFile = join(
      this.dir,
      this.baseName + '_cpp/' + this.baseName + '.wtns',
    );
    const runc = join(this.dir, this.baseName + '_cpp/' + this.baseName);
    writeFile(inputFile, inputjson, function (err) {
      if (err) throw err;
    });
    await exec('cd ' + join(this.dir, this.baseName + '_cpp/'));
    let proc = await exec(runc + ' ' + inputFile + ' ' + wtnsFile);
    if (proc.stdout !== '') {
      console.log(proc.stdout);
    }
    return await readBinWitnessFile(wtnsFile);
  }

  async loadSymbols() {
    if (this.symbols) return;
    this.symbols = {};
    const symsStr = await promises.readFile(
      join(this.dir, this.baseName + '.sym'),
      'utf8',
    );
    const lines = symsStr.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const arr = lines[i].split(',');
      if (arr.length != 4) continue;
      this.symbols[arr[3]] = {
        labelIdx: Number(arr[0]),
        varIdx: Number(arr[1]),
        componentIdx: Number(arr[2]),
      };
    }
  }

  async loadConstraints() {
    if (this.constraints) return;
    const r1cs = await readR1cs(path.join(this.dir, this.baseName + '.r1cs'), {
      loadConstraints: true,
      loadMap: false,
      getFieldFromPrime: (p) => new F1Field(p),
    });
    this.F = r1cs.F;
    this.nVars = r1cs.nVars;
    this.constraints = r1cs.constraints;
  }

  async assertOut(actualOut, expectedOut) {
    if (!this.symbols) await this.loadSymbols();

    checkObject('main', expectedOut);

    function checkObject(prefix, eOut) {
      if (Array.isArray(eOut)) {
        for (let i = 0; i < eOut.length; i++) {
          checkObject(prefix + '[' + i + ']', eOut[i]);
        }
      } else if (typeof eOut == 'object' && eOut.constructor.name == 'Object') {
        for (let k in eOut) {
          checkObject(prefix + '.' + k, eOut[k]);
        }
      } else {
        if (typeof this.symbols[prefix] == 'undefined') {
          assert(false, 'Output variable not defined: ' + prefix);
        }
        const ba = actualOut[this.symbols[prefix].varIdx].toString();
        const be = eOut.toString();
        assert.strictEqual(ba, be, prefix);
      }
    }
  }

  async getDecoratedOutput(witness) {
    const lines = [];
    if (!this.symbols) await this.loadSymbols();
    for (let n in this.symbols) {
      let v;
      if (utils.isDefined(witness[this.symbols[n].varIdx])) {
        v = witness[this.symbols[n].varIdx].toString();
      } else {
        v = 'undefined';
      }
      lines.push(`${n} --> ${v}`);
    }
    return lines.join('\n');
  }

  async checkConstraints(witness) {
    if (!this.constraints) await this.loadConstraints();
    for (let i = 0; i < this.constraints.length; i++) {
      checkConstraint(this.constraints[i]);
    }

    function checkConstraint(constraint) {
      const F = this.F;
      const a = evalLC(constraint[0]);
      const b = evalLC(constraint[1]);
      const c = evalLC(constraint[2]);
      assert(F.isZero(F.sub(F.mul(a, b), c)), "Constraint doesn't match");
    }

    function evalLC(lc) {
      const F = this.F;
      let v = F.zero;
      for (let w in lc) {
        v = F.add(v, F.mul(lc[w], F.e(witness[w])));
      }
      return v;
    }
  }
}

function version_to_list(v) {
  return v.split('.').map(function (x) {
    return parseInt(x, 10);
  });
}

function check_versions(v1, v2) {
  //check if v1 is newer than or equal to v2
  for (let i = 0; i < v2.length; i++) {
    if (v1[i] > v2[i]) return true;
    if (v1[i] < v2[i]) return false;
  }
  return true;
}

async function compiler_above_version(v) {
  let output = (await exec('circom --version')).stdout;
  let compiler_version = version_to_list(output.slice(output.search(/\d/), -1));
  let vlist = version_to_list(v);
  return check_versions(compiler_version, vlist);
}

async function readBinWitnessFile(fileName) {
  const buffWitness = await readWtns(fileName);
  return buffWitness;
}
