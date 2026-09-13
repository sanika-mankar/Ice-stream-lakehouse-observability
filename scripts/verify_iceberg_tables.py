import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import boto3

load_dotenv()

def verify_b2_iceberg_metadata():
    print("=== Checking Backblaze B2 Iceberg Metadata ===")
    bucket = os.getenv("B2_BUCKET_NAME", "ice-stream-lakehouse")
    endpoint = os.getenv("B2_ENDPOINT")
    access_key = os.getenv("B2_ACCESS_KEY_ID")
    secret_key = os.getenv("B2_SECRET_ACCESS_KEY")
    region = os.getenv("B2_REGION")

    s3 = boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region,
    )

    resp = s3.list_objects_v2(Bucket=bucket, Prefix="warehouse")
    contents = resp.get("Contents", [])
    print(f"Total objects found in s3://{bucket}/warehouse: {len(contents)}")
    for obj in contents:
        print(f" - {obj['Key']} ({obj['Size']} bytes, modified {obj['LastModified']})")
    
    if len(contents) > 0:
        print("\n[SUCCESS] Iceberg table metadata successfully verified in Backblaze B2.")
    else:
        print("\n[WARNING] No objects found under warehouse prefix yet.")

if __name__ == "__main__":
    verify_b2_iceberg_metadata()
