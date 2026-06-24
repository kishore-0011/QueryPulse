from .table_creation_service import TableCreationService


TEMPLATES = {
    "ecommerce": {
        "users": [
            {"name": "id", "type": "BIGINT"},
            {"name": "email", "type": "VARCHAR(255)"},
            {"name": "first_name", "type": "VARCHAR(255)"},
            {"name": "last_name", "type": "VARCHAR(255)"},
            {"name": "created_at", "type": "TIMESTAMP"},
        ],
        "products": [
            {"name": "id", "type": "BIGINT"},
            {"name": "name", "type": "VARCHAR(255)"},
            {"name": "price", "type": "INTEGER"},
            {"name": "stock", "type": "INTEGER"},
            {"name": "created_at", "type": "TIMESTAMP"},
        ],
        "orders": [
            {"name": "id", "type": "BIGINT"},
            {"name": "user_id", "type": "BIGINT"},
            {"name": "total", "type": "INTEGER"},
            {"name": "status", "type": "VARCHAR(255)"},
            {"name": "created_at", "type": "TIMESTAMP"},
        ],
        "order_items": [
            {"name": "id", "type": "BIGINT"},
            {"name": "order_id", "type": "BIGINT"},
            {"name": "product_id", "type": "BIGINT"},
            {"name": "quantity", "type": "INTEGER"},
            {"name": "price", "type": "INTEGER"},
        ],
    },
    "crm": {
        "customers": [
            {"name": "id", "type": "BIGINT"},
            {"name": "email", "type": "VARCHAR(255)"},
            {"name": "name", "type": "VARCHAR(255)"},
            {"name": "phone", "type": "VARCHAR(255)"},
            {"name": "created_at", "type": "TIMESTAMP"},
        ],
        "leads": [
            {"name": "id", "type": "BIGINT"},
            {"name": "customer_id", "type": "BIGINT"},
            {"name": "source", "type": "VARCHAR(255)"},
            {"name": "status", "type": "VARCHAR(255)"},
            {"name": "created_at", "type": "TIMESTAMP"},
        ],
        "deals": [
            {"name": "id", "type": "BIGINT"},
            {"name": "lead_id", "type": "BIGINT"},
            {"name": "value", "type": "INTEGER"},
            {"name": "stage", "type": "VARCHAR(255)"},
            {"name": "closed_at", "type": "TIMESTAMP"},
        ],
        "campaigns": [
            {"name": "id", "type": "BIGINT"},
            {"name": "name", "type": "VARCHAR(255)"},
            {"name": "type", "type": "VARCHAR(255)"},
            {"name": "budget", "type": "INTEGER"},
            {"name": "start_date", "type": "DATE"},
            {"name": "end_date", "type": "DATE"},
        ],
    },
}


class EnvironmentTemplateService:
    def __init__(self, template: str):
        self.template = template

    def validate(self):
        if self.template not in TEMPLATES:
            raise ValueError(
                f"Unknown template '{self.template}'. "
                f"Supported: {list(TEMPLATES.keys())}"
            )

    def apply(self) -> list:
        self.validate()
        schema = TEMPLATES[self.template]
        tables_created = []

        for table_name, columns in schema.items():
            service = TableCreationService(table_name, columns)
            service.create(if_not_exists=True)
            tables_created.append(table_name)

        return tables_created
