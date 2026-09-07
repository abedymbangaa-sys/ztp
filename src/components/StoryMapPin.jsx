import { useState, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Custom pin icon — swap the emoji/colors to match your brand palette
const storyIcon = new L.DivIcon({
  className: "story-pin-icon",
  html: `<div style="
    width:34px;height:34px;border-radius:50% 50% 50% 0;
    background:#0f766e; transform:rotate(-45deg);
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 6px rgba(0,0,0,0.35); border:2px solid #fff;
  ">
    <span style="transform:rotate(45deg);font-size:16px;">🎙️</span>
  </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
});

/**
 * StoryMapPin
 * Props:
 *  pin: row from story_pins table
 *  lang: 'sw' | 'en'
 */
export default function StoryMapPin({ pin, lang = "sw" }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  const audioSrc = lang === "en" && pin.audio_url_en ? pin.audio_url_en : pin.audio_url;
  const storyText = lang === "en" ? pin.story_text_en : pin.story_text_sw;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <Marker position={[pin.lat, pin.lng]} icon={storyIcon}>
      <Popup maxWidth={280} minWidth={240}>
        <div className="font-sans">
          <h3 className="font-bold text-teal-800 text-base mb-1">{pin.title}</h3>

          <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
            {pin.narrator_photo_url && (
              <img
                src={pin.narrator_photo_url}
                alt={pin.narrator_name}
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
            <span>
              {lang === "en" ? "Told by" : "Imesimuliwa na"} {pin.narrator_name}
            </span>
          </div>

          {audioSrc && (
            <div className="mb-3">
              <audio
                ref={audioRef}
                src={audioSrc}
                onEnded={() => setPlaying(false)}
                className="hidden"
              />
              <button
                onClick={togglePlay}
                className="flex items-center gap-2 bg-teal-700 text-white text-sm px-3 py-1.5 rounded-full w-full justify-center"
              >
                {playing ? "⏸" : "▶️"}{" "}
                {playing
                  ? lang === "en" ? "Pause" : "Simamisha"
                  : lang === "en" ? "Play story" : "Sikiliza hadithi"}
              </button>
            </div>
          )}

          {pin.video_url && (
            <video
              src={pin.video_url}
              controls
              playsInline
              className="w-full rounded mb-3 max-h-40"
            />
          )}

          {storyText && (
            <p className="text-sm text-gray-700 mb-3">{storyText}</p>
          )}

          {pin.local_secret && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-2 mb-2">
              <p className="text-xs font-semibold text-amber-800 mb-0.5">
                🤫 {lang === "en" ? "Local secret" : "Siri ya mtaa"}
              </p>
              <p className="text-xs text-amber-900">{pin.local_secret}</p>
            </div>
          )}

          {(pin.locals_do_text || pin.tourists_told_text) && (
            <div className="grid grid-cols-1 gap-1.5 mt-2">
              {pin.locals_do_text && (
                <div className="bg-teal-50 rounded p-1.5">
                  <p className="text-[10px] font-bold text-teal-700 uppercase">
                    {lang === "en" ? "What locals do" : "Wenyeji wanafanya"}
                  </p>
                  <p className="text-xs text-teal-900">{pin.locals_do_text}</p>
                </div>
              )}
              {pin.tourists_told_text && (
                <div className="bg-gray-100 rounded p-1.5">
                  <p className="text-[10px] font-bold text-gray-500 uppercase">
                    {lang === "en" ? "What tourists are told" : "Watalii wanaambiwa"}
                  </p>
                  <p className="text-xs text-gray-700">{pin.tourists_told_text}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
