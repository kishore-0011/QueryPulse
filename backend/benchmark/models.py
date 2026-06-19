from django.db import models


class Benchmark(models.Model):
    query = models.TextField()
    execution_time_ms = models.FloatField(null=True, blank=True)
    rows_returned = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, default="PENDING")
    created_at = models.DateTimeField(auto_now_add=True)
