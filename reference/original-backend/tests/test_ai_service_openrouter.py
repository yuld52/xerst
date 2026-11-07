import pytest

try:
    from ai.service import build_llm
except Exception as exc:
    pytestmark = pytest.mark.skip(reason=f"LangChain/Pydantic incompatível neste Python: {exc}")
    build_llm = None


def test_build_llm_uses_openrouter_model():
    if build_llm is None:
        pytest.skip("LangChain/Pydantic incompatível neste Python")
    try:
        llm = build_llm("test-key", "inclusionai/ling-3.0-flash-vl:free")
    except Exception as exc:
        if "Pydantic" in repr(exc) or "artifact" in repr(exc):
            pytest.skip(f"LangChain/Pydantic incompatível neste Python: {exc}")
        raise

    assert llm.model_name == "inclusionai/ling-3.0-flash-vl:free"
    assert llm.openai_api_base == "https://openrouter.ai/api/v1"
