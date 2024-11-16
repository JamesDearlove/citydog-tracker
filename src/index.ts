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

	return new Response(JSON.stringify(ferryLocations?.entity));
};

/**
 * DTO for the main API call.
 */
interface VehicleInfo {
	name: string;
	icon: 'Bluey' | 'Bingo' | 'Default';
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
			vehicleInfo.nickname = 'Bluey';
			vehicleInfo.icon = 'Bluey';
			vehicleInfo.viewPriority = 100;
			break;
		case 'kuluwin':
			vehicleInfo.nickname = 'Bingo';
			vehicleInfo.icon = 'Bingo';
			vehicleInfo.viewPriority = 100;
			break;
		default:
			vehicleInfo.nickname = 'Not a dog';
			vehicleInfo.icon = 'Default';
			break;
	}

	const routeCode = vehicleRaw.trip.routeId.split('-')[0];

	switch (routeCode) {
		// CityCats
		case 'NHAM':
			vehicleInfo.route = 'Heading towards Northshore Hamilton';
			break;
		case 'UQSL':
			vehicleInfo.route = 'Heading towards UQ St Lucia';
			break;
		// Cross River Ferries
		case 'TNRF':
			vehicleInfo.route = 'Bulimba/Teneriffe Cross River Ferry';
			break;
		case 'HOLM':
			vehicleInfo.route = 'Inner-City Cross River Ferry';
			break;
		case 'HSWS':
			vehicleInfo.route = 'Inner-City Cross River Ferry';
			break;
		// KittyCats
		case 'NTHQ':
			vehicleInfo.name += ' - KittyCat';
			vehicleInfo.route = 'Heading towards North Quay';
			break;
		case 'SYDS':
			vehicleInfo.name += ' - KittyCat';
			vehicleInfo.route = 'Heading towards Sydney Street';
			break;
		// Not part of the Brisbane fleet, so ignore (therefore chaos)
		default:
			vehicleInfo.route = routeCode;
			break;
	}

	return vehicleInfo;
};

const parsedLocations = async () => {
	const ferryLocations = await gtfsResponse();
	// Deal with SMBI ferries, those aren't in Brisbane.
	const ferries = ferryLocations?.entity.filter((v) => v.vehicle?.trip?.routeId?.slice(0, 4) !== 'SMBI');
	const dtoFerries = ferries?.map((v) => parseFerryInfo(v))

	return new Response(JSON.stringify(dtoFerries));
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
