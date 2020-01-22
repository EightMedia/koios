import React, { Fragment, useRef } from "react";
import PropTypes from "prop-types";
import Filter from "./filter";
import Results from "./results";
import Mobile from "./mobile";
import CurrentFilters from "./currentFilters";
import filterPropType from "./filters.proptype";

const Page = ({ vacancies, onClearFilters, ...props }) => {
  const { filters } = props;
  const titleEl = useRef(null);
  const filterCount = filters.reduce((sum, filter) => {
    return sum + filter.actives.length;
  }, 0);
  const noResults = vacancies.length === 0;

  return (
    <div className="react-vacancies">
      <Mobile
        titleEl={titleEl}
        vacancyCount={vacancies.length}
        filterCount={filterCount}
        onClearFilters={onClearFilters}
      >
        <Filter {...props} />
      </Mobile>
      <Fragment>
        <div className="react-vacancies__filters">
          <Filter {...props} onClearFilters={onClearFilters} />
        </div>
        <div className="react-vacancies__main" aria-live="polite" id="react-vacancies-results">
          <div className={`react-vacancies__main__head ${noResults ? "react-vacancies__main__head--no-results" : ""}`}>
            <h2 ref={titleEl} className="react-vacancies__main__head__title" role="status">
              {noResults && "Er zijn helaas geen vacatures gevonden"}
              {!noResults && (
                <Fragment>
                  We hebben
                  <span className="react-vacancies__main__head__title__count"> {vacancies.length} </span>
                  {vacancies.length === 1 ? "vacature" : "vacatures"} gevonden
                </Fragment>
              )}
            </h2>
            <CurrentFilters {...props} onClearFilters={onClearFilters} />
            <div className="react-vacancies__head__current-search" />
          </div>
          <Results results={vacancies} />
        </div>
      </Fragment>
    </div>
  );
};

Page.propTypes = {
  filters: filterPropType.isRequired,
  vacancies: PropTypes.arrayOf(PropTypes.object).isRequired,
  onChangeFilter: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired
};

export default Page;
