import base64
from typing import Optional


def pdf_to_base64(file_bytes: bytes) -> str:
    """Convert PDF bytes to base64 string for Claude API."""
    return base64.standard_b64encode(file_bytes).decode("utf-8")
