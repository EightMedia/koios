import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

const Mobile = ({ vacancyCount, filterCount, onClearFilters, children, titleEl }) => {
  const [isFilterOpen, setIsFilterOpen] = useState(null);

  useEffect(() => {
    if (isFilterOpen) {
      document.body.classList.add("noscroll");
    } else if (isFilterOpen === false) {
      // only when it's actually false, because it will run initially as well
      document.body.classList.remove("noscroll");
      titleEl.current.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
    }
    return () => document.body.classList.remove("noscroll");
  }, [isFilterOpen]);

  return (
    <div
      className={`react-vacancies__mobile ${
        isFilterOpen ? "react-vacancies__mobile--open" : "react-vacancies__mobile--closed"
      }`}
    >
      {isFilterOpen && (
        <div className="react-vacancies__mobile__header">
          <div className="react-vacancies__mobile__header-inner">
            <div className="react-vacancies__mobile__header__clear">
              <button type="button" onClick={onClearFilters}>
                Alles wissen
              </button>
            </div>
            <div className="react-vacancies__mobile__header__title">
              Filters
              <span className="badge">{filterCount}</span>
            </div>
            <div className="react-vacancies__mobile__header__close">
              <button
                className="react-vacancies__mobile__header__close__btn"
                type="button"
                onClick={() => setIsFilterOpen(null)}
              >
                <svg
                  height="20px"
                  width="20px"
                  aria-hidden="true"
                  focusable="false"
                  role="img"
                  viewBox="0 0 320 512"
                  className="react-vacancies__mobile__header__close__btn-icon"
                >
                  <path
                    fill="currentColor"
                    d="M207.6 256l107.72-107.72c6.23-6.23 6.23-16.34 0-22.58l-25.03-25.03c-6.23-6.23-16.34-6.23-22.58 0L160 208.4 52.28 100.68c-6.23-6.23-16.34-6.23-22.58 0L4.68 125.7c-6.23 6.23-6.23 16.34 0 22.58L112.4 256 4.68 363.72c-6.23 6.23-6.23 16.34 0 22.58l25.03 25.03c6.23 6.23 16.34 6.23 22.58 0L160 303.6l107.72 107.72c6.23 6.23 16.34 6.23 22.58 0l25.03-25.03c6.23-6.23 6.23-16.34 0-22.58L207.6 256z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      {isFilterOpen && <div className="react-vacancies__mobile__body">{children}</div>}
      <div className="react-vacancies__mobile__footer">
        <div className="react-vacancies__mobile__footer-inner">
          <button
            className="react-vacancies__mobile__footer__button button"
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            {isFilterOpen && (
              <span className="react-vacancies__mobile__footer__button__label">
                Bekijk vacatures <span className="button__number">{vacancyCount}</span>
              </span>
            )}
            {!isFilterOpen && (
              <span>
                Filters <span className="button__number">{filterCount}</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

Mobile.propTypes = {
  vacancyCount: PropTypes.number.isRequired,
  filterCount: PropTypes.number.isRequired,
  onClearFilters: PropTypes.func.isRequired,
  children: PropTypes.element
};

export default Mobile;
