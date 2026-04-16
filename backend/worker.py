import os
# Fix for macOS fork safety issues
os.environ["OBJC_DISABLE_INITIALIZE_FORK_SAFETY"] = "YES"

from dotenv import load_dotenv
load_dotenv(override=True)

from sqlalchemy.orm import Session
from database import SessionLocal
import models
from services import video_service, ai_service
from services.storage_service import upload_file, delete_local_file

def _execute_video_pipeline(video_id: int):
    # Get DB session
    db = SessionLocal()
    video = db.query(models.Video).filter(models.Video.id == video_id).first()
    
    if not video:
        db.close()
        return "Video not found"
        
    try:
        # 1. Extract audio
        audio_path = video_service.extract_audio(video.original_url)

        # 2. Transcribe
        transcript = ai_service.transcribe_audio(audio_path)
        
        # Get video duration for accurate clipping
        total_duration = video_service.get_video_duration(video.original_url)

        # 3. Detect clips
        clips_ideas = ai_service.detect_viral_segments(transcript, total_duration)
        
        if not clips_ideas:
            video.status = "failed"
            db.commit()
            db.close()
            return "No clips detected"

        # 4. Generate clips sequentially to avoid race conditions with the UI
        for idea in clips_ideas:
            generate_clip_task_sync(video_id, video.original_url, idea.model_dump())
            
        video.status = "completed"
        db.commit()
        
        return f"Started processing {len(clips_ideas)} clips"
        
    except Exception as e:
        import traceback
        err = traceback.format_exc()
        print(f"Error processing video {video_id}: {err}")
        import os
        os.makedirs("uploads", exist_ok=True)
        with open("uploads/error.log", "a") as f:
            f.write(f"\n--- PIPELINE ERROR ---\n{err}\n")
        video.status = "failed"
        db.commit()
    finally:
        db.close()

def generate_clip_task_sync(video_id: int, original_url: str, idea_dict: dict):
    db = SessionLocal()
    try:
        # Reconstruct idea from dict
        from services.ai_service import ClipIdea
        idea = ClipIdea(**idea_dict)
        
        # SAFEGUARD: If the AI hallucinates a clip shorter than 15 seconds, extend it.
        if idea.end_time - idea.start_time < 15:
            idea.end_time = idea.start_time + 15.0
            idea.duration = 15.0
            
        import re
        safe_title = re.sub(r'[^a-zA-Z0-9_\-]', '', idea.title.replace(' ', '_'))
        output_filename = f"{video_id}_{safe_title}.mp4"
        output_dir = "uploads"
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, output_filename)
        
        # Execute clipping with hardware acceleration
        video_service.cut_and_crop_segment(
            original_url, 
            idea.start_time, 
            idea.end_time, 
            output_path
        )
        
        # Generate thumbnail
        thumb_filename = f"{video_id}_{safe_title}_thumb.jpg"
        thumb_path = os.path.join(output_dir, thumb_filename)
        try:
            video_service.generate_thumbnail(output_path, thumb_path)
        except Exception as thumb_err:
            print(f"Error generating thumbnail for {idea.title}: {thumb_err}")
            thumb_path = None

        # Upload clip and thumbnail to S3/Cloud Storage
        final_clip_url = upload_file(output_path, output_filename)
        final_thumb_url = thumb_path
        if thumb_path:
            final_thumb_url = upload_file(thumb_path, thumb_filename)
            if final_thumb_url != thumb_path:
                delete_local_file(thumb_path)
                
        if final_clip_url != output_path:
            delete_local_file(output_path)

        # Save clip to DB
        new_clip = models.Clip(
            video_id=video_id,
            filename=output_filename,
            clip_url=final_clip_url,
            thumbnail_url=final_thumb_url,
            title=idea.title,
            duration=idea.duration
        )
        db.add(new_clip)
        db.commit()
        return f"Clip {idea.title} generated"
    except Exception as e:
        import traceback
        err_msg = traceback.format_exc()
        print(f"Error in generate_clip_task for {idea_dict.get('title')}: {err_msg}")
        
        # Write error to a public file so we can debug from the frontend
        with open("uploads/error.log", "a") as f:
            f.write(f"\n--- ERROR ---\n{err_msg}\n")
            
        return str(e)
    finally:
        db.close()

def process_video_task_sync(video_id: int):
    return _execute_video_pipeline(video_id)

def process_youtube_video_task_sync(video_id: int, yt_url: str):
    import os
    import yt_dlp
    db = SessionLocal()
    video = db.query(models.Video).filter(models.Video.id == video_id).first()
    if not video:
        db.close()
        return "Video not found"
        
    try:
        video.status = "downloading"
        db.commit()

        # Step 1: Get the DIRECT stream URL from YouTube (NO download, just metadata)
        # Step 1: Get the DIRECT stream URL from YouTube (NO download, just metadata)
        ydl_opts = {
            'format': 'best',
            'quiet': True,
            'no_warnings': True,
            'extractor_args': {
                'youtube': {
                    'player_client': ['tvhtml5', 'android', 'ios'],
                    'player_skip': ['web', 'web_embedded']
                }
            },
            'nocheckcertificate': True,
        }
        
        # FINAL WEAPON: If the user provides cookies via env var, use them.
        cookie_path = "/tmp/youtube_cookies.txt"
        yt_cookies = os.getenv("YOUTUBE_COOKIES")
        
        # Hardcoded fallback from the user's provided cookies in case Render mangles the multiline env var
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
            info = ydl.extract_info(yt_url, download=False)
        
        # Find a single-file stream URL (video+audio combined) to avoid costly merging
        stream_url = None
        formats = info.get('formats', [])
        
        # Prefer combined mp4 format (no merging needed)
        for fmt in reversed(formats):
            if (fmt.get('ext') == 'mp4' and 
                fmt.get('vcodec', 'none') != 'none' and 
                fmt.get('acodec', 'none') != 'none' and
                fmt.get('height', 0) and fmt.get('height', 0) <= 720):
                stream_url = fmt.get('url')
                break
        
        # Fallback: use any available URL
        if not stream_url:
            stream_url = info.get('url')
        if not stream_url and formats:
            stream_url = formats[-1].get('url')
            
        if not stream_url:
            raise Exception("Could not get stream URL from YouTube")
        
        # Store the direct CDN URL — ffmpeg can stream from URLs directly
        video.original_url = stream_url
        video.status = "processing"
        db.commit()

    except Exception as e:
        import traceback
        err = traceback.format_exc()
        print(f"yt-dlp error: {err}")
        # Write to error.log so we can debug via browser
        import os
        os.makedirs("uploads", exist_ok=True)
        with open("uploads/error.log", "a") as f:
            f.write(f"\n--- DOWNLOAD ERROR ---\n{err}\n")
        video.status = "failed"
        db.commit()
        db.close()
        return f"Download failed: {e}"
    finally:
        db.close()
        
    return _execute_video_pipeline(video_id)

