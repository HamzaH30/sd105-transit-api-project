import { config } from "./config.js";
const baseEndPoint = "https://api.winnipegtransit.com/v3/";
const api_endpoint = `?api-key=${config.apiKey}`;

// When user clicks on a street
// Get the info about upcoming bus
// Render

async function fetchStreets(streetName) {
  const streetEndPoint = `${baseEndPoint}streets.json${api_endpoint}&name=${streetName}`;
  const response = await fetch(streetEndPoint);
  const data = await response.json();
  return data;
}

function getStreets(streetName) {
  fetchStreets(streetName)
    .then((data) => {
      renderHTML(data.streets);
    })
    .catch((err) => {
      console.log(err);
    });
}

function renderHTML(streets = []) {
  const streetsSect = document.querySelector("section.streets");
  streetsSect.innerHTML = "";
  if (streets.length > 0) {
    streets.forEach((street) => {
      streetsSect.insertAdjacentHTML(
        "beforeend",
        `<a href="#" data-street-key="${street.key}">${street.name}</a>`
      );
    });
  } else {
    streetsSect.insertAdjacentHTML(
      "beforeend",
      '<div class="no-results">No Streets found</div>'
    );
  }
}

renderHTML();

// Listen for user input
document.querySelector("form").addEventListener("submit", (event) => {
  event.preventDefault();
  getStreets(event.target.children[0].value);
});

// Listen for user clicks on street names
