/**
 * Name: Hamza Haque
 * Date: May 8, 2023
 * Project: Transit API Practice Project
 */

import { config } from "./config.js";
const baseEndPoint = "https://api.winnipegtransit.com/v3/";
const api_endpoint = `?api-key=${config.apiKey}`;

async function fetchStreets(streetName) {
  const streetEndPoint = `${baseEndPoint}streets.json${api_endpoint}&name=${streetName}`;
  const response = await fetch(streetEndPoint);
  const data = await response.json();
  return data;
}

function getStreets(streetName) {
  fetchStreets(streetName)
    .then((data) => {
      renderStreetsHTML(data.streets);
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
  // Get data about all the stops on a street
  fetchStops(streetKey)
    .then((streetData) => {
      // data.stops.map((stop) => {
      //   // For every stop, create a collection of bus schedules as well as other relevant info.
      //   getStopSchedule(stop.key).then((busSchedule) => {
      //     stops.push({
      //       name: stop.name.split(" ").slice(1).join(" "),
      //       crossStreet: stop["cross-street"].name,
      //       direction: stop.direction,
      //       key: stop.key,
      //       schedule: busSchedule,
      //     });
      //   });

      //   console.log(stops);
      // });
      const promisesOfAllBusStopSchedules = streetData.stops.map((busStop) => {
        // For every stop, get its bus schedule
        return getStopSchedule(busStop.key);
      });

      // Once all the schedules have been fulfilled
      Promise.all(promisesOfAllBusStopSchedules).then((busSchedules) => {
        // Info about all bus stops
        let busStopsInfo = [];

        const stops = streetData.stops;
        for (let i = 0; i < stops.length; i++) {
          for (let n = 0; n < busSchedules[i].length; n++) {
            // Create an array of objects containing only the necessary info about each bus arriving at a stop
            busStopsInfo.push({
              name: stops[i].name.split(" ").slice(1).join(" "),
              crossStreet: stops[i]["cross-street"].name,
              direction: stops[i].direction,
              key: stops[i].key,
              schedule: busSchedules[i][n],
            });
          }
        }

        renderBusSchedulesHTML(sortByTime(busStopsInfo), stops[0].street.name);
      });
    })
    .catch((err) => {
      console.log(err);
    });
}

function sortByTime(busStopsInfo) {
  busStopsInfo.sort((x, y) => {
    const xDate = new Date(x.schedule.timeArrival);
    const yDate = new Date(y.schedule.timeArrival);
    return xDate - yDate;
  });
  return busStopsInfo;
}

function formatTime(time) {
  const date = new Date(time);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
}

async function getStopSchedule(busStop) {
  const data = await fetchStopSchedule(busStop);
  let stopSchedule = [];
  const routeSchedules = data["stop-schedule"]["route-schedules"];
  for (let routeSchedule of routeSchedules) {
    stopSchedule = getTimingsForRoute(routeSchedule, stopSchedule);
  }
  return stopSchedule;
}

function getTimingsForRoute(routeSchedule, stopSchedule) {
  const routeNum = routeSchedule.route.number;
  for (let scheduledStop of routeSchedule["scheduled-stops"]) {
    let busTime = scheduledStop.times.departure.estimated;
    // busTime = formatTime(busTime);
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

function renderStreetsHTML(streets = []) {
  document.querySelector("input").value = "";
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

function renderBusSchedulesHTML(busSchedule = [], street = "none") {
  // Update the "Displaying results for ..."
  document.getElementById(
    "street-name"
  ).textContent = `Displaying results for ${street}`;

  const tBody = document.querySelector("tbody");
  tBody.innerHTML = "";
  busSchedule.forEach((busStop) => {
    tBody.insertAdjacentHTML(
      "beforeend",
      `
      <tr>
        <td>${busStop.name}</td>
        <td>${busStop.crossStreet}</td>
        <td>${busStop.direction}</td>
        <td>${busStop.schedule.routeNum}</td>
        <td>${formatTime(busStop.schedule.timeArrival)}</td>
      </tr>
  `
    );
  });
}

renderStreetsHTML();
renderBusSchedulesHTML();

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
