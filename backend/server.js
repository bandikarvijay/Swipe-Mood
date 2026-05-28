// backend/server.js

import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import roomRoutes from "./routes/roomRoutes.js";
import Room from "./models/Room.js";

// =========================
// ENV
// =========================

dotenv.config();

// =========================
// APP
// =========================

const app = express();

// =========================
// CORS
// =========================

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://swipe-mood.vercel.app",
    ],
    methods: [
      "GET",
      "POST",
    ],
    credentials: true,
  })
);

app.use(express.json());

// =========================
// TEST ROUTE
// =========================

app.get("/", (req, res) => {

  res.send(
    "✅ SwipeMood Backend Running"
  );
});

// =========================
// MONGODB
// =========================

mongoose
  .connect(
    process.env.MONGO_URI
  )
  .then(() => {

    console.log(
      "✅ MongoDB Connected"
    );

  })
  .catch((err) => {

    console.error(
      "MongoDB Error:",
      err
    );
  });

// =========================
// ROUTES
// =========================

app.use(
  "/api/rooms",
  roomRoutes
);

// =========================
// SERVER
// =========================

const server =
  http.createServer(app);

const io =
  new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "https://swipe-mood.vercel.app",
      ],
      methods: [
        "GET",
        "POST",
      ],
      credentials: true,
    },
  });

// =========================
// MEMORY STORAGE
// =========================

const currentVideos = {};

const roomChats = {};

const rooms = {};

// =========================
// SOCKET CONNECTION
// =========================

io.on(
  "connection",
  (socket) => {

    console.log(
      "🟢 Connected:",
      socket.id
    );

    // =========================
    // JOIN ROOM
    // =========================

    socket.on(
      "join-room",
      async ({
        roomCode,
        userName,
        userRole,
      }) => {

        socket.join(
          roomCode
        );

        console.log(
          `${userName} joined ${roomCode}`
        );

        // CREATE ROOM MEMORY

        if (
          !rooms[roomCode]
        ) {

          rooms[
            roomCode
          ] = {
            users: [],
          };
        }

        // ADD USER

        const alreadyExists =
          rooms[
            roomCode
          ].users.find(
            (u) =>
              u.id ===
              socket.id
          );

        if (
          !alreadyExists
        ) {

          rooms[
            roomCode
          ].users.push({
            id: socket.id,
            name: userName,
            role: userRole,
          });
        }

        // DATABASE SAVE

        try {

          const room =
            await Room.findOne(
              {
                roomCode,
              }
            );

          if (room) {

            if (
              userName !==
                room.admin &&
              !room.everyone.includes(
                userName
              )
            ) {

              room.everyone.push(
                userName
              );

              await room.save();
            }
          }

        } catch (err) {

          console.error(
            err
          );
        }

        // SEND USERS

        io.to(
          roomCode
        ).emit(
          "user-joined",
          rooms[
            roomCode
          ].users
        );

        // SEND CURRENT VIDEO

        if (
          currentVideos[
            roomCode
          ]
        ) {

          socket.emit(
            "sync-video",
            currentVideos[
              roomCode
            ]
          );
        }

        // SEND CHAT HISTORY

        if (
          roomChats[
            roomCode
          ]
        ) {

          socket.emit(
            "chat-history",
            roomChats[
              roomCode
            ]
          );
        }
      }
    );

    // =========================
    // VIDEO SYNC
    // =========================

    socket.on(
      "play-video",
      ({
        roomCode,
        videoUrl,
        time,
        playing,
      }) => {

        currentVideos[
          roomCode
        ] = {
          url:
            videoUrl,

          time:
            time || 0,

          playing,
        };

        socket.to(
          roomCode
        ).emit(
          "sync-video",
          {
            url:
              videoUrl,

            time:
              time || 0,

            playing,
          }
        );
      }
    );

    // =========================
    // CHAT
    // =========================

    socket.on(
      "chat-message",
      ({
        roomCode,
        msg,
      }) => {

        if (
          !roomChats[
            roomCode
          ]
        ) {

          roomChats[
            roomCode
          ] = [];
        }

        roomChats[
          roomCode
        ].push(msg);

        io.to(
          roomCode
        ).emit(
          "chat-message",
          msg
        );
      }
    );

    // =========================
    // SCREEN SHARE START
    // =========================

    socket.on(
      "start-screen-share",
      ({
        roomCode,
      }) => {

        socket.to(
          roomCode
        ).emit(
          "start-screen-share"
        );
      }
    );

    // =========================
    // STOP SCREEN SHARE
    // =========================

    socket.on(
      "stop-screen-share",
      (
        roomCode
      ) => {

        socket.to(
          roomCode
        ).emit(
          "stop-screen-share"
        );
      }
    );

    // =========================
    // SCREEN OFFER
    // =========================

    socket.on(
      "screen-offer",
      ({
        target,
        offer,
      }) => {

        io.to(
          target
        ).emit(
          "screen-offer",
          {
            from:
              socket.id,

            offer,
          }
        );
      }
    );

    // =========================
    // SCREEN ANSWER
    // =========================

    socket.on(
      "screen-answer",
      ({
        target,
        answer,
      }) => {

        io.to(
          target
        ).emit(
          "screen-answer",
          {
            from:
              socket.id,

            answer,
          }
        );
      }
    );

    // =========================
    // SCREEN ICE CANDIDATE
    // =========================

    socket.on(
      "screen-candidate",
      ({
        target,
        candidate,
      }) => {

        io.to(
          target
        ).emit(
          "screen-candidate",
          {
            from:
              socket.id,

            candidate,
          }
        );
      }
    );

    // =========================
    // CLOSE ROOM
    // =========================

    socket.on(
      "close-room",
      async (
        roomCode
      ) => {

        try {

          await Room.findOneAndDelete(
            {
              roomCode,
            }
          );

          delete currentVideos[
            roomCode
          ];

          delete roomChats[
            roomCode
          ];

          delete rooms[
            roomCode
          ];

          io.to(
            roomCode
          ).emit(
            "room-closed"
          );

          console.log(
            `🗑 Room deleted: ${roomCode}`
          );

        } catch (err) {

          console.error(
            err
          );
        }
      }
    );

    // =========================
    // DISCONNECT
    // =========================

    socket.on(
      "disconnect",
      () => {

        console.log(
          "🔴 Disconnected:",
          socket.id
        );

        Object.keys(
          rooms
        ).forEach(
          (
            roomCode
          ) => {

            if (
              rooms[
                roomCode
              ]
            ) {

              rooms[
                roomCode
              ].users =
                rooms[
                  roomCode
                ].users.filter(
                  (
                    u
                  ) =>
                    u.id !==
                    socket.id
                );

              io.to(
                roomCode
              ).emit(
                "user-joined",
                rooms[
                  roomCode
                ].users
              );
            }
          }
        );
      }
    );
  }
);

// =========================
// START SERVER
// =========================

const PORT =
  process.env.PORT || 5000;

server.listen(
  PORT,
  () => {

    console.log(
      `🚀 Backend running on port ${PORT}`
    );
  }
);