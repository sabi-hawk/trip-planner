# Turn a place name into lat/lon. Tries Nominatim first, then Photon.
from __future__ import annotations

from dataclasses import dataclass

import requests
from django.conf import settings


class GeocodingError(Exception):
    pass


@dataclass
class GeocodedLocation:
    query: str
    name: str
    lat: float
    lon: float

    def as_dict(self) -> dict:
        return {
            "query": self.query,
            "name": self.name,
            "lat": self.lat,
            "lon": self.lon,
        }


def _headers() -> dict:
    return {"User-Agent": settings.GEO_USER_AGENT, "Accept": "application/json"}


def _geocode_nominatim(query: str, timeout: int) -> GeocodedLocation | None:
    params = {"q": query, "format": "json", "limit": 1, "addressdetails": 0}
    response = requests.get(
        settings.NOMINATIM_URL, params=params, headers=_headers(), timeout=timeout
    )
    response.raise_for_status()
    results = response.json()
    if not results:
        return None
    top = results[0]
    return GeocodedLocation(
        query=query,
        name=top.get("display_name", query),
        lat=float(top["lat"]),
        lon=float(top["lon"]),
    )


def _geocode_photon(query: str, timeout: int) -> GeocodedLocation | None:
    params = {"q": query, "limit": 1}
    response = requests.get(
        settings.PHOTON_URL, params=params, headers=_headers(), timeout=timeout
    )
    response.raise_for_status()
    data = response.json()
    features = data.get("features") or []
    if not features:
        return None
    top = features[0]
    coords = top["geometry"]["coordinates"]
    props = top.get("properties", {})
    name_parts = [
        props.get("name"),
        props.get("city"),
        props.get("state"),
        props.get("country"),
    ]
    name = ", ".join(p for p in name_parts if p) or query
    return GeocodedLocation(
        query=query, name=name, lat=float(coords[1]), lon=float(coords[0])
    )


def geocode(query: str, timeout: int = 15) -> GeocodedLocation:
    query = (query or "").strip()
    if not query:
        raise GeocodingError("Empty location provided.")

    errors = []
    for provider in (_geocode_nominatim, _geocode_photon):
        try:
            result = provider(query, timeout)
            if result is not None:
                return result
        except (requests.RequestException, ValueError, KeyError) as exc:
            errors.append(str(exc))
            continue

    if errors:
        raise GeocodingError(
            f"Could not resolve '{query}'. The geocoding service was unavailable."
        )
    raise GeocodingError(f"Could not find a location matching '{query}'.")
