import CircomJS from "../src/circomJs";

describe("CircomJS test", () => {
  it("should instantiate CircomJS", () => {
    const c = new CircomJS();
    expect(typeof c.getCircuit).toBe('function');
  });

  it("get circuit from cID", () => {
    const c = new CircomJS();
    const circuit = c.getCircuit("mul");
    expect(circuit.hasOwnProperty("_circuitConfig") && circuit.hasOwnProperty("_networks")).toBe(true);
  });
});
