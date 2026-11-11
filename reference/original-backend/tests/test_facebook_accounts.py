import asyncio
import pytest
from unittest.mock import AsyncMock, patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database.models.facebook_account import FacebookAccount
from api.facebook.accounts import (
    create_account,
    create_accounts_bulk,
    FacebookAccountCreate,
    FacebookBulkCreate,
)


@pytest.fixture
def db_session():
    # Remove Postgres-specific default for SQLite in-memory test
    orig_default = FacebookAccount.__table__.columns["created_at"].server_default
    FacebookAccount.__table__.columns["created_at"].server_default = None

    engine = create_engine("sqlite:///:memory:")
    FacebookAccount.__table__.create(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        FacebookAccount.__table__.columns["created_at"].server_default = orig_default


def test_create_accounts_bulk_calls_fetch_account_info(db_session):
    async def run():
        company_id = 1
        payload = FacebookBulkCreate(
            accounts=[
                {"label": "Fallback Name 1", "account_id": "123456"},
                {"label": "Fallback Name 2", "account_id": "act_789012"},
            ],
            access_token="fake_token",
            business_id="bm_999",
        )

        with patch("api.facebook.accounts._fetch_account_info", new_callable=AsyncMock) as mock_info:
            mock_info.return_value = ("Conta Real Meta", "USD")

            result = await create_accounts_bulk(payload=payload, db=db_session, company_id=company_id)

            assert len(result) == 2
            assert result[0].account_id == "act_123456"
            assert result[0].label == "Conta Real Meta"
            assert result[0].currency == "USD"
            assert result[0].company_id == 1
            assert result[0].token_valid is True

            assert result[1].account_id == "act_789012"
            assert result[1].currency == "USD"

    asyncio.run(run())


def test_create_account_single_and_update_if_exists(db_session):
    async def run():
        company_id = 1
        payload = FacebookAccountCreate(
            label="Minha Conta",
            account_id="111222",
            access_token="initial_token",
        )

        with patch("api.facebook.accounts._fetch_account_info", new_callable=AsyncMock) as mock_info:
            mock_info.return_value = ("Conta 1", "BRL")

            created = await create_account(payload=payload, db=db_session, company_id=company_id)
            assert created.account_id == "act_111222"
            assert created.label == "Conta 1"
            assert created.access_token == "initial_token"

            # Tentar adicionar a mesma conta com token atualizado
            payload_updated = FacebookAccountCreate(
                label="Minha Conta",
                account_id="act_111222",
                access_token="new_token",
                business_id="bm_123",
            )
            mock_info.return_value = ("Conta Atualizada", "BRL")
            updated = await create_account(payload=payload_updated, db=db_session, company_id=company_id)

            assert updated.id == created.id
            assert updated.access_token == "new_token"
            assert updated.business_id == "bm_123"
            assert updated.label == "Conta Atualizada"

    asyncio.run(run())


def test_multi_account_aggregation(db_session):
    from api.dashboard.meta_data import get_fb_accounts, fetch_meta_account_summary
    from integrations.meta_ads.schemas import AccountSummary

    # Create 2 active accounts for company 1 and 1 for company 2
    acc1 = FacebookAccount(
        company_id=1, label="Conta 1", account_id="act_111", access_token="tok1",
        currency="BRL", is_active=True, token_valid=True
    )
    acc2 = FacebookAccount(
        company_id=1, label="Conta 2", account_id="act_222", access_token="tok2",
        currency="BRL", is_active=True, token_valid=True
    )
    acc3 = FacebookAccount(
        company_id=2, label="Conta 3", account_id="act_333", access_token="tok3",
        currency="BRL", is_active=True, token_valid=True
    )
    db_session.add_all([acc1, acc2, acc3])
    db_session.commit()

    # Verify get_fb_accounts filters by company and active status
    company_accounts = get_fb_accounts(db_session, company_id=1)
    assert len(company_accounts) == 2
    assert {a.account_id for a in company_accounts} == {"act_111", "act_222"}

    async def run():
        summary1 = AccountSummary(
            spend=100.0, impressions=1000, clicks=50, cpc=2.0, cpm=100.0, ctr=5.0,
            landing_page_views=30, cost_per_landing_page_view=3.33,
            initiate_checkout=10, cost_per_initiate_checkout=10.0
        )
        summary2 = AccountSummary(
            spend=200.0, impressions=2000, clicks=100, cpc=2.0, cpm=100.0, ctr=5.0,
            landing_page_views=60, cost_per_landing_page_view=3.33,
            initiate_checkout=20, cost_per_initiate_checkout=10.0
        )

        with patch("api.dashboard.meta_data.MetaAdsService") as MockService:
            instance = MockService.return_value
            # Return summary1 then summary2
            instance.get_account_summary = AsyncMock(side_effect=[summary1, summary2])
            instance.close = AsyncMock()

            combined, err = await fetch_meta_account_summary(db_session, "2026-11-01", "2026-11-08", company_id=1)
            assert err is None
            assert combined is not None
            assert combined.spend == 300.0
            assert combined.impressions == 3000
            assert combined.clicks == 150
            assert combined.landing_page_views == 90
            assert combined.initiate_checkout == 30

    asyncio.run(run())
