/* global test, expect, describe */
import { inspect } from "util"; // eslint-disable-line no-unused-vars
import uniqueValuesByCode from "./uniqueValuesByCode";
import data from "../../../data/vacancies";

describe("Test the uniqueValuesByCode helper", () => {
  test("returns a function", () => {
    const result = typeof uniqueValuesByCode({});
    const expected = "function";
    expect(result).toBe(expected);
  });

  test("should return an array of items", () => {
    const result = Array.isArray(uniqueValuesByCode(data)("branches"));
    const expected = true;
    expect(result).toEqual(expected);
  });

  test("should not return values with duplicate codes", () => {
    // const result = uniqueValuesByCode(data)("branches");
    const key = "branches";
    const thisData = [
      { [key]: { code: "one" } },
      { [key]: { code: "one" } },
      { [key]: { code: "one" } },
      { [key]: { code: "two" } },
      { [key]: { code: "two" } },
      { [key]: { code: "three" } }
    ];
    const result = uniqueValuesByCode(thisData)(key);
    // make a list of all the codes and the ammount of times it is present
    const count = result.reduce(
      (list, { code }) => ({
        ...list,
        [code]: (list[code] || 0) + 1
      }),
      {}
    );
    // find a code that is present more than once
    const find = Object.values(count).find(number => number > 1);
    // there should be nothing found
    const expected = undefined;
    expect(find).toEqual(expected);
  });

  test("should allow objects with a code", () => {
    const thisData = [
      { branches: { code: "one" } },
      { branches: { code: "one" } },
      { branches: { code: "two" } },
      { branches: { code: "three" } }
    ];
    const result = uniqueValuesByCode(thisData)("branches");
    const expected = [{ code: "one" }, { code: "two" }, { code: "three" }];
    expect(result).toEqual(expected);
  });

  test("should allow arrays of objects with a code", () => {
    const thisData = [
      { branches: [{ code: "one" }, { code: "anotherOne" }] },
      { branches: [{ code: "one" }] },
      { branches: [{ code: "two" }] },
      { branches: [{ code: "three" }] }
    ];
    const result = uniqueValuesByCode(thisData)("branches");
    const expected = [{ code: "one" }, { code: "anotherOne" }, { code: "two" }, { code: "three" }];
    expect(result).toEqual(expected);
  });
});

describe("Test uniqueValuesByCode with real data", () => {
  test("finds all branches", () => {
    const result = uniqueValuesByCode(data)("branches");
    // console.log("found", inspect(result, { depth: Infinity }));
    const expected = 18;
    expect(result.length).toEqual(expected);
  });

  test("finds all employmentConditions.contractType", () => {
    const result = uniqueValuesByCode(data)("employmentConditions.contractType");
    // console.log("found", inspect(result, { depth: Infinity }));
    const expected = 3;
    expect(result.length).toEqual(expected);
  });
});
