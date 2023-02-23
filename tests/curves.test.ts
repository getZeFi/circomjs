import { getCurveFromName } from "../src/utils/curves";

describe("Curves test" ,() =>{
    it("should return curve from name", async () => {
        const curve = await getCurveFromName("bn128");
        
        expect(typeof curve).toBe("object");
    })
});