import { SquareClient, SquareEnvironment, SquareError } from "square";
import { SQUARE_ACCESS_TOKEN } from "./config";
const client = new SquareClient({
  token: SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Sandbox,
});

export async function getLocations() {
  try {
    console.log("Function runs...: getLocations");

    let listLocationsResponse = await client.locations.list();

    let locations = listLocationsResponse.locations;
    let locationId 

    if (locations && locations?.length > 0) {
      locations.forEach(function (location) {
        locationId = location.id
        console.log(
          location.id +
            ": " +
            location.name +
            ", " +
            location.address?.addressLine1 +
            ", " +
            location.address?.locality
        );
      });
      return locationId;
    }
  } catch (error) {
    if (error instanceof SquareError) {
      error.errors.forEach(function (e) {
        console.log(e.category);
        console.log(e.code);
        console.log(e.detail);
      });
    } else {
      console.log("Unexpected error occurred: ", error);
    }
  }
}
