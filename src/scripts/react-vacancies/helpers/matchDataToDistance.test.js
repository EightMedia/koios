/* global test, expect, describe */
import { inspect } from "util"; // eslint-disable-line no-unused-vars
import matchDataToDistance from "./matchDataToDistance";
import data from "../../../data/vacancies";

const arnhem = {
  nl_fourpp: 6828,
  city: "Arnhem",
  municipality: "Arnhem",
  province: "Gelderland",
  areacode: "026",
  lat: 51.97271880859165,
  lng: 5.900925012411
};

describe("Test the matchDataToDistance helper", () => {
  const testData = [
    {
      key: "item in Utrecht",
      location: {
        latitude: 52.05739,
        longitude: 5.10573,
        city: "Utrecht"
      }
    },
    {
      key: "item in Dordrecht",
      location: {
        latitude: 51.79867,
        longitude: 4.63633,
        city: "Dordrecht"
      }
    },
    {
      key: "item in Arnhem",
      location: {
        latitude: 51.97651,
        longitude: 5.91536,
        city: "Arnhem"
      }
    }
  ];
  test("should return all items when we don't provide a location", () => {
    const result = matchDataToDistance(testData)();
    const expected = testData;
    expect(result).toEqual(expected);
  });
  test("should return all items when we don't provide a distance", () => {
    const result = matchDataToDistance(testData)(arnhem);
    const expected = testData;
    expect(result).toEqual(expected);
  });
  test("should return no when distance is only 1 meter", () => {
    const result = matchDataToDistance(testData)(arnhem, 1);
    const expected = [];
    expect(result).toEqual(expected);
  });
  test("should return the item in Arnhem when distance is 10.000 meter", () => {
    const result = matchDataToDistance(testData)(arnhem, 10000);
    const expected = [
      {
        key: "item in Arnhem",
        location: {
          latitude: 51.97651,
          longitude: 5.91536,
          city: "Arnhem"
        }
      }
    ];
    expect(result).toEqual(expected);
  });
  test("should return the item in Arnhem and the item in Utrecht when distance is 60.000 meter", () => {
    const result = matchDataToDistance(testData)(arnhem, 60000);
    const expected = [
      {
        key: "item in Utrecht",
        location: {
          latitude: 52.05739,
          longitude: 5.10573,
          city: "Utrecht"
        }
      },
      {
        key: "item in Arnhem",
        location: {
          latitude: 51.97651,
          longitude: 5.91536,
          city: "Arnhem"
        }
      }
    ];
    expect(result).toEqual(expected);
  });
  test("should return the item in Arnhem, the item in Utrecht and the item in Dordrecht when distance is 90.000 meter", () => {
    const result = matchDataToDistance(testData)(arnhem, 90000);
    const expected = [
      {
        key: "item in Utrecht",
        location: {
          latitude: 52.05739,
          longitude: 5.10573,
          city: "Utrecht"
        }
      },
      {
        key: "item in Dordrecht",
        location: {
          latitude: 51.79867,
          longitude: 4.63633,
          city: "Dordrecht"
        }
      },
      {
        key: "item in Arnhem",
        location: {
          latitude: 51.97651,
          longitude: 5.91536,
          city: "Arnhem"
        }
      }
    ];
    expect(result).toEqual(expected);
  });

  test("should return the item in Dordrecht when distance is 1.000 meter when starting near Dordrecht", () => {
    const location = {
      lat: 51.79866,
      lng: 4.63632
    };
    const result = matchDataToDistance(testData)(location, 1000);
    const expected = [
      {
        key: "item in Dordrecht",
        location: {
          latitude: 51.79867,
          longitude: 4.63633,
          city: "Dordrecht"
        }
      }
    ];
    expect(result).toEqual(expected);
  });
});

describe("Test matchDataToDistance with real data", () => {
  test("find vacancies from 1.500 meter to Arnhem", () => {
    const result = matchDataToDistance(data)(arnhem, 1500);
    // console.log("found", inspect(result, { depth: Infinity }));
    const expected = 7;
    expect(result.length).toEqual(expected);
  });
  test("find vacancies from 1.000 meter to very close to Geldrop", () => {
    const location = {
      lat: 51.40514,
      lng: 5.56372
    };
    const result = matchDataToDistance(data)(location, 1000);
    // console.log("found", inspect(result, { depth: Infinity }));
    const expected = 0;
    expect(result.length).toEqual(expected);
  });
});
