export class CompileOptions {
    constructor(
                public readonly output :string,
                public readonly include: Array<string> = [],
                public readonly sym:boolean= true,
                public readonly r1cs: boolean = true,
                public readonly json: boolean = false,
                // false means to go with the circom default
                public readonly prime: number | boolean = false,
                public readonly O: number = 0,
                public readonly verbose = false
                ) {
    }

}