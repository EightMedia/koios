/* global test, expect, describe */
import Fuse from "fuse.js";
import { inspect } from "util"; // eslint-disable-line no-unused-vars
import matchDataToSearch from "./matchDataToSearch";
import data from "../../../data/vacancies";

test("search works with the example", () => {
  const books = [
    {
      ISBN: "A",
      title: "Old Man's War",
      author: "John Scalzi"
    },
    {
      ISBN: "B",
      title: "The Lock Artist",
      author: "Steve Hamilton"
    }
  ];
  const options = {
    keys: ["title", "author"]
  };
  const result = new Fuse(books, options).search("old");
  const expected = [{ ISBN: "A", author: "John Scalzi", title: "Old Man's War" }];
  expect(result).toEqual(expected);
});

describe("search the actual data with Fuse", () => {
  test("find by name", () => {
    const options = {
      keys: ["name"],
      id: "id" // return only the id's
    };
    const fuse = new Fuse(data, options);
    const result = fuse.search("Projectassistent");
    const expected = 5;
    expect(result.length).toEqual(expected);
  });

  test("find by description", () => {
    const options = {
      keys: ["description"],
      id: "id" // return only the id's
    };
    const fuse = new Fuse(data, options);
    const result = fuse.search("water rivier");
    const expected = 3;
    expect(result.length).toEqual(expected);
  });

  test("find by branch", () => {
    const options = {
      keys: ["branches.label"],
      id: "id" // return only the id's
    };
    const fuse = new Fuse(data, options);
    const result = fuse.search("Stedebouwkundig");
    const expected = 4;
    expect(result.length).toEqual(expected);
  });

  test("find by name, description and branch", () => {
    const options = {
      keys: ["name", "description", "branches.label"],
      id: "id" // return only the id's
    };
    const fuse = new Fuse(data, options);
    // infraprojecten is actually only named once, but fuse will return this like Infrastructuur as well
    const result = fuse.search("infraprojecten");
    const expected = 5;
    expect(result.length).toEqual(expected);
  });

  test("find by name, description and branch; strangely weighted", () => {
    const options = {
      keys: [
        {
          name: "name",
          weight: 0.1 // lets say this is not important
        },
        {
          name: "description",
          weight: 0.5
        },
        {
          name: "branches.label",
          weight: 0.8 // lets say this is important
        }
      ],
      shouldSort: true,
      // includeScore: true,
      id: "id" // return only the id's
    };
    const fuse = new Fuse(data, options);
    // infraprojecten is actually only named once,
    // but fuse will return this like Infrastructuur as well
    const result = fuse.search("infraprojecten");
    const expected = 5;
    expect(result.length).toEqual(expected);
  });

  test("find by name, description and branch with a threshold of 0.4", () => {
    const options = {
      keys: [
        {
          name: "name",
          weight: 0.7
        },
        {
          name: "description",
          weight: 0.3
        },
        {
          name: "branches.label",
          weight: 0.5
        }
      ],
      threshold: 0.4,
      shouldSort: true,
      // includeScore: true,
      id: "id" // return only the id's
    };
    const fuse = new Fuse(data, options);
    // infraprojecten is actually only named once,
    // but fuse will return this like Infrastructuur as well
    // the treshold should be strict and only allow good matches
    const result = fuse.search("Gegevensinwinner");
    const expected = 3;
    expect(result.length).toEqual(expected);
  });
});

describe("search the data with matchDataToSearch", () => {
  test("returns a function", () => {
    const result = typeof matchDataToSearch({});
    const expected = "function";
    expect(result).toBe(expected);
  });

  test("returns everything when no searchString is added", () => {
    const result = matchDataToSearch(data)();
    // console.log("found", inspect(result, { depth: Infinity }));
    const expected = 91;
    expect(result.length).toEqual(expected);
  });
  test("returns everything when searchString empty", () => {
    const result = matchDataToSearch(data)("");
    // console.log("found", inspect(result, { depth: Infinity }));
    const expected = 91;
    expect(result.length).toEqual(expected);
  });

  test("returns 8 vacancies matching 'ICT'", () => {
    const result = matchDataToSearch(data)("ICT");
    // console.log("found", inspect(result, { depth: Infinity }));
    const expected = 17;
    expect(result.length).toEqual(expected);
  });
});
