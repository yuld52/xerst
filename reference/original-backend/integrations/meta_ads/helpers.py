"""
Helpers para parsear dados de actions/action_values
retornados pela Meta Marketing API.
"""
from typing import Any
from datetime import datetime, timedelta


def extract_action_value(
    actions: list[dict[str, Any]] | None,
    action_type: str,
) -> float:
    """
    Extrai o value de um action_type específico da lista de actions.
    Ex: extract_action_value(actions, "landing_page_view") -> 3980.0
    """
    if not actions:
        return 0.0
    for action in actions:
        if action.get("action_type") == action_type:
            return float(action.get("value", 0))
    return 0.0


def safe_float(value: Any, default: float = 0.0) -> float:
    """Converte para float com segurança."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def safe_int(value: Any, default: int = 0) -> int:
    """Converte para int com segurança."""
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def calc_connect_rate(
    landing_page_views: int,
    clicks: int,
) -> float:
    """
    Taxa de conexão = LPV / Clicks * 100
    Indica % de clicks que realmente carregaram a landing page.
    """
    if clicks <= 0:
        return 0.0
    return round((landing_page_views / clicks) * 100, 1)


def calc_profit(revenue: float, spend: float) -> float:
    """Lucro simples = receita - investimento."""
    return round(revenue - spend, 2)


def clamp_meta_date(date_str: str) -> str:
    """
    Garante que date_start não ultrapasse 37 meses no passado (limite máximo da Meta Graph API).
    Evita o erro: 'The time_range start time cannot be more than 37 months in the past'.
    """
    if not date_str:
        return (datetime.now() - timedelta(days=1095)).strftime("%Y-%m-%d")
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        min_dt = datetime.now() - timedelta(days=1095)  # 3 anos (~36 meses)
        if dt < min_dt:
            return min_dt.strftime("%Y-%m-%d")
    except Exception:
        pass
    return date_str
