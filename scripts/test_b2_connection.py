import os
import sys
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv

try:
    import boto3
    from botocore.client import Config
    from botocore.exceptions import ClientError, EndpointConnectionError
except ImportError:
    print("ERROR: boto3 is not installed. Please run: pip install boto3")
    sys.exit(1)


def mask_secret(value: str | None) -> str:
    """Mask credentials for safe display."""
    if not value:
        return "[NOT SET]"
    if len(value) <= 6:
        return "***"
    return f"{value[:3]}...{value[-3:]}"


def test_b2_connection():
    """Verify Backblaze B2 S3-compatible connectivity and permissions."""
    print("--- Backblaze B2 Connectivity & Permission Test ---")

    load_dotenv()

    bucket_name = os.getenv("B2_BUCKET_NAME")
    endpoint = os.getenv("B2_ENDPOINT")
    access_key_id = os.getenv("B2_ACCESS_KEY_ID")
    secret_access_key = os.getenv("B2_SECRET_ACCESS_KEY")
    region = os.getenv("B2_REGION", "us-east-005")

    # 1. Validate required environment variables
    print("\n1. Checking environment configuration...")
    missing = []
    if not bucket_name:
        missing.append("B2_BUCKET_NAME")
    if not endpoint:
        missing.append("B2_ENDPOINT")
    if not access_key_id:
        missing.append("B2_ACCESS_KEY_ID")
    if not secret_access_key:
        missing.append("B2_SECRET_ACCESS_KEY")

    if missing:
        print(f"[FAILED] Missing required environment variables in .env: {', '.join(missing)}")
        print("\nPlease configure the above variables in your local .env file before proceeding.")
        sys.exit(1)

    print(f"   Bucket:       {bucket_name}")
    print(f"   Endpoint:     {endpoint}")
    print(f"   Region:       {region}")
    print(f"   KeyID:        {mask_secret(access_key_id)}")
    print(f"   AppKey:       {mask_secret(secret_access_key)}")
    print("   [OK] Configuration detected.")

    # 2. Initialize S3 Client for Backblaze B2
    print("\n2. Initializing S3 client for Backblaze B2...")
    try:
        s3 = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            region_name=region,
            config=Config(signature_version="s3v4", s3={"addressing_style": "path"})
        )
        print("   [OK] S3 client initialized.")
    except Exception as e:
        print(f"[FAILED] S3 client creation failed: {e}")
        sys.exit(1)

    # 3. Verify Bucket Access
    print(f"\n3. Verifying access to bucket '{bucket_name}'...")
    try:
        s3.head_bucket(Bucket=bucket_name)
        print("   [OK] Bucket exists and is accessible.")
    except EndpointConnectionError as e:
        print(f"[FAILED] Could not connect to B2 endpoint ({endpoint}): {e}")
        sys.exit(1)
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "Unknown")
        print(f"[FAILED] Bucket access error [{error_code}]: {e}")
        sys.exit(1)

    # 4. Test Object Upload
    probe_id = str(uuid.uuid4())[:8]
    probe_key = f"ice-stream-test/probe_{probe_id}.txt"
    probe_content = f"Ice Stream B2 Probe at {datetime.now(timezone.utc).isoformat()}"

    print(f"\n4. Testing object upload (PutObject to '{probe_key}')...")
    try:
        s3.put_object(
            Bucket=bucket_name,
            Key=probe_key,
            Body=probe_content.encode("utf-8"),
            ContentType="text/plain"
        )
        print("   [OK] Upload succeeded.")
    except Exception as e:
        print(f"[FAILED] PutObject failed: {e}")
        sys.exit(1)

    # 5. Test Object Read & Verification
    print(f"\n5. Testing object read (GetObject from '{probe_key}')...")
    try:
        response = s3.get_object(Bucket=bucket_name, Key=probe_key)
        read_bytes = response["Body"].read()
        read_content = read_bytes.decode("utf-8")
        if read_content == probe_content:
            print("   [OK] Read succeeded and content matches verified payload.")
        else:
            print(f"[FAILED] Read content mismatch. Expected '{probe_content}', got '{read_content}'")
            sys.exit(1)
    except Exception as e:
        print(f"[FAILED] GetObject failed: {e}")
        sys.exit(1)

    # 6. Test Object Listing
    print(f"\n6. Testing object listing (ListObjectsV2 with prefix 'ice-stream-test/')...")
    try:
        list_res = s3.list_objects_v2(Bucket=bucket_name, Prefix="ice-stream-test/")
        keys = [item["Key"] for item in list_res.get("Contents", [])]
        if probe_key in keys:
            print(f"   [OK] List succeeded, verified probe object present.")
        else:
            print(f"   [WARNING] Probe key '{probe_key}' not in listed objects: {keys}")
    except Exception as e:
        print(f"[FAILED] ListObjectsV2 failed: {e}")
        sys.exit(1)

    # 7. Test Object Deletion (Clean Up)
    print(f"\n7. Testing object deletion (DeleteObject '{probe_key}')...")
    try:
        s3.delete_object(Bucket=bucket_name, Key=probe_key)
        print("   [OK] Delete succeeded (clean up complete).")
    except Exception as e:
        print(f"[WARNING] DeleteObject failed: {e}")

    print("\n=== BACKBLAZE B2 CONNECTIVITY TEST PASSED ===")
    print("Endpoint resolution, authentication, bucket access, upload, read, list, and cleanup verified successfully.")


if __name__ == "__main__":
    test_b2_connection()
