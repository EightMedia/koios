import React from "react";
import Icon from "../icon";
import { format, differenceInHours, differenceInDays } from "date-fns";
import { nl } from "date-fns/locale";

const dateFormat = rawDate => {
  const curDate = new Date();
  const theDate = new Date(rawDate);
  const hoursFromNow = differenceInHours(theDate, curDate)

  if (hoursFromNow < 0) {
    // past
    return "Gesloten";
  }

  if (hoursFromNow < 24) {
    // today!
    return <span className="react-card-vacancy__body__list__item__almost-time">Laatste dag</span>;
  }

  if (hoursFromNow < 24 * 5) {
    // diff in days
    const days = differenceInDays(theDate, curDate) + 1;
    return <span className="react-card-vacancy__body__list__item__almost-time">Nog {days} dagen</span>;
  }

  return format(theDate, "d MMMM yyyy", { locale: nl });
};

const Result = ({ results }) => (
  <div className="react-vacancies__main__results">
    {results.map(({ id, url, name, description, location, employmentConditions, educationLevels, publication }) => {
      const href = url || `/vacature/${id}`;

      const regex = /(<([^>]+)>)/gi;
      const excerpt = description.replace(regex, "");

      return (
        <div
          key={id}
          className="react-card-vacancy"
          role="link"
          onClick={() => {
            window.location.href = href;
          }}
        >
          <h3 className="react-card-vacancy__head">
            <a className="react-card-vacancy__head__link" href={href}>
              {name}
            </a>
          </h3>
          <div className="react-card-vacancy__body">
            <div className="react-card-vacancy__body__description" dangerouslySetInnerHTML={{ __html: excerpt }} />
            <ul className="react-card-vacancy__body__list">
              {location && (
                <li className="react-card-vacancy__body__list__item">
                  <span className="react-card-vacancy__body__list__item__icon">
                    <Icon id="marker" />
                  </span>
                  <span className="react-card-vacancy__body__list__item__label">{location.city}</span>
                </li>
              )}
              {employmentConditions && (
                <li className="react-card-vacancy__body__list__item">
                  <span className="react-card-vacancy__body__list__item__icon">
                    <Icon id="clock" />
                  </span>
                  <span className="react-card-vacancy__body__list__item__label">
                    {employmentConditions.hoursMin && <span>{employmentConditions.hoursMin} - </span>}
                    <span>{employmentConditions.hoursMax} </span>
                    <span>uur per week</span>
                  </span>
                </li>
              )}
              {Array.isArray(educationLevels) && educationLevels.length > 0 && (
                <li className="react-card-vacancy__body__list__item">
                  <span className="react-card-vacancy__body__list__item__icon">
                    <Icon id="hat" />
                  </span>
                  <span className="react-card-vacancy__body__list__item__label">
                    {educationLevels.map(({ label }) => label).join(", ")}
                  </span>
                </li>
              )}
              {publication && publication.dateEnd && (
                <li className="react-card-vacancy__body__list__item">
                  <span className="react-card-vacancy__body__list__item__icon">
                    <Icon id="calendar" />
                  </span>
                  <span className="react-card-vacancy__body__list__item__label">{dateFormat(publication.dateEnd)}</span>
                </li>
              )}
            </ul>
            <div className="react-card-vacancy__body__arrow">
              <Icon id="chevron" />
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

export default Result;
