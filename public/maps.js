var walton = {
	lat: 41.900229,
	lng: -87.629082
};

var map = null;
var markers = [];
var geoMarker = null;

function onDocReadyForMap() {
	initMap();
}

function initMap(lat = 0, lng = 0) {
	map = new google.maps.Map(document.getElementById("google-map"), {
		zoom: 14,
		center: {
			lat: lat,
			lng: lng
		},
		fullscreenControl: false
	});
	
	geoMarker = new GeolocationMarker(map);

	//	setTimeout(fixMap, 500);
}

function centerAtMarker(lat, lng) {
	clearMarkers();
	
	var center = {lat: lat, lng: lng};
	
	if (map == null) {
		initMap(lat, lng);
		setTimeout( ()=> {
			google.maps.event.trigger(map, 'resize');
			map.setCenter(center);
		}, 666);
	} else {
		map.setCenter(center);
	}
	
	var marker = new google.maps.Marker({
		position: center,
		map: map
	});
	markers.push(marker);
}

function clearMarkers() {
	for (var i = 0; i < markers.length; ++i) {
		markers[i].setMap(null);
		markers[i] = null;
	}
	markers = [];
}
