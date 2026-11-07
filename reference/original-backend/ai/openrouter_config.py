import os

DEFAULT_OPENROUTER_MODEL = "openai/gpt-4o-mini"


def get_openrouter_config() -> tuple[str | None, str]:
    """Retorna a única configuração OpenRouter compartilhada por todas as contas."""
    return os.getenv("OPENROUTER_API_KEY"), os.getenv("OPENROUTER_MODEL", DEFAULT_OPENROUTER_MODEL)

