/* global test, expect, describe */
import getLatLngDistance, { toRadians } from "./getLatLngDistance";

const arnhem = {
  nl_fourpp: 6828,
  city: "Arnhem",
  municipality: "Arnhem",
  province: "Gelderland",
  areacode: "026",
  lat: 51.97271880859165,
  lng: 5.900925012411
};

describe("Test the getLatLngDistance helper", () => {
  test("toRadians can calc 1", () => {
    const result = toRadians(1);
    const expected = 0.017453292519943295;
    expect(result).toEqual(expected);
  });
  test("toRadians can calc 134.4356", () => {
    const result = toRadians(134.4356);
    const expected = 2.3463438518940887;
    expect(result).toEqual(expected);
  });

  test("If lat lng 1 and 2 are the same, should return 0", () => {
    const lat1 = arnhem.lat;
    const lon1 = arnhem.lng;
    const lat2 = arnhem.lat;
    const lon2 = arnhem.lng;
    const result = getLatLngDistance(lat1, lon1, lat2, lon2);
    const expected = 0;
    expect(result).toEqual(expected);
  });

  test("The distance between Arnhem and Rijswijk should be 107928.13644208176 meter", () => {
    const lat1 = arnhem.lat;
    const lon1 = arnhem.lng;
    const lat2 = 52.03457;
    const lon2 = 4.32742;
    const result = getLatLngDistance(lat1, lon1, lat2, lon2);
    const expected = 107928.13644208176;
    expect(result).toEqual(expected);
  });
});
