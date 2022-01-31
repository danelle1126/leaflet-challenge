// create tile layers
var myDefault = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// dark background
var dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 20
});

// satellite view
var satellite = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}', {
	maxZoom: 20,
	attribution: 'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>'
});

// base map object
let basemaps = {
    "Dark Background": dark,
    "Satellite Image": satellite,
    Default: myDefault
};

// make map object
var myMap = L.map("map", {
    center: [36.7783, -119.4179],
    zoom: 2,
    layers: [dark, satellite, myDefault]
});

// add default map
myDefault.addTo(myMap);

// get data for tectonic plates and draw on map
let tectonicPlates = new L.layerGroup();

d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json")
.then(function(plateData){
    L.geoJson(plateData, {
        color: "red",
        weight: 3
    }).addTo(tectonicPlates);
});

tectonicPlates.addTo(myMap);

// add earthquake data layer
let earthquakeData = new L.layerGroup();

d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson")
.then(function(quakeData){
    function dataColor(depth){
        if (depth > 90)
            return "red";
        else if (depth > 70)
            return "orangered";
        else if (depth > 50)
            return "orange";
        else if (depth > 30)
            return "gold";
        else if (depth > 10)
            return "yellow";
        else return "green";   
    }
    function radiusSize(magnitude){
        if (magnitude == 0)
            return 1;
        else return magnitude * 2;
    }
    function dataStyle(feature) {
        return {
            opacity: 0.5,
            fillOpacity: 0.5,
            fillColor: dataColor(feature.geometry.coordinates[2]),
            color: "000000",
            radius: radiusSize(feature.properties.mag),
            weight: 0.5,
            stroke: true
        }
    }
    L.geoJson(quakeData, {
        pointToLayer: function(feature,latLng) {
            return L.circleMarker(latLng);
        },
        style: dataStyle, 
        onEachFeature: function(feature,layer){
            layer.bindPopup(`Magnitude: <b>${feature.properties.mag}</b><br> 
            Depth: <b>${feature.geometry.coordinates[2]}</b><br> 
            Location: <b>${feature.properties.place}</b>`);
        }
    }).addTo(earthquakeData);
});

earthquakeData.addTo(myMap);

let overlays = {
    "Tectonic Plates": tectonicPlates,
    "Earthquake Data": earthquakeData
};

L.control
    .layers(basemaps, overlays)
    .addTo(myMap);

let legend = L.control({
    position: "bottomright"
});

legend.onAdd = function(){
    let div = L.DomUtil.create("div", "info legend");
    let intervals = [-10, 10, 30, 50, 70, 90];
    let colors = ["green","yellow","gold","orange", "orangered","red"];
    for (var i = 0; i < intervals.length; i++) {
        div.innerHTML += "<i style='background: "+colors[i]+"'></i> "+intervals[i]+(intervals[i+1] ? "km to "+intervals[i+1]+"km<br>" : "+ km");
    }
    return div;
};

legend.addTo(myMap);