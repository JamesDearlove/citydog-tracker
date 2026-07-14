import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import fetch from 'node-fetch';

const TRANSLINK_FEED = 'https://gtfsrt.api.translink.com.au/api/realtime/SEQ/VehiclePositions/Ferry';

/**
 * Basically templated GTFS-RT code, from https://gtfs.org/documentation/realtime/language-bindings/nodejs/
 * @returns Raw protobuf data of the GTFS-RT feed.
 */
const gtfsResponse = async () => {
	try {
		// No auth required for Translink feeds.
		const response = await fetch(TRANSLINK_FEED);

		if (!response.ok) {
			throw Error(`${response.url}: ${response.status} ${response.statusText}`);
		}

		// gtfs template code, decode.
		const buffer = await response.arrayBuffer();
		const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));

		return feed;
	} catch (error) {
		console.log(error);
	}
};

/**
 * Gets back all vehicles in a given GTFS-RT feed.
 * @returns Response as JSON, with vehicles still in GTFS-RT format
 */
const allLocations = async () => {
	const ferryLocations = await gtfsResponse();

	return Response.json(ferryLocations?.entity);
};

/**
 * DTO for the main API call.
 */
interface VehicleInfo {
	name: string;
	icon: 'Bluey' | 'Bingo' | 'CrossRiver' | 'Default';
	viewPriority?: number;
	nickname?: string;
	route?: string;
	location: number[];
}

/**
 * Make sense of the GTFS data, and clean it up for the frontend.
 * @param rawInfo A raw GTFS-RT entity.
 * @returns VehicleInfo of the given GTFS-RT entity.
 */
const parseFerryInfo = (rawInfo: any): VehicleInfo => {
	const vehicleRaw = rawInfo.vehicle;

	const vehicleLabel = vehicleRaw.vehicle.label;
	const vehicleLocation = [vehicleRaw.position.latitude, vehicleRaw.position.longitude];

	const vehicleInfo: VehicleInfo = { name: vehicleLabel, icon: 'Default', location: vehicleLocation, viewPriority: 0 };

	switch (vehicleLabel.toLowerCase()) {
		case 'gootcha':
			vehicleInfo.nickname = 'Bluey!';
			vehicleInfo.icon = 'Bluey';
			vehicleInfo.viewPriority = 100;
			break;
		case 'kuluwin':
			vehicleInfo.nickname = 'Bingo!';
			vehicleInfo.icon = 'Bingo';
			vehicleInfo.viewPriority = 100;
			break;
		case 'victoria':
		case 'taylor':
		case 'albert':
		case 'melany':
		case 'eleanor':
			vehicleInfo.nickname = "KittyCat";
			vehicleInfo.icon = 'CrossRiver';
			vehicleInfo.viewPriority = 200;
			break;
		default:
			vehicleInfo.nickname = 'Not a dog';
			vehicleInfo.icon = 'Default';
			break;
	}

	const routeCode = vehicleRaw.trip.routeId.split('-')[0];

	switch (routeCode) {
		// CityCats
		case 'F1':
			vehicleInfo.route = 'F1 - Northshore Hamilton to UQ St Lucia';
			break;
		// Cross River Ferries
		case 'F21':
			vehicleInfo.route = 'F21 - Bulimba/Teneriffe Cross River Ferry';
			break;
		case 'F22':
			vehicleInfo.route = 'F22 - Sydney Street/Dockside Cross River Ferry';
			break;
		case 'F23':
			vehicleInfo.route = 'F23 - Riverside/Holman Street Cross River Ferry';
			break;
		case 'F24':
			vehicleInfo.route = 'F24 - Maritime Museum/QUT Gardens Point Cross River Ferry';
			break;
		// SpeedyCats
		case 'F11':
			vehicleInfo.route = 'F11 - Apollo Road to Riverside SpeedyCat';
			break;
		case 'F12':
			vehicleInfo.route = 'F12 - West End to QUT Gardens Point SpeedyCat';
			break;
		// Not part of the Brisbane fleet, so ignore (therefore chaos)
		default:
			vehicleInfo.route = routeCode;
			break;
	}

	return vehicleInfo;
};

const NON_BRIS = ['F50', 'SMBI'];

const filterNonBrisbane = (v: GtfsRealtimeBindings.transit_realtime.IFeedEntity) => {
	const route = v.vehicle?.trip?.routeId?.split('-')[0] ?? ''
	return !NON_BRIS.includes(route);
}

const parsedLocations = async () => {
	const ferryLocations = await gtfsResponse();

	// The feed includes all SEQ live tracked ferries, filter out non Brisbane ferries.
	const ferries = ferryLocations?.entity.filter((v) => filterNonBrisbane(v));
	const dtoFerries = ferries?.map((v) => parseFerryInfo(v))

	return Response.json(dtoFerries);
};

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		switch (url.pathname) {
			case '/health':
				return new Response('Hello, World!');
			case '/ferryinforaw':
				return allLocations();
			case '/ferryinfo':
				return parsedLocations();
			default:
				return new Response('Not Found', { status: 404 });
		}
	},
} satisfies ExportedHandler<Env>;
