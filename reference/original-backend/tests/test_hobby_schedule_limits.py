from services.hobby_schedule import normalize_report_hours, normalize_rule_frequency, rule_was_checked_today
from datetime import date, datetime


def test_campaign_rules_are_normalized_to_one_daily_run():
    assert normalize_rule_frequency("15m") == "daily"
    assert normalize_rule_frequency("30m") == "daily"
    assert normalize_rule_frequency("daily") == "daily"


def test_legacy_report_times_collapse_to_one_daily_hobby_schedule():
    assert normalize_report_hours({"08:00": False, "12:00": True, "18:00": True}) == {"08:00": True}
    assert normalize_report_hours({"08:00": False, "12:00": False}) == {"08:00": False}


def test_rule_run_guard_is_daily_and_uses_maputo_calendar_date():
    assert rule_was_checked_today(datetime(2026, 11, 17, 8), date(2026, 11, 17))
    assert not rule_was_checked_today(datetime(2026, 11, 16, 8), date(2026, 11, 17))
    assert not rule_was_checked_today(None, date(2026, 11, 17))
