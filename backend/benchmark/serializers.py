from rest_framework import serializers


class BenchmarkRequestSerializer(serializers.Serializer):
    query = serializers.CharField()

