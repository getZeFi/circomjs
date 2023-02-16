import CircomJS from "./circomWrapper"
import {ZK_PROOF} from "./types";

const main = async () => {

    const c = new CircomJS()
    const circuit = await c.getCircuit("mul")
    await circuit.genZKey()

    const p = await circuit.genProof({x:3, y:2}) as ZK_PROOF
    console.log("proof ------>", p)

    // const address = await circuit._deploySmartContractVerifier("")
    // console.log(address)

    //
    await  circuit.genVKey()
    const verificationRes = await circuit.verifyProof(p)
    console.log(verificationRes)







    // const w = await circuit.calculateWitness({x: 3, y: 2})
    // console.log(w)
    // try {
    //     await circuit.checkConstraints(w)
    //     console.log("constraint checking success")
    // } catch (err) {
    //     console.log("constraint checking unsuccessful")
    // }


    process.exit(0)
}

main()