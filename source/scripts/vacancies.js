import React from "react";
import { render } from "react-dom";
import Vacancies from "./vacancies/container";

const vacancies = document.getElementById("react-vacancies");
const data = window.vacanciesJson;

if (vacancies && data) {
  render(<Vacancies data={data} />, vacancies);
}