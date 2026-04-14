from groq import Groq
import os
from pydantic import BaseModel
from typing import List
import json
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY", "dummy_key"))

class ClipIdea(BaseModel):
    title: str
    start_time: float # Total seconds
    end_time: float   # Total seconds
    duration: float   # Total seconds

def transcribe_audio(audio_path: str) -> str:
    try:
        with open(audio_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                file=(os.path.basename(audio_path), audio_file.read()),
                model="whisper-large-v3",
                response_format="verbose_json", # Get timestamps!
                language="en",
            )
        
        # Combine segments with timestamps for the LLM
        timestamped_transcript = ""
        for segment in transcription.segments:
            start = segment['start']
            end = segment['end']
            text = segment['text']
            timestamped_transcript += f"[{start:.1f}s - {end:.1f}s] {text}\n"
            
        return timestamped_transcript
    except Exception as e:
        print(f"Error during Groq transcription: {e}")
        return ""

def detect_viral_segments(transcript: str, total_duration_seconds: float) -> List[ClipIdea]:
    if not transcript:
        return []
    
    prompt = f"""
    Analyze the following video transcript which HAS TIMESTAMPS. 
    Identify 3 to 5 highly engaging, viral-worthy segments.
    Total video duration: {total_duration_seconds} seconds.
    
    CRITICAL RULES: 
    1. Use the [start - end] timestamps provided in the transcript to pick your clips.
    2. EACH CLIP MUST BE BETWEEN 15 AND 60 SECONDS LONG. You must combine multiple sentences to form a complete, coherent thought. NEVER select single sentences of 1 or 2 seconds.
    3. The end_time of your last clip MUST NOT EXCEED {total_duration_seconds} seconds.
    
    Output ONLY a valid JSON object with a key 'clips' containing an array.
    Each object must have:
    - title: catchy name
    - start_time: TOTAL SECONDS from start (e.g. 12.5)
    - end_time: TOTAL SECONDS from start (e.g. 45.2)
    - duration: float seconds

    Transcript:
    {transcript}
    """
    
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a video editing AI. Output ONLY valid JSON, no markdown."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        data = json.loads(response.choices[0].message.content)
        clips = []
        for c in data.get("clips", []):
            clips.append(ClipIdea(**c))
        return clips
    except Exception as e:
        print(f"Error in detecting viral segments with Groq: {e}")
        return []

