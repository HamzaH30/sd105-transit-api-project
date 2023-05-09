/**
 * Name: Hamza Haque
 * Date: May 8, 2023
 * Project: Transit API Practice Project
 */

import { config } from "./config.js";
const baseEndPoint = "https://api.winnipegtransit.com/v3/";
const api_endpoint = `?api-key=${config.apiKey}`;

// TODO
// function getEndPoint(str, ...args) {
//   return `${baseEndPoint}${str}?api-key=${config.apiKey}${args.join("&")}`;
// }
// getEndPoint("something", "street=something", "two arg", "three arg", "four arg")

async function fetchStreets(streetName) {
  const streetEndPoint = `${baseEndPoint}streets.json${api_endpoint}&name=${streetName}`;
  const response = await fetch(streetEndPoint);
  const data = await response.json();
  // Return the data about all the matching streets as JSON
  return data;
}

function getStreets(streetName) {
  // Getting all the streets that have the same name as the one the user passed in
  fetchStreets(streetName)
    .then((data) => {
      renderStreetsHTML(data.streets);
    })
    .catch((err) => {
      console.log(err);
    });
}

function renderStreetsHTML(streets = []) {
  // Clear user input
  document.querySelector("input").value = "";

  const streetsSect = document.querySelector("section.streets");
  streetsSect.innerHTML = "";

  // If there are streets available to look at
  if (streets.length > 0) {
    // Add the HTML for each specific street
    streets.forEach((street) => {
      streetsSect.insertAdjacentHTML(
        "beforeend",
        `<a href="#" data-street-key="${street.key}">${street.name}</a>`
      );
    });
  } else {
    // There are no streets
    streetsSect.insertAdjacentHTML(
      "beforeend",
      '<div class="no-results">No Streets found</div>'
    );
  }
}

async function fetchStops(streetKey) {
  const stopsEndPoint = `${baseEndPoint}stops.json${api_endpoint}&street=${streetKey}`;
  const response = await fetch(stopsEndPoint);
  const data = response.json();
  // Return the data about all the stops on a specific street as JSON
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

      // TODO Idea:
      // const promises = streetData.stops.map(getStopScheduleMappingFunction);
      // Handle key in the function
      let counter = 0;
      const promisesOfAllBusStopSchedules = streetData.stops.map((busStop) => {
        // For every stop, get its bus schedule (which bus is coming at what time at THIS specific bus stop)
        if (counter < 100) {
          counter++;
          return getStopSchedule(busStop.key);
        }
      });

      // Once all the schedules have been fulfilled
      Promise.all(promisesOfAllBusStopSchedules).then((busSchedules) => {
        // Info about all bus stops
        const busStopsInfo = [];

        const stops = streetData.stops;
        console.log(busSchedules[101]);
        console.log(stops.length);
        const maxLoops = Math.min(100, stops.length);
        for (let i = 0; i < maxLoops; i++) {
          for (let j = 0; j < busSchedules[i].length; j++) {
            console.log(i);
            // Create an array of objects containing only the necessary info about each bus arriving at a stop
            busStopsInfo.push({
              name: stops[i].name.split(" ").slice(1).join(" "),
              crossStreet: stops[i]["cross-street"].name,
              direction: stops[i].direction,
              key: stops[i].key,
              schedule: busSchedules[i][j],
            });
            // TODO: busStopsInfo.push(new BusStopInfo(stops[i]));
            // Create a class containing the info being passed in the busStopsInfo array
          }
        }
        // TODO: sortByTime(busStopsInfo) sort performs action on input array
        // const displayText = stops[0].street.name
        // renderBusSchedulesHTML(busStopsInfo, displayText)

        renderBusSchedulesHTML(sortByTime(busStopsInfo), stops[0].street.name);
      });
    })
    .catch((err) => {
      console.log(err);
    });
}

async function fetchStopSchedule(busStop) {
  const stopScheduleEndPoint = `${baseEndPoint}stops/${busStop}/schedule.json${api_endpoint}&max-results-per-route=2`;
  const response = await fetch(stopScheduleEndPoint);
  const data = response.json();

  // Return a JSON of the timings of what bus is coming at what time to a specific bus stop
  return data;
}

async function getStopSchedule(busStop) {
  // TODO const data = await fetchStopSchedule(busStop.key);
  const data = await fetchStopSchedule(busStop);
  let stopSchedule = [];
  const routeSchedules = data["stop-schedule"]["route-schedules"];
  for (let routeSchedule of routeSchedules) {
    // Add the info about what route and its time to the collection about the schedule for each stop
    stopSchedule = getTimingsForRoute(routeSchedule, stopSchedule);
  }
  return stopSchedule;
}

function getTimingsForRoute(routeSchedule, stopSchedule) {
  const routeNum = routeSchedule.route.number;

  for (let scheduledStop of routeSchedule["scheduled-stops"]) {
    // routeSchedule["scheduled-stops"] is an array of MAX 2 objects.
    // Each object (scheduledStop) is an object containing the info of when this bus will arrive/depart at a specific bus stop
    let busTime = scheduledStop.times.departure.estimated;

    // Add the info about what route and its time to the collection about the schedule for each stop
    stopSchedule.push({ routeNum: routeNum, timeArrival: busTime });
  }

  return stopSchedule;
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

// Clear the displayed values
renderStreetsHTML();
renderBusSchedulesHTML();

// Listen for user input
document.querySelector("form").addEventListener("submit", (event) => {
  event.preventDefault();
  // const fd = new FormData(event.target);
  // TODO: the key is the name property of the input element
  // getStreets(fd.get("street-search"));

  getStreets(event.target.children[0].value);
});

// Listen for user clicks on street names
document.querySelector("section.streets").addEventListener("click", (event) => {
  if ("streetKey" in event.target.dataset) {
    getStops(+event.target.dataset.streetKey);
  }
});
