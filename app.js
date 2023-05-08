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

async function fetchStops(streetKey) {
  const stopsEndPoint = `${baseEndPoint}stops.json${api_endpoint}&street=${streetKey}`;
  const response = await fetch(stopsEndPoint);
  const data = response.json();
  return data;
}

function getStops(streetKey) {
  let stops = [];
  fetchStops(streetKey)
    .then((data) => {
      data.stops.forEach((stop) => {
        getStopSchedule(stop.key).then((value) => {
          console.log(value);
          stops.push({
            name: stop.street.name,
            crossStreet: stop["cross-street"].name,
            key: stop.key,
            schedule: 1,
          });
        });

        // console.log(stops);
      });
    })
    .catch((err) => {
      console.log(err);
    });
}

function formatTime(time) {
  const date = new Date(time);
  let hours = date.getHours() % 12;
  hours = hours === 0 ? 12 : hours;
  const mins = date.getMinutes();
  return `${hours}:${mins}`;
}

function getStopSchedule(busStop) {
  return fetchStopSchedule(busStop)
    .then((data) => {
      // console.log(data);
      let stopSchedule = [];
      const routeSchedules = data["stop-schedule"]["route-schedules"];
      for (let routeSchedule of routeSchedules) {
        stopSchedule = getTimingsForRoute(routeSchedule, stopSchedule);
      }

      return stopSchedule;
    })
    .catch((err) => {
      console.log(err);
    });
}

function getTimingsForRoute(routeSchedule, stopSchedule) {
  const routeNum = routeSchedule.route.number;
  for (let scheduledStop of routeSchedule["scheduled-stops"]) {
    let busTime = scheduledStop.times.departure.estimated;
    busTime = formatTime(busTime);
    stopSchedule.push({ routeNum: routeNum, timeArrival: busTime });
  }

  return stopSchedule;
}

async function fetchStopSchedule(busStop) {
  const stopScheduleEndPoint = `${baseEndPoint}stops/${busStop}/schedule.json?${api_endpoint}&max-results-per-route=2`;
  const response = await fetch(stopScheduleEndPoint);
  const data = response.json();
  return data;
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
document.querySelector("section.streets").addEventListener("click", (event) => {
  if ("streetKey" in event.target.dataset) {
    getStops(+event.target.dataset.streetKey);
  }
});
