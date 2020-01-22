/* global test, expect, describe */
import toggleInObject from "./toggleInObject";

describe("Test the toggleInObject helper", () => {
  test("should create an array and add the value to the object when empty", () => {
    const object = {};
    const result = toggleInObject(object)("key", "value");
    const expected = { key: ["value"] };
    expect(result).toEqual(expected);
  });

  test("should create an array and add the value to the object when given key doesn't exist", () => {
    const object = {
      anotherkey: ["something"]
    };
    const result = toggleInObject(object)("key", "value");
    const expected = { anotherkey: ["something"], key: ["value"] };
    expect(result).toEqual(expected);
  });

  test("should add the value to the array on the given key in the object", () => {
    const object = {
      key: ["something"]
    };
    const result = toggleInObject(object)("key", "value");
    const expected = { key: ["something", "value"] };
    expect(result).toEqual(expected);
  });

  test("should remove the value from the array on the given key if it's already present", () => {
    const object = {
      key: ["something", "value"]
    };
    const result = toggleInObject(object)("key", "value");
    const expected = { key: ["something"] };
    expect(result).toEqual(expected);
  });

  test("should empty the array on the given key if the value is the only present", () => {
    const object = {
      key: ["value"]
    };
    const result = toggleInObject(object)("key", "value");
    const expected = { key: [] };
    expect(result).toEqual(expected);
  });

  test("should leave other arrays when removing a value from the given key", () => {
    const object = {
      key: ["value"],
      anotherkey: ["something"]
    };
    const result = toggleInObject(object)("key", "value");
    const expected = { key: [], anotherkey: ["something"] };
    expect(result).toEqual(expected);
  });
});

describe("Test the toggleInObject helper with { asArray: false }", () => {
  test("should allow value to not be an array", () => {
    const object = {};
    const result = toggleInObject(object)("key", "value", { asArray: false });
    const expected = { key: "value" };
    expect(result).toEqual(expected);
  });
  test("should allow value to not be an array, next to other keys that are arrays", () => {
    const object = {
      something: ["nice"]
    };
    const result = toggleInObject(object)("key", "value", { asArray: false });
    const expected = { something: ["nice"], key: "value" };
    expect(result).toEqual(expected);
  });
  test("should allow a single value to be unset", () => {
    const object = {
      key: "value"
    };
    const result = toggleInObject(object)("key", "value", { asArray: false });
    const expected = {};
    expect(result).toEqual(expected);
  });
  test("should allow a single value to be unset, next to other keys that are arrays", () => {
    const object = {
      something: ["nice"],
      key: "value"
    };
    const result = toggleInObject(object)("key", "value", { asArray: false });
    const expected = { something: ["nice"] };
    expect(result).toEqual(expected);
  });
});
