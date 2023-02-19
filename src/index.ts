import CircomJS from "./circomJs"
import {ZK_PROOF} from "./types";
import log = require('log');

require("log-node")();


const main = async () => {
    const c = new CircomJS()

    const circuit = await c.getCircuit("mul")
    await circuit.compile()
    await circuit.genZKey()
    const p = await circuit.genProof({x:3, y:2}) as ZK_PROOF
    log.info("proof, circuit:%s\n", circuit._circuitConfig.cktName, p)

    await  circuit.genVKey()
    const verificationRes = await circuit.verifyProof(p)
    console.log(verificationRes)

    const w = await circuit.calculateWitness({x: 3, y: 2})
    console.log(w)


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