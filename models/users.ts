import mongoose from "mongoose";

export const UserModel = mongoose.model(
  "User",
  new mongoose.Schema(
    {
      sub: {
        type: String,
        unique: true,
        required: true,
      },

      email: {
        type: String,
        unique: true,
        required: true,
      },

      name: {
        type: String,
        required: true,
      },

      picture: {
        type: String,
        required: true,
      },
    },
    {
      timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    }
  ),
  "users"
);
