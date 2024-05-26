import mongoose from "mongoose";
import { randomBytes } from "crypto";

const MessageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },

    sender_token_hash: {
      type: String,
      required: true,
    },

    sender_username: {
      type: String,
      required: true,
    },

    reply_to: {
      type: {
        preview_content: { type: String, required: true },
        message_id: { type: mongoose.Types.ObjectId, required: true },
      },
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const ChatRoomModel = mongoose.model(
  "ChatRoom",
  new mongoose.Schema({
    name: {
      type: String,
      unique: true,
      required: true,
    },

    password_hash: {
      type: String,
      required: true,
    },

    invite_code: {
      type: String,
      required: true,
      default: () => randomBytes(48).toString("hex"),
    },

    admin_token_hash: {
      type: String,
      required: true,
    },

    moderator_token_hashes: {
      type: [String],
    },

    whitelisted_user_token_hashes: {
      type: [String],
    },

    messages: {
      type: [MessageSchema],
    },
  }),
  "chat_room"
);
