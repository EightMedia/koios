/* eslint-disable dot-notation */
import React from "react";

// mimic the _icon.pug functionality

const VIEWBOX = [0, 0, 24, 24];

const Icon = ({ id, className }) => {
  return (
    <svg
      className={`icon icon-${id} ${className || ""}`}
      aria-hidden="true"
      viewBox={VIEWBOX.join(" ")}
      width={VIEWBOX[2]}
      height={VIEWBOX[3]}
    >
      <use xlinkHref={`#${id}`} />
    </svg>
  );
};

export default Icon;
