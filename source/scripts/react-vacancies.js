import "core-js/stable";
import "regenerator-runtime/runtime";

// only run code for vacancies when present in HTML
const vacancies = document.getElementById("react-vacancies");
if (vacancies) {
  const data = window.vacanciesJson;
  if (!data) {
    console.log("No data found for ReactVacancies.");
  } else {
    require("./react-vacancies/vacancies").default(vacancies, data);
  }
}
