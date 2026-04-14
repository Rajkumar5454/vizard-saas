from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    credits: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Clip Schemas ---
class ClipResponse(BaseModel):
    id: int
    video_id: int
    filename: str
    clip_url: Optional[str]
    title: Optional[str] = None
    duration: Optional[float] = None
    thumbnail_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Video Schemas ---
class VideoResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    original_url: Optional[str]
    status: str
    created_at: datetime
    clips: List[ClipResponse] = []

    class Config:
        from_attributes = True

# --- Transaction Schemas ---
class TransactionResponse(BaseModel):
    id: int
    user_id: int
    payment_id: str
    amount: int
    credits_added: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class GoogleLoginRequest(BaseModel):
    credential: str

class YoutubeUrlRequest(BaseModel):
    url: str
