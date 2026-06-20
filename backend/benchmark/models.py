from django.db import models


class Benchmark(models.Model):
    query = models.TextField()
    execution_time_ms = models.FloatField(null=True, blank=True)
    rows_returned = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, default="PENDING")
    created_at = models.DateTimeField(auto_now_add=True)


class QueryPlan(models.Model):
    benchmark = models.OneToOneField(
        Benchmark,
        on_delete=models.CASCADE,
        related_name="query_plan",
    )
    plan = models.JSONField()
    planning_time = models.FloatField()
    execution_time = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)


class Recommendation(models.Model):
    query_plan = models.ForeignKey(
        QueryPlan,
        on_delete=models.CASCADE,
        related_name="recommendations",
    )
    rule_type = models.CharField(max_length=50)
    severity = models.CharField(max_length=20)
    message = models.TextField()
    before_execution_time = models.FloatField(null=True, blank=True)
    after_execution_time = models.FloatField(null=True, blank=True)
    improvement_percent = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class TestUser(models.Model):
    email = models.EmailField()
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    created_at = models.DateTimeField()

    class Meta:
        db_table = "users"
