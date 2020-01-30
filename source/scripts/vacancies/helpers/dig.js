// dig deep into a object, by the given dotted string
// allowing a drilldown in an object

// examples:
// if the thing is "branches"
// it will dig for item.branches
// if the thing is "employmentConditions.contractType"
// it will dig for item.employmentConditions.contractType

const dig = item => thing => {
  // split the thing by the dot
  const keys = thing.split(".");
  // for each key, return the drilldown value
  return keys.reduce((drilldown, key) => drilldown[key], item);
};

export default dig;
