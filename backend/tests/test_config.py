def test_env_load():
    import backend.config
    assert backend.config.LLM_API_KEY is not None
