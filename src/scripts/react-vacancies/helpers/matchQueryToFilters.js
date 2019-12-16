/*
 check if a requested filter item actually exists in the data */

const matchQueryToFilters = query => filters => {
  const cleanQuery = {};
  filters.forEach(filter => {
    if (query[filter.field]) {
      const codes = filter.items.map(item => item.code);
      const filteredItems = query[filter.field].filter(value => codes.includes(value));
      if (filteredItems.length > 0) {
        cleanQuery[filter.field] = filteredItems;
      }
    }
  });
  return cleanQuery;
};

export default matchQueryToFilters;
