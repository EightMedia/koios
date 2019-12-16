import React from "react";
import PropTypes from "prop-types";
import filterPropType from "./filters.proptype";

const Badge = ({ label, onClick }) => (
  <button title={label} type="button" onClick={onClick} className="react-vacancies__current-filter-badge">
    {label}
    <svg
      height="15px"
      width="15px"
      aria-hidden="true"
      focusable="false"
      role="img"
      viewBox="0 0 320 512"
      className="react-vacancies__current-filter-badge__close-icon"
    >
      <path
        fill="currentColor"
        d="M207.6 256l107.72-107.72c6.23-6.23 6.23-16.34 0-22.58l-25.03-25.03c-6.23-6.23-16.34-6.23-22.58 0L160 208.4 52.28 100.68c-6.23-6.23-16.34-6.23-22.58 0L4.68 125.7c-6.23 6.23-6.23 16.34 0 22.58L112.4 256 4.68 363.72c-6.23 6.23-6.23 16.34 0 22.58l25.03 25.03c6.23 6.23 16.34 6.23 22.58 0L160 303.6l107.72 107.72c6.23 6.23 16.34 6.23 22.58 0l25.03-25.03c6.23-6.23 6.23-16.34 0-22.58L207.6 256z"
      />
    </svg>
  </button>
);
Badge.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
};

const CurrentFilters = ({
  filters,
  zipcode,
  distance,
  searchString,
  onChangeFilter,
  onChangeField,
  onChangeFields,
  onClearFilters
}) => {
  const currentFilters = filters.reduce((list, { field, actives, items }) => {
    return list.concat(
      // loop over all active filters in this field
      actives
        .filter(code => code !== "") // remove empty items
        .map(code => ({
          // find the complete filter by its code
          ...items.find(item => item.code === code),
          // add the field name, to be used in the change handler
          field
        }))
        // remove inexistent filter items
        .filter(item => item.code && item.label)
    );
  }, []);
  return (
    <div className="react-vacancies__current-filters">
      {searchString && (
        <Badge
          key="searchString"
          label={`Zoekterm: ${searchString}`}
          onClick={() => {
            onChangeField("searchString", "");
          }}
        />
      )}
      {zipcode && distance && (
        <Badge
          key="zipdistance"
          label={`${zipcode} < ${distance}km`}
          onClick={() => {
            onChangeFields([{ field: "zipcode", value: "" }, { field: "distance", value: "" }]);
          }}
        />
      )}
      {currentFilters.map(({ code, label, field }) => (
        <Badge key={code} onClick={() => onChangeFilter(field, code)} label={label} />
      ))}
      {(currentFilters.length > 0 || (zipcode && distance)) && (
        <button className="react-vacancies__clear-current-filters" type="button" onClick={onClearFilters}>
          Alles wissen
        </button>
      )}
    </div>
  );
};

CurrentFilters.propTypes = {
  filters: filterPropType.isRequired,
  zipcode: PropTypes.string.isRequired,
  distance: PropTypes.string.isRequired,
  searchString: PropTypes.string.isRequired,
  onChangeFilter: PropTypes.func.isRequired,
  onChangeFields: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired
};

export default CurrentFilters;
