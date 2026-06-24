from zoneinfo import ZoneInfo

from faker import Faker
from django.db import connection


TYPE_MAP = {
    "character varying": "VARCHAR",
    "text": "TEXT",
    "integer": "INTEGER",
    "bigint": "BIGINT",
    "boolean": "BOOLEAN",
    "date": "DATE",
    "timestamp with time zone": "TIMESTAMP",
    "timestamp without time zone": "TIMESTAMP",
}


class DatasetGenerationService:
    SUPPORTED_DB_TYPES = set(TYPE_MAP.keys())
    SUPPORTED_GENERIC_TYPES = set(TYPE_MAP.values())

    def __init__(self, table_name: str):
        self.table_name = table_name
        self.columns = []

    def validate(self):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = %s
                ORDER BY ordinal_position
                """,
                [self.table_name],
            )
            self.columns = [
                {
                    "name": r[0],
                    "type": TYPE_MAP.get(r[1], r[1]),
                    "nullable": r[2] == "YES",
                }
                for r in cursor.fetchall()
            ]

        if not self.columns:
            raise ValueError(f"Table '{self.table_name}' not found in public schema.")

        unsupported = {
            c["name"]: c["type"]
            for c in self.columns
            if c["type"] not in self.SUPPORTED_GENERIC_TYPES
        }
        if unsupported:
            raise ValueError(
                f"Unsupported column types: {unsupported}. "
                f"Supported: {sorted(self.SUPPORTED_GENERIC_TYPES)}"
            )

    def _fake_value(self, fake: Faker, col_type: str, nullable: bool):
        if nullable and fake.boolean(chance_of_getting_true=15):
            return None

        if col_type in ("VARCHAR", "TEXT"):
            return fake.text(max_nb_chars=100).replace("\n", " ")
        elif col_type == "INTEGER":
            return fake.random_int(min=1, max=1000000)
        elif col_type == "BIGINT":
            return fake.random_int(min=1, max=10**12)
        elif col_type == "BOOLEAN":
            return fake.boolean()
        elif col_type == "DATE":
            return fake.date_this_decade()
        elif col_type == "TIMESTAMP":
            return fake.date_time_this_decade(tzinfo=ZoneInfo("UTC"))
        return None

    def _column_list(self) -> str:
        return ", ".join(f'"{c["name"]}"' for c in self.columns)

    def _placeholders(self) -> str:
        return ", ".join("%s" for _ in self.columns)

    def generate(self, rows: int) -> int:
        self.validate()
        fake = Faker()
        batch_size = min(rows, 5000)
        total_created = 0

        cols = self._column_list()
        placeholders = self._placeholders()
        sql = f'INSERT INTO "{self.table_name}" ({cols}) VALUES ({placeholders})'

        for i in range(0, rows, batch_size):
            batch_end = min(i + batch_size, rows)
            values_list = []
            for _ in range(batch_end - i):
                row = self.generate_row(fake)
                values_list.append(
                    tuple(row[c["name"]] for c in self.columns)
                )

            with connection.cursor() as cursor:
                cursor.executemany(sql, values_list)
                total_created += cursor.rowcount

        return total_created

    def generate_row(self, fake: Faker) -> dict:
        row = {}
        for col in self.columns:
            row[col["name"]] = self._fake_value(fake, col["type"], col["nullable"])
        return row
