const generateCode = require("../helpers/generateCode");
const assert = require("assert");

describe("generateCode", () => {
  it("should generate code with correct length", () => {
    const length = 8;
    const code = generateCode(length);

    assert.strictEqual(code.length, length);
  });

  it("should generate code with only digits", () => {
    const length = 8;
    const code = generateCode(length);

    assert(/^\d+$/.test(code));
  });

  it("should generate unique codes", () => {
    const length = 8;
    const codes = new Set();

    for (let i = 0; i < 1000; i++) {
      const code = generateCode(length);
      assert.strictEqual(codes.has(code), false);
      codes.add(code);
    }
  });
});
