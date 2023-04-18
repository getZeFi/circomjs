const chai = require('chai');
const assert = chai.assert;

const fs = require('fs');
var tmp = require('tmp-promise');
const path = require('path');

const util = require('util');
const { F1Field } = require('ffjavascript');
const exec = util.promisify(require('child_process').exec);

const readR1cs = require('r1csfile').readR1cs;
const ZqField = require('ffjavascript').ZqField;

module.exports = wasm_tester;

// TODO: compiles circom file to wasm and also produces the witness files
async function wasm_tester(circomInput, _options) {
  assert(
    await compiler_above_version('2.0.0'),
    'Wrong compiler version. Must be at least 2.0.0',
  );

  const baseName = path.basename(circomInput, '.circom');
  const options = Object.assign({}, _options);

  options.wasm = true;

  options.sym = true;
  options.json = options.json || false; // costraints in json format
  options.r1cs = true;
  options.compile =
    typeof options.recompile === 'undefined' ? true : options.recompile; // by default compile

  if (typeof options.output === 'undefined') {
    tmp.setGracefulCleanup();
    const dir = await tmp.dir({ prefix: 'circom_', unsafeCleanup: true });
    //console.log(dir.path);
    options.output = dir.path;
  } else {
    try {
      await fs.promises.access(options.output);
    } catch (err) {
      assert(
        options.compile,
        'Cannot set recompile to false if the output path does not exist',
      );
      await fs.promises.mkdir(options.output, { recursive: true });
    }
  }
  if (options.compile) {
    await compile(circomInput, options);
  } else {
    const jsPath = path.join(options.output, baseName + '_js');
    try {
      await fs.promises.access(jsPath);
    } catch (err) {
      assert(
        false,
        'Cannot set recompile to false if the ' +
          jsPath +
          ' folder does not exist',
      );
    }
  }

  const WitnessCalculator = require('./witness_calculator');

  const wasm = await fs.promises.readFile(
    path.join(options.output, baseName + '_js/' + baseName + '.wasm'),
  );
  const wc = await WitnessCalculator(wasm); // TODO: Prepares for witness calculations
  return new WasmTester(options.output, baseName, wc);
}

async function compile(fileName, options) {
  var flags = '--wasm ';
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
  if (options.prime) flags += '--prime ' + options.prime + ' ';
  if (options.O === 0) flags += '--O0 ';
  if (options.O === 1) flags += '--O1 ';
  if (options.verbose) flags += '--verbose ';

  try {
    // TODO: user has to install the circom binary
    let b = await exec('circom ' + flags + fileName);
    if (options.verbose) {
      console.log(b.stdout);
    }
  } catch (e) {
    assert(false, 'circom compiler error \n' + e);
  }
}

class WasmTester {
  constructor(dir, baseName, witnessCalculator) {
    this.dir = dir;
    this.baseName = baseName;
    this.witnessCalculator = witnessCalculator;
  }

  async release() {
    await this.dir.cleanup();
  }

  async calculateWitness(input, sanityCheck) {
    return await this.witnessCalculator.calculateWitness(input, sanityCheck);
  }

  async loadSymbols() {
    if (this.symbols) return;
    this.symbols = {};
    const symsStr = await fs.promises.readFile(
      path.join(this.dir, this.baseName + '.sym'),
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
    const self = this;
    if (this.constraints) return;
    const r1cs = await readR1cs(path.join(this.dir, this.baseName + '.r1cs'), {
      loadConstraints: true,
      loadMap: false,
      getFieldFromPrime: (p, singlethread) => new F1Field(p),
    });
    self.F = r1cs.F;
    self.nVars = r1cs.nVars;
    self.constraints = r1cs.constraints;
  }

  async assertOut(actualOut, expectedOut) {
    const self = this;
    if (!self.symbols) await self.loadSymbols();

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
        if (typeof self.symbols[prefix] == 'undefined') {
          assert(false, 'Output variable not defined: ' + prefix);
        }
        const ba = actualOut[self.symbols[prefix].varIdx].toString();
        const be = eOut.toString();
        assert.strictEqual(ba, be, prefix);
      }
    }
  }

  async getDecoratedOutput(witness) {
    const self = this;
    const lines = [];
    if (!self.symbols) await self.loadSymbols();
    for (let n in self.symbols) {
      let v;
      if (utils.isDefined(witness[self.symbols[n].varIdx])) {
        v = witness[self.symbols[n].varIdx].toString();
      } else {
        v = 'undefined';
      }
      lines.push(`${n} --> ${v}`);
    }
    return lines.join('\n');
  }

  async checkConstraints(witness) {
    const self = this;
    if (!self.constraints) await self.loadConstraints();
    for (let i = 0; i < self.constraints.length; i++) {
      checkConstraint(self.constraints[i]);
    }

    function checkConstraint(constraint) {
      const F = self.F;
      const a = evalLC(constraint[0]);
      const b = evalLC(constraint[1]);
      const c = evalLC(constraint[2]);
      assert(F.isZero(F.sub(F.mul(a, b), c)), "Constraint doesn't match");
    }

    function evalLC(lc) {
      const F = self.F;
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
