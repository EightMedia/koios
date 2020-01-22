import dig from "./dig";

// filter all given data to only match the given filters
const matchDataToFiltersByCode = data => filters =>
  data.filter(vacancy => {
    // loop over all filters, start by saying the match is true,
    // until we find something that doesn't matches
    return Object.entries(filters).reduce((match, [field, values]) => {
      // when we failed a match, keep failing
      if (!match) {
        return false;
      }

      // dig the vacancy for this field
      const searchIn = dig(vacancy)(field);
      // the searchIn could be an array or not, convert to always be an array
      const source = [].concat(searchIn);
      // if this vacancy does not contain a value that matches to required field, we fail
      if (!source.find(({ code }) => values.includes(code))) {
        return false;
      }

      // nothing failed, let's go
      return true;
    }, true);
  });

export default matchDataToFiltersByCode;
