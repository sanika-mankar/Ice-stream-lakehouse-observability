"""Unit tests for Iceberg catalog configuration and DDL generation."""

from app.storage.iceberg import IcebergConfig


def test_iceberg_config_defaults():
    config = IcebergConfig()
    assert config.catalog_name == "ice_stream_catalog"
    assert config.database_name == "ice_stream"
    assert config.clean_table_name == "transactions_clean"
    assert config.dlq_table_name == "transactions_dlq"


def test_catalog_sql_generation():
    config = IcebergConfig(
        catalog_name="test_cat",
        endpoint="https://s3.example.com",
        access_key_id="test_key",
        secret_access_key="test_secret",
    )
    sql = config.get_create_catalog_sql()
    assert "CREATE CATALOG test_cat WITH" in sql
    assert "'io-impl'='org.apache.iceberg.aws.s3.S3FileIO'" in sql
    assert "'s3.endpoint'='https://s3.example.com'" in sql


def test_clean_table_sql_generation():
    config = IcebergConfig(catalog_name="cat", database_name="db", clean_table_name="clean")
    sql = config.get_create_clean_table_sql()
    assert "CREATE TABLE IF NOT EXISTS cat.db.clean" in sql
    assert "event_id         STRING NOT NULL" in sql
    assert "'format-version' = '2'" in sql


def test_dlq_table_sql_generation():
    config = IcebergConfig(catalog_name="cat", database_name="db", dlq_table_name="dlq")
    sql = config.get_create_dlq_table_sql()
    assert "CREATE TABLE IF NOT EXISTS cat.db.dlq" in sql
    assert "failure_category  STRING NOT NULL" in sql
    assert "failed_rules      ARRAY<STRING>" in sql
