import { config } from "./config.js";
const baseEndPoint = "https://api.winnipegtransit.com/v3/";
const api_endpoint = `?api-key=${config.apiKey}`;

// Get User input for street
// Get all matching results for street name
// Render streets in the aside menu

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
  fetchStreets(streetName).then((data) => {
    renderHTML(data.streets);
  });
}

document.querySelector("form").addEventListener("submit", (event) => {
  event.preventDefault();
  getStreets(event.target.children[0].value);
});
