from zoneinfo import ZoneInfo

from faker import Faker

from benchmark.models import TestUser


class DatasetGenerator:
    def generate_users(self, count: int) -> int:
        fake = Faker()
        batch_size = min(count, 5000)
        created = 0

        for i in range(0, count, batch_size):
            batch_end = min(i + batch_size, count)
            users = [
                TestUser(
                    email=fake.unique.email(),
                    first_name=fake.first_name(),
                    last_name=fake.last_name(),
                    created_at=fake.date_time_this_decade(tzinfo=ZoneInfo("UTC")),
                )
                for _ in range(batch_end - i)
            ]
            created += len(TestUser.objects.bulk_create(users))
            fake.unique.clear()

        return created
