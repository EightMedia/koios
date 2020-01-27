exports.handler = async (event, context) => {
  // get query parameters
  const params = event.queryStringParameters;

  // json input
  const data = require("../data/maak-kennis-items.json");

  // setup response
  const response = { featured: null, items: null, showMore: false };

  // setup options
  var options = Object.assign({ page: 1 }, params);

  // fixed options
  options.amount = 9;

  // see if we have filters
  const hasFilters = options.branch || options.category ? true : false;

  // get featured items
  if (!hasFilters) {
    response.featured = data
      .filter(function(item) {
        return item.featured;
      })
      .slice(0, 2);
  }

  // filter items
  var filteredItems = data.filter(item => {
    var keep = true;
    if (keep === true && item.featured) keep = hasFilters;
    if (keep === true && options.branch) keep = [].concat(item.branches).includes(options.branch);
    if (keep === true && options.category) keep = item.category === options.category;
    if (keep === true && options.noEvents) keep = item.category !== "evenement";
    return keep;
  });

  // slice the amount of items we need
  response.items = filteredItems.slice(0, options.page * options.amount);

  // tell if we have more items to show
  response.showMore = response.items.length > 0 && filteredItems.length > response.items.length;

  if (response.items.length === 0) response.items = null;

  return {
    statusCode: 200,
    body: JSON.stringify(response)
  };
};
