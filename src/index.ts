import CircomJS from "./circomJs"
import {ZK_PROOF} from "./types";
import log = require('log');

require("log-node")();

async function runPipeline(c: CircomJS, cId: string, inp: any) {
    const circuit = await c.getCircuit(cId)
    await circuit.compile()
    await circuit.genZKey()
    const w = await circuit.calculateWitness(inp)
    console.log(w)
    const p = await circuit.genProof(inp) as ZK_PROOF
    log.info("proof, circuit:%s\n", circuit._circuitConfig.cktName, p)
    await circuit.genVKey()
    const verificationRes = await circuit.verifyProof(p)
    console.log(verificationRes)

}

const main = async () => {
    const c = new CircomJS()
    // await runPipeline(c, "mul", {x: 3, y: 2})                       // Groth16
    await runPipeline(c, "circ1000constraints", {"a": 3, "b": 11})  // Plonk


    // const address = await circuit._deploySmartContractVerifier("")
    // console.log(address)
    // try {
    //     await circuit.checkConstraints(w)
    //     console.log("constraint checking success")
    // } catch (err) {
    //     console.log("constraint checking unsuccessful")
    // }
    process.exit(0)
}
main()