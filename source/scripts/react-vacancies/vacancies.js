import React from "react";
import { render } from "react-dom";

import Vacancies from "./containers/vacancies";

export default function(div, data) {
  render(<Vacancies data={data} />, div);
}