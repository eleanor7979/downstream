const waterMap = L.map("water-map").setView([41.7,-73.93], 10);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(waterMap);
let yourMarker = null;
let trace = null;
const heavyRain = 2 //National Center for Hydrology and Meteorology defines heavy rain a day as 31 to 70mm, so the average of that was used in inches
const reportForm = "https://docs.google.com/forms/d/e/1FAIpQLScQ9JqVuRF1l571jJjJER3suOQvd-r0lDlOwgr1G-YLcgCS4g/viewform?usp=publish-editor";
const repLookup = "https://www.house.gov/representatives/find-your-representative";
async function goToSpot(lat, lon) {
    if (typeof yourMarker !== 'undefined' && yourMarker !== null) {
        waterMap.removeLayer(yourMarker);
    }
    yourMarker = L.marker([lat, lon]).addTo(waterMap).bindPopup("You are here").openPopup();
    waterMap.setView([lat, lon], 12);
    await drawTrace(lat, lon)
    const weatherStatus = await getWeatherData(lat, lon)
    updateWebBanner(weatherStatus)
    updateActionList(weatherStatus)
}
document.getElementById("town").addEventListener("change", event => {
    if (event.target.value === "") {
        return;
    }
    const [lat, lon] = event.target.value.split(',').map(Number);
    goToSpot(lat, lon)
});
async function getWeatherData(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum&past_days=2&forecast_days=3&precipitation_unit=inch&timezone=America%2FNew_York`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(data);
        const rain = data.daily.precipitation_sum;
        const recent = Math.max(rain[0], rain[1], rain[2]);
        const future = Math.max(rain[3], rain[4]);
        if (recent >= heavyRain) {
            return "now"
        }
        if (future >= heavyRain) {
            return "coming"
        }
        if (recent < heavyRain && future < heavyRain) {
            return "dry"
        }
    }
    catch (error) {
            console.error(error);
            return "dry"
    }
}
const rainMessages = {
    now: {
        title: "Heavy rain fell recently.",
        message: "There is heavy rain happening right now. Sewers may overflow and there may be sewage in the surrounding water for a few days." 
    },
    coming: {
        title: "Heavy rain is coming soon!",
        message: "There is heavy rain forecasted soon. Sewers may overflow when it happens, act now to avoid exposure to sewage in the surrounding water." 
    },
    dry: {
        title: "No heavy rain is forecasted.",
        message: "There is no heavy rain currently, a good day to do something before the next storm."
    }
}
function updateWebBanner(rainStatus) {
    const banner = document.getElementById("web-banner");
    banner.innerHTML = `<h2>${rainMessages[rainStatus].title}</h2><p>${rainMessages[rainStatus].message}</p>`;
    banner.classList.remove("hidden");
    if (rainStatus === "dry") {
        banner.classList.remove("alert");
    }
    else {
        banner.classList.add("alert");
    }
}
const actions = {
    coming: ["Do the laundry or use the dishwasher tonight, before the storm. Clear leaves off the storm drains."],
    now: ["Do not go swimming or boating in the water. Avoid contact with the water for a few days."],
    dry: ["Keep drains clean of grease or wipes, clean up pet waste, and maybe join a cleanup!"]
}
function updateActionList(rainStatus) {
    const actionList = document.getElementById("action-list");
    actionList.innerHTML = "";
    for (const action of actions[rainStatus]) {
        document.createElement("li");
        const li = document.createElement("li");
        li.textContent = action;
        actionList.appendChild(li);
    }
    const listItem = document.createElement("li");
    const a = document.createElement("a");
    a.href = "https://www.house.gov/representatives/find-your-representative";
    a.textContent = "Find your representative";
    a.target = "_blank";
    listItem.appendChild(a);
    actionList.appendChild(listItem);
    const li = document.createElement("li");
    const A = document.createElement("a");
    A.href = "https://docs.google.com/forms/d/e/1FAIpQLScQ9JqVuRF1l571jJjJER3suOQvd-r0lDlOwgr1G-YLcgCS4g/viewform?usp=publish-editor";
    A.textContent = "Report a problem";
    A.target = "_blank";
    li.appendChild(A);
    actionList.appendChild(li);
}
async function drawTrace(lat, lon) {
    const description = document.getElementById("trace-description");
    try {
        const address1 = `https://api.water.usgs.gov/nldi/linked-data/comid/position?f=json&coords=POINT(${lon} ${lat})`;
        description.textContent = "Tracing where the water flows...";
        const response1 = await fetch(address1);
        const data = await response1.json();
        console.log(data);
        const comidVariable = data.features[0].properties.comid   
        const address2 = `https://api.water.usgs.gov/nldi/linked-data/comid/${comidVariable}/navigation/DM/flowlines?f=json&distance=300`;
        const response2 = await fetch(address2);
        const riverShape = await response2.json();
        console.log(riverShape);
        if (typeof trace !== 'undefined' && trace !== null) {
        waterMap.removeLayer(trace);
        }
        trace = L.geoJSON(riverShape, { style: { color: "#01579B", weight: 4 } }).addTo(waterMap);
        description.textContent = "The blue line shows where the water flows.";
    }
    catch (error) {
        console.error(error);
        description.textContent = "Couldn't load the water flow trace. Please try again later.";
    }  
}
document.getElementById("location").addEventListener("click", event => {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            goToSpot(position.coords.latitude, position.coords.longitude);
        },
        () => {
            alert("Could not get your location. Please allow location access or enter a town manually.");
        }
    );
});