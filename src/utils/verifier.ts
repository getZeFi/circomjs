const fs  = require("fs");
const path = require("path");
const {zKey}  = require("snarkjs")

import {Templates} from "../types";

const getTemplates = async (): Promise<Templates> => {
    const templates: Templates = {
        groth16:"",
        plonk:"",
        fflonk:""
    }
    templates.groth16 = await fs.promises.readFile(path.join(__dirname, "templates", "verifier_groth16.sol.ejs"), "utf8");
    templates.plonk = await fs.promises.readFile(path.join(__dirname, "templates", "verifier_plonk.sol.ejs"), "utf8");
    templates.fflonk = await fs.promises.readFile(path.join(__dirname, "templates", "verifier_fflonk.sol.ejs"), "utf8");

    return templates
}

export const getSolidityVerifier = async (zKeyPath:string): Promise<string> => {
    const templates = await getTemplates()
    const verifierCode = await zKey.exportSolidityVerifier(zKeyPath, templates)
    return verifierCode
}

