"""Routing via the public OSRM service."""
from __future__ import annotations

from dataclasses import dataclass, field

import requests
from django.conf import settings

from .geocode import GeocodedLocation

METERS_PER_MILE = 1609.34


class RoutingError(Exception):
    """Raised when a route cannot be computed."""


@dataclass
class RouteLeg:
    """A single leg between two waypoints."""

    distance_miles: float
    duration_hours: float


@dataclass
class Route:
    distance_miles: float
    duration_hours: float
    # Geometry as a list of [lat, lon] pairs (GeoJSON is [lon, lat]; we flip it).
    geometry: list[list[float]] = field(default_factory=list)
    legs: list[RouteLeg] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "distance_miles": round(self.distance_miles, 1),
            "duration_hours": round(self.duration_hours, 2),
            "geometry": self.geometry,
            "legs": [
                {
                    "distance_miles": round(leg.distance_miles, 1),
                    "duration_hours": round(leg.duration_hours, 2),
                }
                for leg in self.legs
            ],
        }


def get_route(waypoints: list[GeocodedLocation], timeout: int = 25) -> Route:
    """Compute a driving route through the ordered waypoints using OSRM."""
    if len(waypoints) < 2:
        raise RoutingError("At least two waypoints are required for a route.")

    coords = ";".join(f"{wp.lon},{wp.lat}" for wp in waypoints)
    url = f"{settings.OSRM_URL.rstrip('/')}/route/v1/driving/{coords}"
    params = {
        "overview": "full",
        "geometries": "geojson",
        "steps": "false",
    }

    headers = {"User-Agent": settings.GEO_USER_AGENT}
    try:
        response = requests.get(url, params=params, headers=headers, timeout=timeout)
        response.raise_for_status()
        data = response.json()
    except requests.RequestException as exc:
        raise RoutingError("Routing request failed.") from exc
    except ValueError as exc:
        raise RoutingError("Invalid routing response.") from exc

    code = data.get("code", "")
    if code == "NoRoute" or (not data.get("routes") and code != "Ok"):
        raise RoutingError(
            "No road route exists between these locations. This usually happens when the "
            "trip would require crossing an ocean or a large body of water with no road "
            "or bridge connection (e.g. continental US to Hawaii, or cross-Atlantic). "
            "Please make sure all three locations are reachable by road."
        )
    if code == "InvalidInput":
        raise RoutingError(
            "One or more of the provided locations could not be used for routing — "
            "the coordinates may be in the ocean or outside of a mapped road network. "
            "Please search for and select a valid address."
        )
    if code != "Ok" or not data.get("routes"):
        raise RoutingError(
            data.get("message")
            or "The routing service could not compute a route. Please check your locations."
        )

    route = data["routes"][0]
    geometry = [
        [coord[1], coord[0]] for coord in route["geometry"]["coordinates"]
    ]
    legs = [
        RouteLeg(
            distance_miles=leg["distance"] / METERS_PER_MILE,
            duration_hours=leg["duration"] / 3600.0,
        )
        for leg in route.get("legs", [])
    ]

    return Route(
        distance_miles=route["distance"] / METERS_PER_MILE,
        duration_hours=route["duration"] / 3600.0,
        geometry=geometry,
        legs=legs,
    )
