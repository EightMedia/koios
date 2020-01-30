/* global test, expect, describe */
import pick from "./pick";

describe("Test the pick helper", () => {
  test("should return an object", () => {
    const object = {
      one: true,
      two: true,
      three: true
    };
    const result = pick(object)([]);
    const expected = {};
    expect(result).toEqual(expected);
  });
  test("should return the original object with only the allowed keys", () => {
    const object = {
      one: true,
      two: true,
      three: {
        something: "nice"
      }
    };
    const result = pick(object)(["one", "three"]);
    const expected = {
      one: true,
      three: {
        something: "nice"
      }
    };
    expect(result).toEqual(expected);
  });
  test("should find from the object itself, not caring about how many keys are allowed", () => {
    const object = {
      one: true,
      two: true,
      three: true
    };
    const result = pick(object)(["key", "one", "fake", "two", "test"]);
    const expected = {
      one: true,
      two: true
    };
    expect(result).toEqual(expected);
  });
});
