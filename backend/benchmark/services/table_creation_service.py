import re

from django.db import connection


COLUMN_TYPE_MAP = {
    "VARCHAR(255)": "VARCHAR(255)",
    "TEXT": "TEXT",
    "INTEGER": "INTEGER",
    "BIGINT": "BIGINT",
    "BOOLEAN": "BOOLEAN",
    "DATE": "DATE",
    "TIMESTAMP": "TIMESTAMP WITH TIME ZONE",
}

IDENTIFIER_RE = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_]*$")


class TableCreationService:
    def __init__(self, table_name: str, columns: list):
        self.table_name = table_name
        self.columns = columns

    def validate(self):
        if not self.table_name or not IDENTIFIER_RE.match(self.table_name):
            raise ValueError(
                "Invalid table name. Must start with a letter or underscore "
                "and contain only letters, digits, and underscores."
            )
        if not self.columns or len(self.columns) < 1:
            raise ValueError("At least one column is required.")

        seen = set()
        for col in self.columns:
            name = col.get("name", "")
            col_type = col.get("type", "")
            if not name or not IDENTIFIER_RE.match(name):
                raise ValueError(f"Invalid column name: '{name}'.")
            if name in seen:
                raise ValueError(f"Duplicate column name: '{name}'.")
            seen.add(name)
            if col_type not in COLUMN_TYPE_MAP:
                raise ValueError(
                    f"Unsupported column type: '{col_type}'. "
                    f"Supported: {list(COLUMN_TYPE_MAP.keys())}"
                )

    def create(self, if_not_exists=False) -> dict:
        self.validate()
        cols_sql = ", ".join(
            f'"{c["name"]}" {COLUMN_TYPE_MAP[c["type"]]}' for c in self.columns
        )
        exists_clause = " IF NOT EXISTS" if if_not_exists else ""
        sql = f'CREATE TABLE{exists_clause} "{self.table_name}" ({cols_sql})'

        with connection.cursor() as cursor:
            cursor.execute(sql)

        return {
            "table_name": self.table_name,
            "column_count": len(self.columns),
            "status": "SUCCESS",
        }
