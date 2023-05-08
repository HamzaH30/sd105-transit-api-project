import { config } from "./config.js";

// Get User input for street
// Get all matching results for street name
// Render streets in the aside menu

// When user clicks on a street
// Get the info about upcoming bus
// Render

function getStreets(streetName) {}

document.querySelector("form").addEventListener("submit", (event) => {
  event.preventDefault();
  getStreets(event.target.children[0].value);
});
