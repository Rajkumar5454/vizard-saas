import subprocess
import os
import uuid
import json

# Headers that ffmpeg needs when reading from YouTube CDN URLs
YOUTUBE_HEADERS = (
    "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36\r\n"
    "Accept: */*\r\n"
    "Accept-Language: en-US,en;q=0.9\r\n"
)

def _is_url(path: str) -> bool:
    return path.startswith("http://") or path.startswith("https://")

def get_video_duration(video_path: str) -> float:
    command = [
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1"
    ]
    if _is_url(video_path):
        command += ["-headers", YOUTUBE_HEADERS]
    command.append(video_path)
    result = subprocess.run(command, capture_output=True, text=True, check=True)
    return float(result.stdout.strip())

def extract_audio(video_path: str) -> str:
    audio_path = f"/tmp/{uuid.uuid4()}.mp3"
    command = ["ffmpeg"]
    if _is_url(video_path):
        command += ["-headers", YOUTUBE_HEADERS]
    command += [
        "-i", video_path,
        "-vn", "-ar", "16000", "-ac", "1", "-b:a", "32k",
        audio_path, "-y"
    ]
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception(f"ffmpeg audio extract failed: {result.stderr[-500:]}")
    return audio_path

def cut_and_crop_segment(video_path: str, start_time: float, end_time: float, output_path: str):
    duration = end_time - start_time
    env = os.getenv("ENVIRONMENT", "development")
    
    # Use macOS hardware acceleration locally, but fallback to libx264 in Linux/cloud
    video_codec = "h264_videotoolbox" if env == "development" else "libx264"
    
    command = ["ffmpeg", "-y"]
    if _is_url(video_path):
        command += ["-headers", YOUTUBE_HEADERS]
    command += [
        "-ss", str(start_time),
        "-i", video_path,
        "-t", str(duration),
        "-vf", "crop=ih*9/16:ih,scale=1080:1920",
        "-c:v", video_codec,
        "-b:v", "2000k",
        "-c:a", "aac",
        "-b:a", "128k",
        output_path
    ]
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception(f"ffmpeg clip cut failed: {result.stderr[-500:]}")
    return output_path

def generate_thumbnail(video_path: str, output_path: str):
    command = ["ffmpeg"]
    if _is_url(video_path):
        command += ["-headers", YOUTUBE_HEADERS]
    command += [
        "-i", video_path,
        "-ss", "00:00:01",
        "-vframes", "1",
        output_path, "-y"
    ]
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Thumbnail generation failed (non-fatal): {result.stderr[-200:]}")
    return output_path
