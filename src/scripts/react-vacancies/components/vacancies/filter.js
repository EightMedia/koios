import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import filterPropType from "./filters.proptype";
import Icon from "../icon";

const Filter = ({ filters, zipcode, distance, onChangeFilter, onChangeField, onClearFilters }) => {
  // pushing the zipcode to the query and putting it back into the input value is slow
  // this makes the cursor in the input move to the end
  // if you are typing in the middle of the text, this is very annoying behaviour
  // solution: use an internal state to manage the controlled input and effect it to the query
  const [internalZipcode, setInternalZipcode] = useState(zipcode);
  useEffect(() => {
    onChangeField("zipcode", internalZipcode);
  }, [internalZipcode]);
  useEffect(() => {
    // zipcode has been hard reset?
    // but we have a zipcode value in the input?
    if (!zipcode && internalZipcode) {
      setInternalZipcode("");
    }
  }, [zipcode]);

  const cleanFilters = filters.filter(filter => {
    return filter.items.length > 1;
  });

  return (
    <form method="GET" className="rv__filter-form" onSubmit={e => e.preventDefault()}>
      {cleanFilters.map(({ title, field, items = [], actives = [] }) => (
        <div key={title} className="rv__filter__group">
          <legend className="rv__filter__title">{title}</legend>
          {items.map(({ code, label }) => (
            <label htmlFor={`${field}-${code}`} key={code} className="rv__filter__item">
              <input
                type="checkbox"
                className="rv__filter__item__input"
                checked={actives.includes(code)}
                onChange={() => onChangeFilter(field, code)}
                id={`${field}-${code}`}
                name={field}
                value={code}
                aria-controls="react-vacancies-results"
              />
              <span className="rv__filter__item__check">
                <Icon id="check" />
              </span>
              <span className="rv__filter__item__label">{label}</span>
            </label>
          ))}
        </div>
      ))}
      <div>
        <legend className="rv__filter__title-distance">Afstand</legend>

        <div className="rv__filter__distance-input-wrapper">
          <label htmlFor="rvFilterPostalCode" className="accessibility">
            Postcode
          </label>
          <input
            id="rvFilterPostalCode"
            type="zipcode"
            name="zipcode"
            onChange={e => setInternalZipcode(e.target.value)}
            value={internalZipcode}
            placeholder="Postcode"
            aria-controls="react-vacancies-results"
            autoComplete="postal-code"
          />
          <label htmlFor="rvFilterDistance" className="accessibility">
            Straal
          </label>
          <select
            id="rvFilterDistance"
            name="distance"
            onChange={e => onChangeField("distance", e.target.value)}
            value={distance}
            aria-controls="react-vacancies-results"
          >
            <option value="">Alle afstanden...</option>
            {[10, 25, 50, 100].map(value => (
              <option key={value} value={value}>
                {"<"} {value}km
              </option>
            ))}
          </select>
        </div>
      </div>
      {onClearFilters && (
        <div>
          <button className="rv__filter__clear-button" type="button" onClick={onClearFilters}>
            Alles wissen
          </button>
        </div>
      )}
    </form>
  );
};

Filter.propTypes = {
  filters: filterPropType.isRequired,
  zipcode: PropTypes.string.isRequired,
  distance: PropTypes.string.isRequired,
  onChangeFilter: PropTypes.func.isRequired,
  onChangeField: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func
};

export default Filter;
