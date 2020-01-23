import "core-js/stable";
import "regenerator-runtime/runtime";

// only run code for vacancies when present in HTML
const vacancies = document.getElementById("react-vacancies");
const data = window.vacanciesJson;
require("./react-vacancies/vacancies").default(vacancies, data);
