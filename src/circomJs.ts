import {ConfigParser} from './configParser'
import {Circuit} from "./circuit";

export default class CircomJS {
    _configParser: ConfigParser;
    _cIdToCircuit: Map<string, Circuit>;

    constructor() {
        this._configParser = new ConfigParser("./circuit.config.json");
        this._cIdToCircuit = new Map<string, Circuit>();

        this._configParser.listCircuitIds().map(cId => {
            this._cIdToCircuit.set(cId, new Circuit(
                this._configParser.getCircuitConfigFromId(cId),
                this._configParser.getNetworks()
            ))
        })
    }

    getCircuit(cID: string): Circuit {
        const ckt = this._cIdToCircuit.get(cID)
        if (!ckt) {
            throw new Error(`error: no circuit found for circuit ID => ${cID}`)
        }
        return ckt
    }
}