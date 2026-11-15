"use client";

import { useRef, useState } from "react";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

export function SoundtrackPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    setError("");
    if (audio.paused) {
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setError("Audio could not be played. Try again.");
      }
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function stopPlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setPlaying(false);
  }

  function skip(seconds: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    const nextTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function seek(value: number) {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value;
    setCurrentTime(value);
  }

  return (
    <div className="soundtrack-player">
      <audio
        ref={audioRef}
        src="/audio/are-we-having-fun-yet.mp3"
        preload="metadata"
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onEnded={() => setPlaying(false)}
        onError={() => { setPlaying(false); setError("The soundtrack file could not be loaded."); }}
      />
      <div className="soundtrack-player__cassette" role="group" aria-label="MoonWitness soundtrack cassette">
        <div className="soundtrack-player__label">
          <span>MW / SIDE A</span>
          <strong>Are We Having Fun Yet</strong>
          <small>SOUNDTRACK · MP3</small>
        </div>
        <div className={"soundtrack-player__window" + (playing ? " is-playing" : "")} aria-hidden="true">
          <i><b /></i><span /><i><b /></i>
        </div>
      </div>
      <div className="soundtrack-player__controls" role="group" aria-label="Soundtrack transport controls">
        <div className="soundtrack-player__meta">
          <span>{playing ? "PLAYING" : error ? "AUDIO ERROR" : "READY"}</span>
          <span>USER CONTROLLED / NO AUTOPLAY</span>
        </div>
        <div className="soundtrack-player__keys">
          <button type="button" onClick={() => skip(-10)} disabled={!duration} aria-label="Rewind soundtrack 10 seconds"><span aria-hidden="true">◀◀</span><small>REWIND 10S</small></button>
          <button type="button" onClick={stopPlayback} aria-label="Stop soundtrack and return to the beginning"><span className="soundtrack-stop" aria-hidden="true" /><small>STOP</small></button>
          <button className="soundtrack-player__toggle" type="button" onClick={() => void togglePlayback()} aria-label={playing ? "Pause soundtrack" : "Play soundtrack"}>
            {playing ? <span className="soundtrack-pause" aria-hidden="true">Ⅱ</span> : <span aria-hidden="true">▶</span>}
            <small>{playing ? "PAUSE" : "PLAY"}</small>
          </button>
          <button type="button" onClick={() => skip(10)} disabled={!duration} aria-label="Fast-forward soundtrack 10 seconds"><span aria-hidden="true">▶▶</span><small>FWD 10S</small></button>
        </div>
        <div className="soundtrack-player__timeline">
          <label className="soundtrack-player__seek-label" htmlFor="soundtrack-seek">Track position</label>
          <span>{formatTime(currentTime)}</span>
          <input
            id="soundtrack-seek"
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => seek(Number(event.target.value))}
            aria-label="Seek soundtrack"
            aria-valuetext={formatTime(currentTime) + " of " + formatTime(duration)}
            disabled={!duration}
          />
          <span>{formatTime(duration)}</span>
        </div>
        {error && <span className="soundtrack-player__error" role="status">{error}</span>}
      </div>
    </div>
  );
}
