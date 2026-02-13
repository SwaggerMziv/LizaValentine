"""S3 presigned URL generation using botocore."""

import botocore.session
from botocore.config import Config

from app.config import settings

_session = botocore.session.get_session()
_client = _session.create_client(
    "s3",
    region_name=settings.s3_region,
    endpoint_url=settings.s3_endpoint_url or None,
    aws_access_key_id=settings.s3_access_key,
    aws_secret_access_key=settings.s3_secret_key,
    config=Config(signature_version="s3v4"),
)


def generate_presigned_url(key: str, expires_in: int = 300) -> str:
    """Generate a presigned URL for an S3 object (default 5 min TTL)."""
    return _client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.s3_bucket, "Key": key},
        ExpiresIn=expires_in,
    )
