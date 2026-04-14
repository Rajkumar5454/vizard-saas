from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Float
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    credits = Column(Integer, default=5)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    videos = relationship("Video", back_populates="owner")
    transactions = relationship("Transaction", back_populates="user")

class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String)
    original_url = Column(String, nullable=True) # S3 URL or local path
    status = Column(String, default="processing") # processing, completed, failed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="videos")
    clips = relationship("Clip", back_populates="video")

class Clip(Base):
    __tablename__ = "clips"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"))
    filename = Column(String)
    clip_url = Column(String, nullable=True)
    title = Column(String, nullable=True)
    duration = Column(Float, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    video = relationship("Video", back_populates="clips")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    payment_id = Column(String, unique=True, index=True) # Razorpay payment ID
    amount = Column(Integer) # in cents/paise
    credits_added = Column(Integer)
    status = Column(String, default="success")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="transactions")
