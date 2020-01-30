/* global test, expect, describe */
import dig from "./dig";
import data from "../../../data/vacancies";

describe("Test the dig helper", () => {
  test("should return the value of a given key", () => {
    const thisData = {
      branches: { test: true }
    };
    const result = dig(thisData)("branches");
    const expected = { test: true };
    expect(result).toEqual(expected);
  });

  test("should return whatever value of a given key", () => {
    const thisData = {
      branches: [{ test: true }, { test: false }]
    };
    const result = dig(thisData)("branches");
    const expected = [{ test: true }, { test: false }];
    expect(result).toEqual(expected);
  });

  test("should return the value of a given drilldown string", () => {
    const thisData = {
      employmentConditions: {
        contractType: { test: true }
      }
    };
    const result = dig(thisData)("employmentConditions.contractType");
    const expected = { test: true };
    expect(result).toEqual(expected);
  });
});

describe("Test dig with real data", () => {
  test("finds all branches", () => {
    const firstItemInData = data[0];
    const result = dig(firstItemInData)("branches");
    const expected = 2;
    expect(result.length).toEqual(expected);
  });

  test("finds all employmentConditions.contractType", () => {
    const firstItemInData = data[0];
    const result = dig(firstItemInData)("employmentConditions.contractType");
    const expected = { code: "CSD.02", label: "Vaste aanstelling (eventueel met een proeftijd)" };
    expect(result).toEqual(expected);
  });
});
