import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useParams,
  useNavigate,
} from "react-router-dom";

import ReactPlayer from "react-player/lazy";

import io from "socket.io-client";

import "./Room.css";

// =========================
// SOCKET
// =========================

const socket = io(
  "https://swipemood.onrender.com"
);

// =========================
// API KEY
// =========================

const YOUTUBE_API_KEY =process.env.REACT_APP_YOUTUBE_API_KEY;

// =========================
// COMPONENT
// =========================

export default function Room() {

  const { roomCode } =
    useParams();

  const navigate =
    useNavigate();


// =========================
// STATES
// =========================

const [room, setRoom] =
  useState(null);

const [loading, setLoading] =
  useState(true);

const [users, setUsers] =
  useState([]);

const [messages, setMessages] =
  useState([]);

const [chatInput, setChatInput] =
  useState("");

const [videoUrl, setVideoUrl] =
  useState("");

const [currentUrl, setCurrentUrl] =
  useState("");

const [
  searchResults,
  setSearchResults,
] = useState([]);

const [activeTab, setActiveTab] =
  useState("everyone");

const [micOn, setMicOn] =
  useState(false);

const [speakerOn, setSpeakerOn] =
  useState(true);

const [
  isScreenSharing,
  setIsScreenSharing,
] = useState(false);

const [isPlaying, setIsPlaying] =
  useState(false);

const [isAdmin, setIsAdmin] =
  useState(false);



  // =========================
  // REFS
  // =========================

  const playerRef =
    useRef(null);

  const remoteScreenRef =
    useRef(null);
  const chatAreaRef = useRef(null);

  // =========================
  // USER
  // =========================

  const userName =
    localStorage.getItem(
      "userName"
    );

  const userRole =
    localStorage.getItem(
      "userRole"
    );

  // =========================
  // ADMIN CHECK
  // =========================

  useEffect(() => {

    setIsAdmin(
      userRole === "Admin"
    );

  }, [userRole]);

  // =========================
  // LOAD ROOM
  // =========================

  useEffect(() => {

    const fetchRoom = async () => {

      try {

        const res = await fetch(
          `https://swipemood.onrender.com/api/rooms/${roomCode}`
        );

        const data =
          await res.json();

        setRoom(
          data.room
        );

        setUsers(
          data.room.users || []
        );

      } catch (err) {

        console.log(err);

      } finally {

        setLoading(false);
      }
    };

    fetchRoom();

  }, [roomCode]);

// =========================
// SOCKET EVENTS
// =========================

useEffect(() => {

  socket.emit(
    "join-room",
    {
      roomCode,
      userName,
      userRole,
    }
  );

  // =========================
  // USERS
  // =========================

  socket.on(
    "user-joined",
    (list) => {

      setUsers(list || []);
    }
  );

  // =========================
  // VIDEO SYNC
  // =========================

socket.on(
  "sync-video",
  (data) => {

    if (!data)
      return;

    // UPDATE URL

    if (
      data.url &&
      data.url !== currentUrl
    ) {

      setCurrentUrl(
        data.url
      );
    }

    // PLAY / PAUSE

    setIsPlaying(
      data.playing
    );

    // SEEK

    const current =
      playerRef.current?.getCurrentTime?.() || 0;

    if (
      Math.abs(
        current - data.time
      ) > 2
    ) {

      playerRef.current?.seekTo?.(
        data.time,
        "seconds"
      );
    }
  }
);


  // =========================
  // CHAT
  // =========================

  socket.on(
    "chat-message",
    (msg) => {

      setMessages(
        (prev) => [
          ...prev,
          msg,
        ]
      );
    }
  );

  socket.on(
    "chat-history",
    (history) => {

      setMessages(
        history
      );
    }
  );

  // =========================
  // ROOM CLOSED
  // =========================

  socket.on(
    "room-closed",
    () => {

      alert(
        "Room Closed"
      );

      navigate("/");
    }
  );

  return () => {

    socket.off(
      "user-joined"
    );

    socket.off(
      "sync-video"
    );

    socket.off(
      "chat-message"
    );

    socket.off(
      "chat-history"
    );

    socket.off(
      "room-closed"
    );
  };

}, [
  roomCode,
  userName,
  userRole,
  navigate,
  currentUrl,
]);

  useEffect(() => {

  if (chatAreaRef.current) {

    chatAreaRef.current.scrollTo({
      top:
        chatAreaRef.current.scrollHeight,
      behavior: "smooth",
    });
  }

}, [messages]);
  
  // =========================
  // PLAY VIDEO
  // =========================

  const playVideo =
    (url) => {

      setCurrentUrl(url);

      setIsPlaying(true);

      socket.emit(
        "play-video",
        {
          roomCode,
          videoUrl: url,
          playing: true,
        }
      );
    };

  // =========================
  // SEARCH
  // =========================

  const handlePlayOrSearch =
    async () => {

      if (!isAdmin)
        return;

      try {

        const q =
          encodeURIComponent(
            videoUrl
          );

        const res =
          await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&q=${q}&key=${YOUTUBE_API_KEY}`
          );

        const data =
          await res.json();

        setSearchResults(
          data.items || []
        );

      } catch (err) {

        console.log(err);
      }
    };

  // =========================
  // SELECT VIDEO
  // =========================

  const handleSelectSuggestion =
    (video) => {

      const videoId =
        video?.id?.videoId;

      if (!videoId)
        return;

      playVideo(
        `https://www.youtube.com/watch?v=${videoId}`
      );

      setSearchResults([]);
    };

  // =========================
  // CHAT
  // =========================

  const sendMessage =
    () => {

      if (
        !chatInput.trim()
      )
        return;

      const msg = {
        sender:
          userName,
        text:
          chatInput,
        time:
          new Date().toLocaleTimeString(),
      };

      socket.emit(
        "chat-message",
        {
          roomCode,
          msg,
        }
      );

      setChatInput("");
    };

  // =========================
  // MIC
  // =========================

  const toggleMic =
    () => {

      setMicOn(
        !micOn
      );
    };

  // =========================
  // SPEAKER
  // =========================

  const toggleSpeaker =
    () => {

      setSpeakerOn(
        !speakerOn
      );
    };

  // =========================
  // SCREEN SHARE
  // =========================

  const toggleScreenShare =
    async () => {

      try {

        if (
          isScreenSharing
        ) {

          setIsScreenSharing(
            false
          );

          return;
        }

        const stream =
          await navigator.mediaDevices.getDisplayMedia(
            {
              video: true,
              audio: true,
            }
          );

        if (
          remoteScreenRef.current
        ) {

          remoteScreenRef.current.srcObject =
            stream;
        }

        setIsScreenSharing(
          true
        );

      } catch (err) {

        console.log(err);
      }
    };

  // =========================
  // CLOSE ROOM
  // =========================

  const handleCloseRoom =
    () => {

      socket.emit(
        "close-room",
        roomCode
      );
    };

  // =========================
  // LOADING
  // =========================

  if (loading)
    return (
      <div>
        Loading...
      </div>
    );

  return (
    <div className="room-root">


{/* LEFT PANEL */}

<aside className="left-panel">

  {/* ROOM HEADER */}

  <div className="room-header">

    <h2>
      Room {room?.roomCode}
    </h2>

    {isAdmin && (

      <button
        className="close-room-btn"
        onClick={
          handleCloseRoom
        }
      >
        ❌ Close
      </button>
    )}
  </div>

  {/* TABS */}

  <div className="tabs">

    <button
      className={
        activeTab ===
        "everyone"
          ? "tab active"
          : "tab"
      }
      onClick={() =>
        setActiveTab(
          "everyone"
        )
      }
    >
      Everyone
    </button>

    <button
      className={
        activeTab ===
        "admins"
          ? "tab active"
          : "tab"
      }
      onClick={() =>
        setActiveTab(
          "admins"
        )
      }
    >
      Admins
    </button>
  </div>

  {/* USERS */}

  <div className="users-box">
    

    {(activeTab ===
    "admins"
      ? users.filter(
          (u) =>
            u.role ===
            "Admin"
        )
      : users.filter(
          (u) =>
            u.role !==
            "Admin"
        )
    ).map(
      (
        user,
        index
      ) => (

        <div
          key={index}
          className="user-row"
        >

          <div className="avatar">
            {
              user.name?.charAt(0)
            }
          </div>

          <div className="meta">

            <div className="name">
              {user.name}
            </div>

            <div className="role">
              {user.role}
            </div>
          </div>
        </div>
      )
    )}
  </div>

  {/* TOGGLES */}

  <div className="voice-controls">

    <button
      className={`voice-btn ${
        micOn
          ? "active"
          : ""
      }`}
      onClick={
        toggleMic
      }
    >
      🎤
    </button>

    <button
      className={`voice-btn ${
        speakerOn
          ? "active"
          : ""
      }`}
      onClick={
        toggleSpeaker
      }
    >
      🔊
    </button>

    {isAdmin && (

      <button
        className={`voice-btn ${
          isScreenSharing
            ? "active"
            : ""
        }`}
        onClick={
          toggleScreenShare
        }
      >
        🖥
      </button>
    )}
  </div>
</aside>

{/* CENTER PANEL */}

<main className="center-panel">

  {/* SEARCH */}

  <div className="search-row">

    <input
      disabled={!isAdmin}
      className="search-input"
      value={videoUrl}
      onChange={(e) =>
        setVideoUrl(
          e.target.value
        )
      }
      placeholder="Search YouTube..."
    />

    <button
      disabled={!isAdmin}
      className="search-go"
      onClick={
        handlePlayOrSearch
      }
    >
      ▶
    </button>
  </div>

  {/* SEARCH RESULTS */}

  {searchResults.length > 0 && (

    <ul className="suggestions">

      {searchResults.map(
        (item) => (

          <li
            key={
              item.id.videoId
            }
            onClick={() =>
              handleSelectSuggestion(
                item
              )
            }
          >

            <img
              src={
                item.snippet
                  ?.thumbnails
                  ?.default
                  ?.url
              }
              alt=""
            />

            <span>
              {
                item.snippet
                  ?.title
              }
            </span>
          </li>
        )
      )}
    </ul>
  )}

  {/* VIDEO */}

  <div className="video-wrapper">

    {isScreenSharing ? (

      <video
        ref={
          remoteScreenRef
        }
        autoPlay
        playsInline
        muted={!speakerOn}
        className="screen-video"
      />

    ) : currentUrl ? (


<ReactPlayer
  ref={playerRef}
  url={currentUrl}
  playing={isPlaying}
  controls={isAdmin}
  width="100%"
  height="100%"
  playsinline={true}

  style={{
    pointerEvents: isAdmin
      ? "auto"
      : "none",
  }}

  onPlay={() => {

    if (!isAdmin)
      return;

    socket.emit(
      "play-video",
      {
        roomCode,

        videoUrl:
          currentUrl,

        time:
          playerRef.current?.getCurrentTime?.() || 0,

        playing: true,
      }
    );
  }}

  onPause={() => {

    if (!isAdmin)
      return;

    socket.emit(
      "play-video",
      {
        roomCode,

        videoUrl:
          currentUrl,

        time:
          playerRef.current?.getCurrentTime?.() || 0,

        playing: false,
      }
    );
  }}

  onSeek={(seconds) => {

    if (!isAdmin)
      return;

    socket.emit(
      "play-video",
      {
        roomCode,

        videoUrl:
          currentUrl,

        time: seconds,

        playing:
          isPlaying,
      }
    );
  }}

  config={{
    youtube: {
      playerVars: {
        autoplay: 1,
        modestbranding: 1,
        rel: 0,
        fs: 0,
        iv_load_policy: 3,
        disablekb: 1,
      },
    },
  }}
/>





    ) : (

      <div className="no-video">
        No Video Selected
      </div>
    )}
  </div>

  {/* FOOTER */}

  <footer className="developer-footer">

    Developed by 

    <a
      href="https://vijayabhaskar.vercel.app/"
      target="_blank"
      rel="noreferrer"
    >
      Bandikar Vijay
    </a>

  </footer>
</main>

{/* RIGHT PANEL */}

<aside className="right-panel">

  <div className="chat-title">
    💬 Live Chat
  </div>

  <div 
      className="chat-area"
      ref={chatAreaRef}
    >

    {messages.map(
      (
        msg,
        i
      ) => (

        <div
          key={i}
          className={`chat-msg ${
            msg.sender ===
            userName
              ? "me"
              : "other"
          }`}
        >

          <b>
            {msg.sender}
          </b>

          <p>
            {msg.text}
          </p>

          <span className="chat-time">
            {msg.time}
          </span>
        </div>
      )
    )}
  </div>

  {/* CHAT INPUT */}

  <div className="chat-input-row">

    <input
      value={chatInput}
      onChange={(e) =>
        setChatInput(
          e.target.value
        )
      }
      placeholder="Type message..."
    />

    <button
      onClick={
        sendMessage
      }
    >
      Send
    </button>
  </div>
</aside>
    </div>
  );
}

