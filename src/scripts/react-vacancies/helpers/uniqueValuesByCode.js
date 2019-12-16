import dig from "./dig";

const uniqueValuesByCode = data => thing => {
  // find all the "things" in the original data set
  const findTheThings = data.reduce((list, item) => {
    // concat a single value, or an array, into the result
    return list.concat(dig(item)(thing));
  }, []);

  // find the unique code's in this list
  const uniqueValues = findTheThings.reduce((list, next) => {
    // code is already present, don't add it to the list
    if (list.find(current => current.code === next.code)) {
      return list;
    }
    // add the object containing a unique code to the result
    return list.concat(next);
  }, []);

  return uniqueValues;
};

export default uniqueValuesByCode;
