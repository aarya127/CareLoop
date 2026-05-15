
from __future__ import annotations

import argparse
import os
from typing import Optional

import boto3
from botocore.client import Config


def get_s3_client() -> boto3.client:
    endpoint = os.getenv("STORAGE_ENDPOINT")
    region = os.getenv("STORAGE_REGION") or os.getenv("AWS_REGION")
    access_key = os.getenv("STORAGE_ACCESS_KEY_ID") or os.getenv("AWS_ACCESS_KEY_ID")
    secret_key = os.getenv("STORAGE_SECRET_ACCESS_KEY") or os.getenv("AWS_SECRET_ACCESS_KEY")

    kwargs = {}
    if region:
        kwargs["region_name"] = region
    if endpoint:
        kwargs["endpoint_url"] = endpoint
        # For S3-compatible endpoints (MinIO) path style may be required
        kwargs["config"] = Config(s3={'addressing_style': 'path'})
    if access_key and secret_key:
        kwargs["aws_access_key_id"] = access_key
        kwargs["aws_secret_access_key"] = secret_key

    return boto3.client("s3", **kwargs)


def bucket_name() -> str:
    return (
        os.getenv("STORAGE_BUCKET")
        or os.getenv("S3_BUCKET")
        or "careloop-383418748732-ca-central-1-an"
    )

def upload_bytes(key: str, data: bytes, content_type: Optional[str] = None) -> None:
    client = get_s3_client()
    kwargs = {"Bucket": bucket_name(), "Key": key, "Body": data}
    if content_type:
        kwargs["ContentType"] = content_type
    client.put_object(**kwargs)


def download_bytes(key: str) -> bytes:
    client = get_s3_client()
    resp = client.get_object(Bucket=bucket_name(), Key=key)
    return resp["Body"].read()


def generate_presigned_url(key: str, expires_in: int = 900, method: str = "get") -> str:
    client = get_s3_client()
    if method == "put":
        operation = "put_object"
    else:
        operation = "get_object"
    return client.generate_presigned_url(
        ClientMethod=operation,
        Params={"Bucket": bucket_name(), "Key": key},
        ExpiresIn=expires_in,
    )


def _cli() -> int:
    p = argparse.ArgumentParser(description="S3 helper")
    sub = p.add_subparsers(dest="cmd")

    
    up = sub.add_parser("upload")
    up.add_argument("--file", required=True)
    up.add_argument("--key", required=True)

    dl = sub.add_parser("download")
    dl.add_argument("--key", required=True)
    dl.add_argument("--out", required=True)

    ps = sub.add_parser("presign")
    ps.add_argument("--key", required=True)
    ps.add_argument("--expires", type=int, default=900)
    ps.add_argument("--method", choices=["get", "put"], default="get")

    args = p.parse_args()
    if args.cmd == "upload":
        with open(args.file, "rb") as fh:
            upload_bytes(args.key, fh.read())
        print(f"uploaded {args.file} -> s3://{bucket_name()}/{args.key}")
        return 0
    if args.cmd == "download":
        data = download_bytes(args.key)
        with open(args.out, "wb") as fh:
            fh.write(data)
        print(f"downloaded s3://{bucket_name()}/{args.key} -> {args.out}")
        return 0
    if args.cmd == "presign":
        url = generate_presigned_url(args.key, expires_in=args.expires, method=args.method)
        print(url)
        return 0

    p.print_help()
    return 2

if __name__ == "__main__":
    raise SystemExit(_cli())
