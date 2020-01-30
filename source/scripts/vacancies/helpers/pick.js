// 25-5-2019: extended functionality to filter empty items

const pick = (object = {}) => (keys = []) =>
  Object.entries(object).reduce((list, [key, value]) => {
    if (keys.find(k => k === key)) {
      const valueWithoutEmptyStrings = value.filter(x => x || x !== "");

      return !valueWithoutEmptyStrings.length
        ? list
        : {
            ...list,
            [key]: valueWithoutEmptyStrings
          };
    }
    return list;
  }, {});

export default pick;
