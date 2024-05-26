import { z } from "zod";
import { t } from "../trpc/trpcInstance";
import { ChatRoomModel } from "../models/chat-room";
import { usernamify } from "../utils/string";
import { sha256 } from "../utils/crypto";

export const chatRoomRouter = t.router({
  createRoom: t.procedure
    .input(
      z.object({
        chatRoomName: z.string(),
        password: z.string(),
        adminToken: z.string(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        payload: z.object({
          chatRoomName: z.string(),
          password: z.string(),
          inviteCode: z.string(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const { chatRoomName, password, adminToken } = input;

      const newRoom = await ChatRoomModel.create({
        name: usernamify(chatRoomName),
        password_hash: sha256(password),
        admin_token_hash: sha256(adminToken),
      });

      return {
        success: true,
        payload: {
          chatRoomName: newRoom.name,
          password: password,
          inviteCode: newRoom.invite_code,
        },
      };
    }),
});
