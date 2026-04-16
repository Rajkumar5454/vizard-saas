from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
import uuid
import shutil

import models, schemas, auth
from database import get_db
from worker import process_video_task_sync, process_youtube_video_task_sync
from services.storage_service import upload_file, delete_local_file

router = APIRouter(
    prefix="/videos",
    tags=["Videos"]
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=schemas.VideoResponse)
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(get_db)
):
    if current_user.credits < 3:
        raise HTTPException(status_code=400, detail="Not enough credits. Please buy more.")
        
    try:
        # Save file locally first
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Upload to Cloud Storage (if configured)
        final_url = upload_file(file_path, unique_filename)
        if final_url != file_path:
            delete_local_file(file_path)
            
        # Create Video record
        new_video = models.Video(
            user_id=current_user.id,
            filename=file.filename,
            original_url=final_url,
            status="processing"
        )
        db.add(new_video)
        
        # Deduct credits
        current_user.credits -= 3
        db.add(current_user)
        
        db.commit()
        db.refresh(new_video)
        
        # Trigger Background Task
        background_tasks.add_task(process_video_task_sync, new_video.id)
        
        return new_video
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=list[schemas.VideoResponse])
def get_user_videos(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    videos = db.query(models.Video).filter(models.Video.user_id == current_user.id).order_by(models.Video.created_at.desc()).all()
    return videos

@router.get("/debug/test-yt")
def test_yt_dlp(url: str):
    """Debug endpoint to test if yt-dlp can download from this server"""
    import yt_dlp, subprocess, traceback, uuid
    from services import video_service
    results = {}
    
    # Test 1: Check if ffmpeg is available
    try:
        r = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True)
        results["ffmpeg"] = "OK: " + r.stdout.split("\n")[0]
    except Exception as e:
        results["ffmpeg"] = f"MISSING: {e}"
    
    # Test 2: Try yt-dlp extract_info (no download) and get stream URL
    stream_url = None
    try:
        ydl_opts = {
            'format': 'best',
            'quiet': True, 'no_warnings': True,
            'extractor_args': {
                'youtube': {
                    'player_client': ['tvhtml5', 'android', 'ios'],
                    'player_skip': ['web', 'web_embedded']
                }
            },
            'nocheckcertificate': True,
        }
        
        # Support cookies in debug test as well
        cookie_path = "/tmp/youtube_cookies_test.txt"
        yt_cookies = os.getenv("YOUTUBE_COOKIES")
        
        fallback_cookies = """# Netscape HTTP Cookie File
# https://curl.haxx.se/rfc/cookie_spec.html
# This is a generated file! Do not edit.

.youtube.com	TRUE	/	TRUE	1810867273	PREF	f7=4100&tz=Asia.Calcutta&f4=4000000&f5=20000
.youtube.com	TRUE	/	FALSE	1810702130	HSID	A-MJPlj0XkzR8elao
.youtube.com	TRUE	/	TRUE	1810702130	SSID	ADMwzCUpM60zZPoGn
.youtube.com	TRUE	/	FALSE	1810702130	APISID	SWx9IVEJNsr2i1Sp/AIab99c7mqKFBUdXa
.youtube.com	TRUE	/	TRUE	1810702130	SAPISID	5f1McSTlL3MLOpeZ/ABtExFC7uTr_um7LC
.youtube.com	TRUE	/	TRUE	1810702130	__Secure-1PAPISID	5f1McSTlL3MLOpeZ/ABtExFC7uTr_um7LC
.youtube.com	TRUE	/	TRUE	1810702130	__Secure-3PAPISID	5f1McSTlL3MLOpeZ/ABtExFC7uTr_um7LC
.youtube.com	TRUE	/	TRUE	1804004021	LOGIN_INFO	AFmmF2swRQIgKa1uVgscKNScRhrVLPQZOn6rKAu4XgoDPs7txShKCNICIQDJpXKvmN9kD76cYJ2GDLVrtkhuNljCPX4yF4fKO4JPWQ:QUQ3MjNmemtkb2gwMkd4b1VoTV9nZUJrM0lUcUtzRW9WempubjBOQXhvb2I1TEFvai1qTm5aS1Qxc0I4WDBWLVMzUEdmaGRmRzVjbEhoQWROMzYtU2hKZmcyLXBVS1JndmdLVjBCSGhKUWJfUHptWWRIMDhETHdRTUtDRHJzZFdaWGZoQmVwZDZHUVJBZkYzTGNRYUNmMmpQMVBIVm8ydy1n
.youtube.com	TRUE	/	TRUE	1791181295	__Secure-BUCKET	CJcF
.youtube.com	TRUE	/	FALSE	1810702130	SID	g.a0008QhZAXHbBslmRVorZCwDd2dPZgnjvQr7isjaorMEnRfUwvKiEId9l4GawalFmlRjetPL3gACgYKASESARISFQHGX2MiruPdUS1yUFaBh4zqrIVpDBoVAUF8yKqGtNTHdgldxvpg8KjEJT1J0076
.youtube.com	TRUE	/	TRUE	1810702130	__Secure-1PSID	g.a0008QhZAXHbBslmRVorZCwDd2dPZgnjvQr7isjaorMEnRfUwvKi5DlI_TkG-ENjeLdnLstx4gACgYKAeUSARISFQHGX2MiHGqDVlcrJo4Yf5TsudcJ5hoVAUF8yKrqJ9GXv8RnED9LBcwBOodP0076
.youtube.com	TRUE	/	TRUE	1810702130	__Secure-3PSID	g.a0008QhZAXHbBslmRVorZCwDd2dPZgnjvQr7isjaorMEnRfUwvKijAteYFL5nCvl27XpdHOAOAACgYKAW4SARISFQHGX2Miyn1HjRWw5Z-3U0oUmKCTORoVAUF8yKr03KiHitUYNfmhpO1sH_p60076
.youtube.com	TRUE	/	TRUE	1807843497	__Secure-1PSIDTS	sidts-CjQBWhotCQDjeLp-FBqz-_APmwXG6jgZN9rGaOdWFxpxL2BKmp3Rsd_q64k4v_4V-8RXQ0f2EAA
.youtube.com	TRUE	/	TRUE	1807843497	__Secure-3PSIDTS	sidts-CjQBWhotCQDjeLp-FBqz-_APmwXG6jgZN9rGaOdWFxpxL2BKmp3Rsd_q64k4v_4V-8RXQ0f2EAA
.youtube.com	TRUE	/	FALSE	1807843497	SIDCC	AKEyXzVnFfa-UutHHGcwkXKm3FTCiBCLeAnk1cQMxMmK7t66y9Z8eL3X6D1DoIeLE-N9X-A5JHuu
.youtube.com	TRUE	/	TRUE	1807843497	__Secure-1PSIDCC	AKEyXzVPBYRArbBFfiW6_H3cQvjPfBHf6zPV9iH6jZwsVhxm_0gvZxAMRBO1Og4IdsM7pSzLBQw
.youtube.com	TRUE	/	TRUE	1807843497	__Secure-3PSIDCC	AKEyXzVUTqNAABxBJP2u3sRcEq3I7RwWbtJ4VgkYqkFCwa6pUiCDKr7YsXwa0y_VCUZLPw2gMN6j
.youtube.com	TRUE	/	TRUE	1791859270	VISITOR_INFO1_LIVE	rqzXJvd7FNo
.youtube.com	TRUE	/	TRUE	1791859270	VISITOR_PRIVACY_METADATA	CgJJThIEGgAgYQ%3D%3D
.youtube.com	TRUE	/	TRUE	0	YSC	hFFVpPJaQac
.youtube.com	TRUE	/	TRUE	1791859189	__Secure-ROLLOUT_TOKEN	CI3Arvfiz4-_CxDqhK6N7s6KAxj5o6P4q_GTAw%3D%3D
"""
        with open(cookie_path, "w") as f:
            if yt_cookies and "# Netscape HTTP Cookie File" in yt_cookies:
                f.write(yt_cookies)
            else:
                f.write(fallback_cookies)
        ydl_opts['cookiefile'] = cookie_path
            
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
        
        formats = info.get('formats', [])
        for fmt in reversed(formats):
            if (fmt.get('ext') == 'mp4' and 
                fmt.get('vcodec', 'none') != 'none' and 
                fmt.get('acodec', 'none') != 'none' and
                fmt.get('height', 0) and fmt.get('height', 0) <= 720):
                stream_url = fmt.get('url')
                break
        if not stream_url:
            stream_url = info.get('url') or (formats[-1].get('url') if formats else None)
        
        results["yt_dlp"] = f"OK: Found video '{info.get('title')}' duration={info.get('duration')}s stream_url={'found' if stream_url else 'NOT FOUND'}"
    except Exception as e:
        results["yt_dlp"] = f"FAILED: {traceback.format_exc()}"
    
    # Test 3: Try extracting audio from stream URL
    audio_path = None
    if stream_url:
        try:
            audio_path = video_service.extract_audio(stream_url)
            results["audio_extract"] = f"OK: audio saved to {audio_path}"
        except Exception as e:
            results["audio_extract"] = f"FAILED: {str(e)}"
    else:
        results["audio_extract"] = "SKIPPED: no stream URL"
    
    # Test 4: Try Groq transcription
    if audio_path:
        try:
            from services import ai_service
            transcript = ai_service.transcribe_audio(audio_path)
            if transcript:
                results["groq_transcribe"] = f"OK: Got {len(transcript)} chars of transcript"
            else:
                results["groq_transcribe"] = "FAILED: Empty transcript returned (Groq API key may be wrong or audio silent)"
        except Exception as e:
            results["groq_transcribe"] = f"FAILED: {str(e)}"
    else:
        results["groq_transcribe"] = "SKIPPED: no audio"
    
    return results

@router.get("/{video_id}", response_model=schemas.VideoResponse)
def get_video_status(video_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    video = db.query(models.Video).filter(models.Video.id == video_id, models.Video.user_id == current_user.id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video

@router.post("/youtube", response_model=schemas.VideoResponse)
def process_youtube_video(
    req: schemas.YoutubeUrlRequest,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(get_db)
):
    if current_user.credits < 3:
        raise HTTPException(status_code=400, detail="Not enough credits. Please buy more.")
        
    try:
        video_id_str = str(uuid.uuid4())
        file_path = os.path.join(UPLOAD_DIR, f"{video_id_str}.mp4")
        
        new_video = models.Video(
            user_id=current_user.id,
            filename="YouTube Video",
            original_url=file_path,
            status="pending"
        )
        db.add(new_video)
        
        current_user.credits -= 3
        db.add(current_user)
        
        db.commit()
        db.refresh(new_video)
        
        background_tasks.add_task(process_youtube_video_task_sync, new_video.id, req.url)
        
        return new_video
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{clip_id}")
async def download_clip(clip_id: int, db: Session = Depends(get_db)):
    clip = db.query(models.Clip).filter(models.Clip.id == clip_id).first()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")
    
    # If the URL is external (S3/R2), redirect the user to it
    if clip.clip_url.startswith("http://") or clip.clip_url.startswith("https://"):
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=clip.clip_url)
    
    if not os.path.exists(clip.clip_url):
        raise HTTPException(status_code=404, detail="File not found on server")
        
    return FileResponse(
        path=clip.clip_url,
        filename=os.path.basename(clip.clip_url),
        media_type='video/mp4'
    )

