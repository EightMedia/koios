/* global test, expect, describe */
import { inspect } from "util"; // eslint-disable-line no-unused-vars
import matchDataToFiltersByCode from "./matchDataToFiltersByCode";
import data from "../../../data/vacancies";

describe("Test the matchDataToFiltersByCode helper", () => {
  test("should return everything when filters is empty", () => {
    const thisData = [
      {
        key: "item1",
        someFilter: { code: "findme" }
      },
      {
        key: "item2",
        somethingElse: { code: "dontfindme" }
      }
    ];
    const filters = {};
    const result = matchDataToFiltersByCode(thisData)(filters);
    const expected = [
      {
        key: "item1",
        someFilter: { code: "findme" }
      },
      {
        key: "item2",
        somethingElse: { code: "dontfindme" }
      }
    ];
    expect(result).toEqual(expected);
  });

  test("should return items that match the filter", () => {
    const thisData = [
      {
        key: "item1",
        someFilter: { code: "findme" }
      },
      {
        key: "item2",
        someFilter: { code: "findme" }
      }
    ];
    const filters = {
      someFilter: ["findme"]
    };
    const result = matchDataToFiltersByCode(thisData)(filters);
    const expected = [
      {
        key: "item1",
        someFilter: { code: "findme" }
      },
      {
        key: "item2",
        someFilter: { code: "findme" }
      }
    ];
    expect(result).toEqual(expected);
  });

  test("should not return items that don't match the filter", () => {
    const thisData = [
      {
        key: "item1",
        someFilter: { code: "findme" }
      },
      {
        key: "item2",
        someFilter: { code: "dontfindme" }
      }
    ];
    const filters = {
      someFilter: ["findme"]
    };
    const result = matchDataToFiltersByCode(thisData)(filters);
    const expected = [
      {
        key: "item1",
        someFilter: { code: "findme" }
      }
    ];
    expect(result).toEqual(expected);
  });

  test("should return items that match the filter if it contains multiple values", () => {
    const thisData = [
      {
        key: "item1",
        someFilter: { code: "findme" }
      },
      {
        key: "item2",
        someFilter: { code: "dontfindme" }
      },
      {
        key: "item3",
        someFilter: { code: "findmetoo" }
      }
    ];
    const filters = {
      someFilter: ["findme", "findmetoo"]
    };
    const result = matchDataToFiltersByCode(thisData)(filters);
    const expected = [
      {
        key: "item1",
        someFilter: { code: "findme" }
      },
      {
        key: "item3",
        someFilter: { code: "findmetoo" }
      }
    ];
    expect(result).toEqual(expected);
  });

  test("should return items that match the filter on multiple keys", () => {
    const thisData = [
      {
        key: "item1",
        someFilter: { code: "findme" },
        anotherFilter: { code: "findme" }
      },
      {
        key: "item2",
        someFilter: { code: "dontfindme" },
        anotherFilter: { code: "findme" }
      },
      {
        key: "item3",
        someFilter: { code: "findmetoo" },
        anotherFilter: { code: "dontfindme" }
      },
      {
        key: "item4",
        someFilter: { code: "findmetoo" },
        anotherFilter: { code: "findme" }
      },
      {
        key: "item5",
        someFilter: { code: "findmetoo" },
        anotherFilter: { code: "findmetoo" }
      }
    ];
    const filters = {
      someFilter: ["findme", "findmetoo"],
      anotherFilter: ["findme", "findmetoo"]
    };
    const result = matchDataToFiltersByCode(thisData)(filters);
    const expected = [
      {
        key: "item1",
        someFilter: { code: "findme" },
        anotherFilter: { code: "findme" }
      },
      {
        key: "item4",
        someFilter: { code: "findmetoo" },
        anotherFilter: { code: "findme" }
      },
      {
        key: "item5",
        someFilter: { code: "findmetoo" },
        anotherFilter: { code: "findmetoo" }
      }
    ];
    expect(result).toEqual(expected);
  });
});

describe("Test matchDataToFiltersByCode with real data", () => {
  test("filter on branch CVG.06", () => {
    const filter = {
      branches: ["CVG.06"]
    };
    const result = matchDataToFiltersByCode(data)(filter);
    // console.log("found", inspect(result, { depth: Infinity }));
    const expected = 5;
    expect(result.length).toEqual(expected);
  });

  test("filter on branch CVG.06 and CVG.14", () => {
    const filter = {
      branches: ["CVG.06", "CVG.14"]
    };
    const result = matchDataToFiltersByCode(data)(filter);
    // console.log("found", inspect(result, { depth: Infinity }));
    const expected = 8;
    expect(result.length).toEqual(expected);
  });

  test("filter on branch CVG.06 and employmentConditions.contractType CSD.02", () => {
    const filter = {
      branches: ["CVG.06"],
      "employmentConditions.contractType": ["CSD.02"]
    };
    const result = matchDataToFiltersByCode(data)(filter);
    // console.log("found", inspect(result, { depth: Infinity }));
    const expected = 5;
    expect(result.length).toEqual(expected);
  });

  test("filter on branch CVG.06 and employmentConditions.contractType CSD.04 + CSD.10", () => {
    const filter = {
      branches: ["CVG.06"],
      "employmentConditions.contractType": ["CSD.04", "CSD.10"]
    };
    const result = matchDataToFiltersByCode(data)(filter);
    // console.log("found", inspect(result, { depth: Infinity }));
    const expected = 0;
    expect(result.length).toEqual(expected);
  });
});
