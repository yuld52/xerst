from datetime import date, datetime


def normalize_rule_frequency(_value: str | None) -> str:
    """Hobby supports one scheduled rule evaluation per day."""
    return "daily"


def normalize_report_hours(hours: dict[str, bool] | None) -> dict[str, bool]:
    """Keep old multi-hour preferences as a single daily on/off setting."""
    return {"08:00": any((hours or {}).values())}


def rule_was_checked_today(last_checked_at: datetime | None, today: date) -> bool:
    """Use local calendar date because Hobby cron invocations have hour-level jitter."""
    return last_checked_at is not None and last_checked_at.date() == today
