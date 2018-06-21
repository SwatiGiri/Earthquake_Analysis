// Store our API endpoint inside queryUrl
var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson";
var boundries;



function normalize(val, min, max) {
  return (val - min) / (max - min);
}

function getColor(mag) {
  let r = Math.floor(normalize(mag, 0, 6) * 255);
  return "rgb(" + r + " ," + 100 + "," + 0 + ")";
}

// Perform a GET request to the query URL
d3.json(queryUrl, function (data) {
  // Once we get a response, send the data.features object to the createFeatures function
  createFeatures(data.features);
});

function createFeatures(earthquakeData) {

  // Define a function we want to run once for each feature in the features array
  // Give each feature a popup describing the place and time of the earthquake'

  var markers = [];

  function onEachFeature(feature, layer) {
    let mag = feature.properties.mag;
    // let centerMarker = L.marker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]]); 
    var circle = L.circle([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], {
      stroke: false,
      fillOpacity: 0.7,
      fillColor: getColor(mag),
      radius: mag * 30000
    })
    circle.bindPopup("<h3>" + "Magnitude:" + mag +
      "</h3><hr><p>" + feature.properties.place + "</p>");
    markers.push(circle);
  }


  // Create a GeoJSON layer containing the features array on the earthquakeData object
  // Run the onEachFeature function once for each piece of data in the array
  var earthquakes = L.geoJSON(earthquakeData, {
    onEachFeature: onEachFeature
  });

  // Sending our earthquakes layer to the createMap function
  createMap(L.layerGroup(markers));
}

function createMap(earthquakes) {

  // Define streetmap and darkmap layers
  var streetmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/outdoors-v10/tiles/256/{z}/{x}/{y}?" +
    "access_token=pk.eyJ1Ijoic3dhdGlnaXJpIiwiYSI6ImNqaHkxanh2YTBoeGwzcW8xY294ZXYxamkifQ.hnFsM3Z_9aXYE7kY_XTQeQ");

  var darkmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?" +
    "access_token=pk.eyJ1Ijoic3dhdGlnaXJpIiwiYSI6ImNqaHkxanh2YTBoeGwzcW8xY294ZXYxamkifQ.hnFsM3Z_9aXYE7kY_XTQeQ");

    // getting tectonic data and do the other stuff after it
  d3.json("boundaries.json", (err, data) => {
    console.log(data["type"]);
    console.log(err);
    var tectonicLayer = L.geoJSON(data);
    // Define a baseMaps object to hold our base layers
    var baseMaps = {
      "Street Map": streetmap,
      "Dark Map": darkmap
    };

    // Create overlay object to hold our overlay layer

    var overlayMaps = {
      Earthquakes: earthquakes,
      Tectonic: tectonicLayer
    };

    // Create our map, giving it the streetmap and earthquakes layers to display on load
    var myMap = L.map("map", {
      center: [
        37.09, -95.71
      ],
      zoom: 3,
      layers: [streetmap, earthquakes, tectonicLayer]
    });


    // adding the legend

    var legend = L.control({
      position: 'bottomright'
    });

    legend.onAdd = function (map) {

      var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 1, 2, 3, 4, 5, 6, 7],
        labels = [];

      // loop through our density intervals and generate a label with a colored square for each interval
      for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
          '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
          grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
      }

      return div;
    };

    legend.addTo(myMap);
    
    // Create a layer control
    // Pass in our baseMaps and overlayMaps
    // Add the layer control to the map
    L.control.layers(baseMaps, overlayMaps, {
      collapsed: false
    }).addTo(myMap);
  })

}