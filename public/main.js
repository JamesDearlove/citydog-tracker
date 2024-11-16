var map = L.map('map', { zoomSnap: 0 }).setView([-27.47, 153.04], 12);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution:
		'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="https://translink.com.au/legal/copyright">Translink</a>',
}).addTo(map);

var imageIcon = L.Icon.extend({
	options: {
		iconSize: [40, 40],
		iconAnchor: [20, 40],
		popupAnchor: [0, -10],
	},
});

var blueyIcon = new imageIcon({ iconUrl: 'images/bluey_crop.png' }),
	bingoIcon = new imageIcon({ iconUrl: 'images/bingo_crop.png' }),
	defaultIcon = new imageIcon({ iconUrl: 'images/translink_ferry.svg'});

var initialZoom = false;

var regularFerries = new L.layerGroup().addTo(map);
var specialFerries = new L.layerGroup().addTo(map);

var layers = { CityDogs: specialFerries, 'Other Ferries': regularFerries };
var layerControl = L.control.layers({}, layers).addTo(map);

function iconMapping(icon) {
	switch (icon) {
		case 'Bluey':
			return blueyIcon;
		case 'Bingo':
			return bingoIcon;
		default:
			return defaultIcon;
	}
}

function plotDogs(apiBody) {
	regularFerries.getLayers().forEach((m) => regularFerries.removeLayer(m));
	specialFerries.getLayers().forEach((m) => specialFerries.removeLayer(m));

	apiBody.forEach((ferry) => {
		const marker = L.marker(ferry.location, { icon: iconMapping(ferry.icon), zIndexOffset: ferry.viewPriority }).bindPopup(
			`<b>${ferry.nickname}</b><br>${ferry.name}<br>${ferry.route}`
		);

		switch (ferry.viewPriority) {
			case 100:
				specialFerries.addLayer(marker);
				break;
			default:
				regularFerries.addLayer(marker);
				break;
		}
	});

	// Attempts to fix the zoom so it's better for mobile.
	if (!initialZoom) {
		ferriesGroup = new L.featureGroup(regularFerries.getLayers(), specialFerries.getLayers());
		map.fitBounds(ferriesGroup.getBounds(), { padding: L.point(50, 50) });
		initialZoom = true;
	}
}

function fetchDogs() {
	fetch('/ferryinfo')
		.then((res) => res.json())
		.then((json) => plotDogs(json));

	// And refresh every 15 seconds
	setTimeout(fetchDogs, 15000);
}

fetchDogs();
