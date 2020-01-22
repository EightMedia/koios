// toggle a value in the given object.
// the value is added to the array on the given key
// when  { asArray: false } isset, the value will be added directly on the key
const toggleInObject = object => (key, value, { asArray = true } = {}) => {
  // force the value not to be an array
  if (!asArray) {
    if (object[key]) {
      // if the key is present, cut it from the object
      const { [key]: omitMe, ...rest } = object;
      return rest;
    }
    // else add it to the object
    return {
      ...object,
      [key]: value
    };
  }

  // the value is always stored in an array, is the value in this array?
  if (Array.isArray(object[key]) && object[key].includes(value)) {
    // if it's present, remove it from the object
    return {
      ...object,
      [key]: object[key].filter(val => val !== value)
    };
  }
  // else add it to the query (create a new array for the key if needed)
  return {
    ...object,
    [key]: (object[key] || []).concat(value)
  };
};

export default toggleInObject;
