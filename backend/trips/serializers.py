from rest_framework import serializers


class PlanTripSerializer(serializers.Serializer):
    current_location = serializers.CharField(max_length=255)
    pickup_location = serializers.CharField(max_length=255)
    dropoff_location = serializers.CharField(max_length=255)
    current_cycle_used = serializers.FloatField(min_value=0, max_value=70)

    def validate_current_location(self, value):
        return value.strip()

    def validate_pickup_location(self, value):
        return value.strip()

    def validate_dropoff_location(self, value):
        return value.strip()
