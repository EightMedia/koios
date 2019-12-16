import React from "react";
import { Router } from "@reach/router";
import qs from "query-string";
import uniqueValuesByCode from "../helpers/uniqueValuesByCode";
import matchQueryToFilters from "../helpers/matchQueryToFilters";
import matchDataToSearch from "../helpers/matchDataToSearch";
import matchDataToFiltersByCode from "../helpers/matchDataToFiltersByCode";
import matchDataToDistance from "../helpers/matchDataToDistance";
import toggleInObject from "../helpers/toggleInObject";
import pick from "../helpers/pick";
import useZipcodeAPI from "../state/useZipcodeAPI";
import Page from "../components/vacancies/page";

// supported in query:
// `searchString`, will be used to search the data using fuse
// `zipcode` and `distance` will be used to measure the distance to the vacancy
// also these filters their fields:

const filterUsed = [
  {
    title: "Soort",
    field: "jobType"
  },
  // {
  //   title: "Soort",
  //   field: "employmentConditions.contractType"
  // },
  { title: "Vakgebied", field: "branches" },
  {
    title: "Opleidingsniveau",
    field: "educationLevels"
  }
];

const Vacancies = ({ data, location, navigate }) => {
  const query = qs.parse(location.search, { arrayFormat: "bracket" });
  const getUniqueValuesInData = uniqueValuesByCode(data);

  // these filters will be used in the UI:
  const filters = filterUsed.reduce((list, next) => {
    // add some dynamic data to the filters
    return list.concat({
      ...next,
      items: getUniqueValuesInData(next.field), // get all unique values for this field
      actives: query[next.field] || [] // get all active items for this field from the query
    });
  }, []);

  // remove all query strings from the url
  const onClearFilters = () => {
    navigate(location.pathname);
  };

  // navigate to the new query on the same pathname to make React rerender
  const navigateToNewQuery = (newQuery = {}) =>
    navigate(`${location.pathname}?${qs.stringify(newQuery, { arrayFormat: "bracket" })}`);

  // handle changing a filter checkbox:
  const onChangeFilter = (field = "", value = "", toggleOptions = {}) => {
    // create a new query by toggeling this value
    const newQuery = toggleInObject(query)(field, value, toggleOptions);
    // now navigate to this new query
    return navigateToNewQuery(newQuery);
  };

  // helper for onChangeFields and onChangeField, written in reduce style
  const changeField = (dict, { field, value }) => {
    // if empty, cut it out of the dict
    if (!value) {
      const { [field]: omit, ...rest } = dict;
      return rest;
    }
    // create a new dict by adding this value
    return {
      ...dict,
      [field]: value
    };
  };

  // handle multi changing things like emptying zipcode and distance at once:
  const onChangeFields = (array = [{ field: "", value: "" }]) => {
    // create a new query by changing these values
    const newQuery = array.reduce(changeField, query);
    // now navigate to this new query
    return navigateToNewQuery(newQuery);
  };

  // handle changing things like zipcode and distance:
  const onChangeField = (field = "", value = "") => {
    // create a new query by adding this value
    const newQuery = changeField(query, { field, value });
    // now navigate to this new query
    return navigateToNewQuery(newQuery);
  };

  // pluck the searchString from the url and give it to fuse search
  const { searchString = "" } = query;
  const vacanciesBySearch = matchDataToSearch(data)(searchString);

  // give window access to search
  window.RWS.searchVacancies = string => {
    const newQuery = query;
    newQuery.searchString = string;
    return navigateToNewQuery(newQuery);
  };

  // pick only the used filters from the query
  const filtersInQuery = matchQueryToFilters(pick(query)(filterUsed.map(({ field }) => field)))(filters);

  // match the data to these active filters
  const vacanciesByFilter = matchDataToFiltersByCode(vacanciesBySearch)(filtersInQuery);

  // and finally match by distance
  const { zipcode = "", distance = "" } = query;
  const { location: usersLocation } = useZipcodeAPI(zipcode, distance);
  const vacancies = matchDataToDistance(vacanciesByFilter)(usersLocation, distance * 1000);

  return (
    <Page
      filters={filters}
      zipcode={zipcode}
      distance={distance}
      searchString={searchString}
      onChangeFilter={onChangeFilter}
      onClearFilters={onClearFilters}
      onChangeField={onChangeField}
      onChangeFields={onChangeFields}
      vacancies={vacancies}
    />
  );
};

const Root = ({ data }) => {
  return (
    <Router>
      <Vacancies default data={data} />
    </Router>
  );
};

export default Root;
