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

        ydl_opts = {
            'format': 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'merge_output_format': 'mp4',
            'outtmpl': video.original_url,
            'quiet': True,
            'no_warnings': True,
            'retries': 10,
            'fragment_retries': 10
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # extract_info with download=True does both and gives us the exact metadata
            info_dict = ydl.extract_info(yt_url, download=True)
            
            # ydl.prepare_filename gives us the exact filepath it saved to
            actual_filename = ydl.prepare_filename(info_dict)
            
            # Since sometimes prepare_filename adds an extra .ext but the actual merge was different,
            # we can just glob or use the actual_filename
            video.original_url = actual_filename
            
            # Upload downloaded YouTube video to Cloud Storage
            filename = os.path.basename(video.original_url)
            final_url = upload_file(video.original_url, filename)
            if final_url != video.original_url:
                delete_local_file(video.original_url)
                video.original_url = final_url
            
        video.status = "processing"
        db.commit()
    except Exception as e:
        print(f"yt-dlp error: {e}")
        video.status = "failed"
        db.commit()
        db.close()
        return "Download failed"
    finally:
        db.close()
        
    return _execute_video_pipeline(video_id)
