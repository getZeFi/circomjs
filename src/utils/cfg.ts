
import {CFG} from "../types";


// throws an error if a config file is invalid
// If it doesn't throw error, then safe to assume that `cfg` can be cast to type `CFG`
// ASSIGN: Shivam
// one example is that cIDs for each build info should be unique throw an error if that fails
export const checkConfigIsValid = (cfg: CFG): void => {
}

export const getPathWithoutCircomExtension = (filePath: string): string =>{
    let s = filePath.split(".")
    if(s[s.length-1] !== "circom"){
        throw new Error(`error: not a valid circom filepath -> ${filePath}`)
    }

    s.pop()
    return s.join("")
}

// returns a boolean indication whether the given string is an explicitly declared cID of any circuits provided in `CFG`
export const isCID = (cfg: CFG,s: string): boolean => {
    let flag = false
   cfg.build.circuits.forEach((c)=>{
        if(c.cID === s){
            flag = true
        }
   })
    return flag
}

// find circuit path from cID
export const getPathFromCID = (cfg: CFG,cID: string): string  => {
    let cPath = ""
    cfg.build.circuits.forEach((c)=>{
       if(c.cID === cID) {
           cPath =  c.name
       }
    })

    if(!cPath) {
        throw new Error(`error: no entry found for cID => ${cID}`)
    }
    return cPath
}