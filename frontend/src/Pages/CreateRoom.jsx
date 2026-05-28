import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateRoom.css";
import LightRays from "./LightRays";

export default function CreateRoom() {

  const [name, setName] =
    useState("");

  const [
    roomCodeDigits,
    setRoomCodeDigits,
  ] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const navigate =
    useNavigate();

  const roomCode =
    roomCodeDigits.join("");

  // =========================
  // HANDLE CODE INPUT
  // =========================

  const handleDigitChange =
    (index, value) => {

      if (
        !/^[0-9A-Za-z]?$/.test(
          value
        )
      )
        return;

      const newDigits = [
        ...roomCodeDigits,
      ];

      newDigits[index] =
        value.toUpperCase();

      setRoomCodeDigits(
        newDigits
      );

      // AUTO NEXT INPUT

      if (
        value &&
        index < 5
      ) {

        document
          .getElementById(
            `code-${index + 1}`
          )
          ?.focus();
      }

      // AUTO JOIN

      if (
        index === 5 &&
        value &&
        name.trim()
      ) {

        handleJoinRoom();
      }
    };

  // =========================
  // BACKSPACE
  // =========================

  const handleBackspace =
    (index, e) => {

      if (
        e.key ===
          "Backspace" &&
        !roomCodeDigits[
          index
        ] &&
        index > 0
      ) {

        document
          .getElementById(
            `code-${index - 1}`
          )
          ?.focus();
      }
    };

  // =========================
  // CREATE ROOM
  // =========================

  const handleCreateRoom =
    async () => {

      if (
        !name.trim()
      ) {

        return setError(
          "Please enter your name"
        );
      }

      if (
        roomCode.length !== 6
      ) {

        return setError(
          "Please enter 6 characters for room code"
        );
      }

      setError("");

      setLoading(true);

      try {

        const res =
          await fetch(
            "https://swipemood.onrender.com/api/rooms",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  {
                    roomCode,
                    userName:
                      name,
                  }
                ),
            }
          );

        const data =
          await res.json();

        if (!res.ok) {

          throw new Error(
            data.message ||
              "Failed to create room"
          );
        }

        localStorage.setItem(
          "userName",
          name
        );

        localStorage.setItem(
          "userRole",
          "Admin"
        );

        navigate(
          `/room/${roomCode}`
        );

      } catch (err) {

        setError(
          err.message
        );

      } finally {

        setLoading(
          false
        );
      }
    };

  // =========================
  // JOIN ROOM
  // =========================

  const handleJoinRoom =
    async () => {

      if (
        !name.trim()
      ) {

        return setError(
          "Please enter your name"
        );
      }

      if (
        roomCode.length !== 6
      ) {

        return setError(
          "Please enter 6 characters for room code"
        );
      }

      setError("");

      setLoading(true);

      try {

        const res =
          await fetch(
            "https://swipemood.onrender.com/api/rooms/join",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  {
                    roomCode,
                    userName:
                      name,
                  }
                ),
            }
          );

        const data =
          await res.json();

        if (!res.ok) {

          throw new Error(
            data.message ||
              "Failed to join room"
          );
        }

        localStorage.setItem(
          "userName",
          name
        );

        localStorage.setItem(
          "userRole",
          "Everyone"
        );

        navigate(
          `/room/${roomCode}`
        );

      } catch (err) {

        setError(
          err.message
        );

      } finally {

        setLoading(
          false
        );
      }
    };

  // =========================
  // UI
  // =========================

  return (

    <div className="create-room-container">

      {/* LIGHT EFFECT */}

      <div
        style={{
          width: "100%",
          height: "100vh",
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none"
        }}
      >

        <LightRays
          raysOrigin="top-center"
          raysColor="#58a6ff"
          raysSpeed={1}
          lightSpread={0.5}
          rayLength={3}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0}
          distortion={0}
          className="custom-rays"
          pulsating={false}
          fadeDistance={1}
          saturation={1}
        />

      </div>

      {/* CARD */}

      <div className="create-room-card">

        <h2 className="title">
          Join a SwipeMood Room
        </h2>

        <p className="subtitle">
          Enter a room code or create a new room
        </p>

        {/* ROOM CODE */}

        <div className="roomcode-boxes">

          {roomCodeDigits.map(
            (
              digit,
              i
            ) => (

              <input
                key={i}
                id={`code-${i}`}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) =>
                  handleDigitChange(
                    i,
                    e.target.value
                  )
                }
                onKeyDown={(e) =>
                  handleBackspace(
                    i,
                    e
                  )
                }
                className="code-box"
              />
            )
          )}
        </div>

        {/* NAME INPUT */}

        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) =>
            setName(
              e.target.value
            )
          }
          className="input-field"
        />

        {/* ERROR */}

        {error && (

          <p className="error-text">
            {error}
          </p>
        )}

        {/* BUTTONS */}

        <div className="button-group">

          <button
            onClick={
              handleJoinRoom
            }
            disabled={
              loading
            }
            className="join-btn"
          >
            {loading
              ? "Loading..."
              : "Join Room"}
          </button>

          <button
            onClick={
              handleCreateRoom
            }
            disabled={
              loading
            }
            className="create-btn"
          >
            + Create New Room
          </button>
        </div>

{/* FOOTER */}

<footer className="developer-footer-inside">

  Developed by{" "}

  <a
    href="https://vijayabhaskar.vercel.app/"
    target="_blank"
    rel="noreferrer"
  >
    Bandikar Vijay
  </a>

</footer>


      </div>
    </div>
  );
}