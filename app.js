const waterMap = L.map("water-map").setView([41.7,-73.93], 10);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(waterMap);
let yourMarker = null;
function goToSpot(lat, lon) {
    if (typeof yourMarker !== 'undefined' && yourMarker !== null) {
        waterMap.removeLayer(yourMarker);
    }
    yourMarker = L.marker([lat, lon]).addTo(waterMap).bindPopup("You are here").openPopup();
    waterMap.setView([lat, lon], 12);
}
document.getElementById("town").addEventListener("change", event => {
    if (event.target.value === "") {
        return;
    }
    const [lat, lon] = event.target.value.split(',').map(Number);
    goToSpot(lat, lon)
});