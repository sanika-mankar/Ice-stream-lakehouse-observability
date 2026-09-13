import io
import json
import os
from pathlib import Path
import sqlite3
import sys

import boto3
from dotenv import load_dotenv
import pyarrow.parquet as pq

load_dotenv()

repo_root = Path(__file__).resolve().parent.parent


def verify_lakehouse():
    print("=" * 60)
    print("      ICE-STREAM LAKEHOUSE VERIFICATION (ICEBERG + B2)")
    print("=" * 60)

    bucket = os.getenv("B2_BUCKET_NAME", "ice-stream-lakehouse")
    endpoint = os.getenv("B2_ENDPOINT")
    access_key = os.getenv("B2_ACCESS_KEY_ID")
    secret_key = os.getenv("B2_SECRET_ACCESS_KEY")
    region = os.getenv("B2_REGION")

    # 1. Inspect Configurable SQLite Catalog
    db_env = os.getenv("ICEBERG_CATALOG_DB_PATH", "data/iceberg_catalog.db")
    db_path = Path(db_env).resolve()
    print(f"\n1. SQLite Catalog Database: {db_path}")
    if db_path.exists():
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        cursor.execute("SELECT catalog_name, table_namespace, table_name, metadata_location FROM iceberg_tables")
        rows = cursor.fetchall()
        for r in rows:
            print(f"   Table: {r[0]}.{r[1]}.{r[2]}")
            print(f"   Metadata Location: {r[3]}")
        conn.close()
    else:
        print(f"   [WARNING] SQLite catalog database not found at {db_path}")

    # 2. Inspect B2 Objects & Snapshots
    print(f"\n2. Connecting to Backblaze B2: {endpoint} (Bucket: {bucket})")
    s3 = boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region,
    )

    clean_table = os.getenv("ICEBERG_CLEAN_TABLE", "transactions_clean")
    dlq_table = os.getenv("ICEBERG_DLQ_TABLE", "transactions_dlq")

    for table_name in [clean_table, dlq_table]:
        print(f"\n--- Inspecting Table: ice_stream.{table_name} ---")
        prefix = f"warehouse/ice_stream/{table_name}/"
        resp = s3.list_objects_v2(Bucket=bucket, Prefix=prefix)
        contents = resp.get("Contents", [])

        metadata_files = [c for c in contents if "/metadata/" in c["Key"] and c["Key"].endswith(".metadata.json")]
        manifest_files = [c for c in contents if c["Key"].endswith(".avro")]
        data_files = [c for c in contents if "/data/" in c["Key"] and c["Key"].endswith(".parquet")]

        print(f"   Metadata files: {len(metadata_files)}")
        print(f"   Manifest files: {len(manifest_files)}")
        print(f"   Parquet data files: {len(data_files)}")

        # Print latest metadata snapshot info
        if metadata_files:
            latest_meta = sorted(metadata_files, key=lambda x: x["LastModified"])[-1]
            print(f"   Latest Metadata: {latest_meta['Key']}")
            meta_obj = s3.get_object(Bucket=bucket, Key=latest_meta["Key"])
            meta_data = json.loads(meta_obj["Body"].read().decode("utf-8"))
            snapshots = meta_data.get("snapshots", [])
            print(f"   Total Snapshots: {len(snapshots)}")
            if snapshots:
                latest_snap = snapshots[-1]
                print(f"   Current Snapshot ID: {latest_snap.get('snapshot-id')}")
                print(f"   Timestamp: {latest_snap.get('timestamp-ms')}")
                print(f"   Summary: {json.dumps(latest_snap.get('summary', {}), indent=6)}")

        # Read latest Parquet sample for schema verification (read up to 3 latest files)
        sample_files = sorted(data_files, key=lambda x: x["LastModified"])[-3:] if data_files else []
        for df in sample_files:
            print(f"\n   Inspecting Parquet data file: {df['Key']} ({df['Size']} bytes)")
            p_obj = s3.get_object(Bucket=bucket, Key=df["Key"])
            buffer = io.BytesIO(p_obj["Body"].read())
            table = pq.read_table(buffer)
            print(f"   File Rows: {table.num_rows}, Columns: {len(table.column_names)}")
            print(f"   Schema:\n{table.schema}")
            print(f"   Sample Record:\n{table.to_pandas().head(2).to_string()}")

    print("\n" + "=" * 60)
    print("             VERIFICATION COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    verify_lakehouse()
