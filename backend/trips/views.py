from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import PlanTripSerializer
from .services.geocode import GeocodingError, geocode
from .services.hos import simulate_trip
from .services.routing import RoutingError, get_route


class PlanTripView(APIView):
    """Plan a trip: geocode -> route -> HOS simulation -> logs."""

    def post(self, request):
        serializer = PlanTripSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            current = geocode(data["current_location"])
            pickup = geocode(data["pickup_location"])
            dropoff = geocode(data["dropoff_location"])
        except GeocodingError as exc:
            return Response(
                {"error": str(exc)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )

        try:
            route = get_route([current, pickup, dropoff])
        except RoutingError as exc:
            return Response(
                {"error": str(exc)}, status=status.HTTP_502_BAD_GATEWAY
            )

        legs = [
            {"distance_miles": leg.distance_miles, "duration_hours": leg.duration_hours}
            for leg in route.legs
        ]
        # OSRM returns one leg per segment between waypoints; ensure two legs.
        if len(legs) < 2:
            half_d = route.distance_miles / 2
            half_h = route.duration_hours / 2
            legs = [
                {"distance_miles": half_d, "duration_hours": half_h},
                {"distance_miles": half_d, "duration_hours": half_h},
            ]

        result = simulate_trip(
            legs=legs,
            geometry=route.geometry,
            total_miles=route.distance_miles,
            current_cycle_used=data["current_cycle_used"],
        )

        return Response(
            {
                "locations": {
                    "current": current.as_dict(),
                    "pickup": pickup.as_dict(),
                    "dropoff": dropoff.as_dict(),
                },
                "route": route.as_dict(),
                "stops": result["stops"],
                "daily_logs": result["daily_logs"],
                "summary": result["summary"],
            },
            status=status.HTTP_200_OK,
        )
