import os
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()

# We configure to use Cloudflare R2 by default, or AWS S3 if endpoint is not provided
S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL") # e.g. https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "vizard-bucket")
S3_REGION = os.getenv("S3_REGION", "auto")

def get_s3_client():
    if not S3_ACCESS_KEY or not S3_SECRET_KEY:
        return None
    return boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT_URL,
        aws_access_key_id=S3_ACCESS_KEY,
        aws_secret_access_key=S3_SECRET_KEY,
        region_name=S3_REGION
    )

def upload_file(local_file_path: str, destination_name: str) -> str:
    """
    Uploads a file to S3/Cloudflare R2 and returns the public URL.
    Falls back to a local path if S3 isn't configured.
    """
    s3_client = get_s3_client()
    
    # Fallback if no cloud credentials
    if not s3_client:
        return local_file_path

    try:
        s3_client.upload_file(
            local_file_path,
            S3_BUCKET_NAME,
            destination_name,
            # In production, you might want to make the file public read if not using presigned URLs
            # ExtraArgs={'ACL': 'public-read'} # Cloudflare R2 handles this differently, usually via custom domains
        )
        # Construct the public URL or presigned URL
        # For simplicity, if S3_PUBLIC_DOMAIN is provided, use it (e.g. for R2 custom domains)
        public_domain = os.getenv("S3_PUBLIC_DOMAIN")
        if public_domain:
            return f"https://{public_domain}/{destination_name}"
        else:
            # Generate a presigned URL valid for 1 hour if no public domain is set
            return s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': S3_BUCKET_NAME, 'Key': destination_name},
                ExpiresIn=3600
            )

    except ClientError as e:
        print(f"Error uploading to S3: {e}")
        return local_file_path

def delete_local_file(filepath: str):
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
    except Exception as e:
        print(f"Failed to delete {filepath}: {e}")
