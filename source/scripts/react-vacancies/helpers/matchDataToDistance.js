import getLatLngDistance from "./getLatLngDistance";

// filter all given data to only match in the given distance from the given location
const matchDataToDistance = data => (location, shouldBeWithinDistance) => {
  // without these values, we are always matching, so return all
  if (!location || !location.lat || !location.lng || !shouldBeWithinDistance) {
    return data;
  }

  return data.filter(vacancy => {
    if (!vacancy.location.latitude) {
      console.warn(
        `Oops. matchDataToDistance is missing latitude in ${vacancy.name} (${vacancy.code}): `,
        vacancy.location
      );
    }
    if (!vacancy.location.longitude) {
      console.warn(
        `Oops. matchDataToDistance is missing longitude in ${vacancy.name} (${vacancy.code}): `,
        vacancy.location
      );
    }

    // measure the distance between the given location and this vacancy
    const distanceToGivenLocation = getLatLngDistance(
      location.lat,
      location.lng,
      vacancy.location.latitude,
      vacancy.location.longitude
    );

    // console.log(
    //   "location",
    //   location,
    //   "distanceToGivenLocation",
    //   distanceToGivenLocation,
    //   "vacancy.location",
    //   vacancy.location,
    //   "shouldBeWithinDistance",
    //   shouldBeWithinDistance
    // );

    // if the given location is further from what we want, fail
    if (distanceToGivenLocation > shouldBeWithinDistance) {
      return false;
    }

    // nothing failed, let's go
    return true;
  });
};

export default matchDataToDistance;
