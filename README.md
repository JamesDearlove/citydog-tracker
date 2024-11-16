# CityDog Tracker

Live tracking of where the ferries are on the Brisbane River, with extra flare to highlight the CityDogs.

Brisbane's main ferries are known as the [CityCats](https://www.brisbane.qld.gov.au/traffic-and-transport/public-transport/citycat-and-ferry-services)
and the little inner city ones are known as the [KittyCats](https://www.brisbane.qld.gov.au/traffic-and-transport/public-transport/citycat-and-ferry-services/inner-city-ferry-services).
With everyone's favourite show Bluey being set primarily in Brisbane, and to celebrate Bluey's World opening, two of our [CityCats have been transformed into CityDogs](https://www.bluey.tv/blog/brisbane-welcomes-citydogs/).
With that, I thought to whip together a quick live map of our ferries to make it easier to find where the CityDogs are at.

Sometimes the CityDogs named Bluey and Bingo aren't running an active route or live tracking is temporarily
unavailable, so they won't appear on the map.

This map is made possible by [Translink's GTFS-RT Feeds](https://translink.com.au/about-translink/open-data/gtfs-rt) and [Leaflet](https://leafletjs.com/)

## Builds/Deploying

This is built and deployed with Cloudflare Workers

- Run `npm run dev` in your terminal to start a development server
- Open a browser tab at http://localhost:8787/ to see your worker in action
- Run `npm run deploy` to publish your worker
