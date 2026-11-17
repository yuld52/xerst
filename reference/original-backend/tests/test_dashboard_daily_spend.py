import asyncio
from datetime import date
from types import SimpleNamespace

from api.dashboard.aggregations import _daily_revenue
from database.models.customer import Customer
from database.models.product import Product
from database.models.transaction import Transaction
from integrations.meta_ads.account import fetch_daily_spend


def test_daily_revenue_uses_actual_meta_spend_and_includes_empty_days():
    class FakeQuery:
        def filter(self, *_args):
            return self

        def with_entities(self, *_args):
            return self

        def group_by(self, *_args):
            return self

        def order_by(self, *_args):
            return self

        def all(self):
            return [
                SimpleNamespace(day=date(2026, 1, 1), revenue=100, sales=1),
                SimpleNamespace(day=date(2026, 1, 3), revenue=300, sales=1),
            ]

    result = _daily_revenue(
        FakeQuery(), None,
        {"2026-01-01": 20, "2026-01-02": 10, "2026-01-03": 50},
        "2026-01-01", "2026-01-03",
    )

    assert result == [
        {"date": "2026-01-01", "revenue": 100.0, "spend": 20.0, "profit": 80.0, "sales": 1},
        {"date": "2026-01-02", "revenue": 0.0, "spend": 10.0, "profit": -10.0, "sales": 0},
        {"date": "2026-01-03", "revenue": 300.0, "spend": 50.0, "profit": 250.0, "sales": 1},
    ]


def test_meta_daily_spend_reads_time_increment_rows():
    class FakeMetaClient:
        account_id = "act_123"

        async def _get_all_pages(self, endpoint, params):
            assert endpoint == "act_123/insights"
            assert params["time_increment"] == 1
            return [
                {"date_start": "2026-01-01", "spend": "12.34"},
                {"date_start": "2026-01-02", "spend": "56.78"},
            ]

    result = asyncio.run(fetch_daily_spend(FakeMetaClient(), "2026-01-01", "2026-01-02"))
    assert result == {"2026-01-01": 12.34, "2026-01-02": 56.78}


def test_unique_identifiers_are_scoped_to_company():
    assert not Customer.email.property.columns[0].unique
    assert not Product.name.property.columns[0].unique
    assert not Transaction.external_id.property.columns[0].unique

    unique_sets = {
        table.name: {
            tuple(column.name for column in constraint.columns)
            for constraint in table.constraints
            if constraint.__class__.__name__ == "UniqueConstraint"
        }
        for table in (Customer.__table__, Product.__table__, Transaction.__table__)
    }
    assert ("company_id", "email") in unique_sets["customers"]
    assert ("company_id", "name") in unique_sets["products"]
    assert ("company_id", "external_id") in unique_sets["transactions"]
