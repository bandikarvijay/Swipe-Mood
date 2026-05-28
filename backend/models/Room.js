import mongoose from "mongoose";

const roomSchema =
  new mongoose.Schema({

    roomCode: {
      type: String,
      required: true,
    },

    admin: {
      type: String,
      required: true,
    },

    everyone: [
      String,
    ],

    tracks: [
      String,
    ],
  });

export default mongoose.model(
  "Room",
  roomSchema
);