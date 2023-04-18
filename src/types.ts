export interface CircuitCircomTester {
  calculateWitness(inp: any): Promise<any>;
  checkConstraints(w: any): Promise<void>;
}

export type CFG = {
  projectName: string;
  outputDir: string;
  build: {
    inputDir: string;
    circuits: Array<BuildCircuitInfo>;
  };
  networks: Networks;
};

export type BuildCircuitInfo = {
  fileName: string;
  cID: string;
  powerOfTauFp?: string;
  proofType?: SnarkType;
  compilationMode?: CompilationMode;
};

export type CompilationMode = 'wasm' | 'c';

export type Networks = {
  [key in string]: NetworkCFG;
};

export type NetworkCFG = {
  RPC: string;
  PRIV_KEY: string;
};

export type Witness = Array<bigint>;

export type SnarkType = 'groth16' | 'plonk' | 'fflonk';

export type ZK_PROOF = {
  proof: {
    pi_a: any;
    pi_b: any;
    pi_c: any;

    protocol: string;
    curve: string;
  };
  publicSignals: Array<string>;
};

export type Templates = {
  groth16: string;
  plonk: string;
  fflonk: string;
};

export type CircuitConfig = {
  cId: string;
  cktName: string;
  inputFilePath: string;
  outputDir: string;
  powerOfTauFp: string;
  jsPath: string;
  wasmPath: string;
  zKeyPath: string;
  vKeyPath: string;
  compileOptions: CompileOptions;
  r1csPath: string;
};

export type CompileOptions = {
  // ASKME: why is the name of input circuit filepaths named as include?
  snarkType: SnarkType;
  include: Array<string>;
  sym: boolean;
  r1cs: boolean;
  json: boolean;
  prime: number | boolean;
  O: number;
  verbose: boolean;
};

export type CircuitInput = {
  [k: string]: string | number | bigint;
};
