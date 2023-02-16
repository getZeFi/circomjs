export interface CircuitCircomTester {
    calculateWitness(inp: any) : Promise<any>
    checkConstraints(w: any): Promise<void>
}

export type CFG = {
    projectName:string,
    outPutDIR:string,
    build: {
        inputDir: string,
        circuits: Array<BuildCircuitInfo>
    },
    networks:  Networks
}

export type Networks = {
    [key in string]: {
        RPC: string,
        PRIV_KEY: string
    }
}

export type BuildCircuitInfo = {
    name:string,
    cID? : string
}

export type Witness = Array<bigint>

export type SnarkType = "groth16" | "plonk" | "fflonk"

export type ZK_PROOF = {
    proof: {
        pi_a: any,
        pi_b: any,
        pi_c: any,

            protocol: string
        curve: string
    }
    publicSignals: Array<string>
}

export  type Templates  =  {
    groth16: string,
    plonk: string,
    fflonk : string
}