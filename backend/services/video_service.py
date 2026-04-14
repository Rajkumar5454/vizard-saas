import subprocess
import os
import uuid
import json

def get_video_duration(video_path: str) -> float:
    command = [
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", video_path
    ]
    result = subprocess.run(command, capture_output=True, text=True, check=True)
    return float(result.stdout.strip())

def extract_audio(video_path: str) -> str:
    audio_path = f"/tmp/{uuid.uuid4()}.mp3"
    command = [
        "ffmpeg", "-i", video_path,
        "-q:a", "0", "-map", "a",
        audio_path, "-y"
    ]
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return audio_path

def cut_and_crop_segment(video_path: str, start_time: float, end_time: float, output_path: str):
    # crop to center 9:16 ratio and then scale to high-quality 1080x1920 HD
    duration = end_time - start_time
    env = os.getenv("ENVIRONMENT", "development")
    
    # Use macOS hardware acceleration locally, but fallback to libx264 in Linux/cloud
    video_codec = "h264_videotoolbox" if env == "development" else "libx264"
    
    command = [
        "ffmpeg", "-y",
        "-ss", str(start_time),
        "-i", video_path,
        "-t", str(duration),
        "-vf", "crop=ih*9/16:ih,scale=1080:1920",
        "-c:v", video_codec,
        "-b:v", "4000k",         # High quality bitrate for 1080p
        "-c:a", "aac",
        "-b:a", "192k",
        output_path
    ]
    subprocess.run(command, check=True)
    return output_path

def generate_thumbnail(video_path: str, output_path: str):
    # Extract frame at 1 second mark (or middle of clip)
    command = [
        "ffmpeg", "-i", video_path,
        "-ss", "00:00:01",
        "-vframes", "1",
        output_path, "-y"
    ]
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return output_path

