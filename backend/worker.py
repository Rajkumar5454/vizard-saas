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
        print(f"Error processing video {video_id}: {e}")
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
        ydl_opts = {
            'format': 'best[ext=mp4][height<=720]/best[height<=720]/best',
            'quiet': True,
            'no_warnings': True,
        }
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
        video.status = "failed"
        db.commit()
        db.close()
        return f"Download failed: {e}"
    finally:
        db.close()
        
    return _execute_video_pipeline(video_id)

