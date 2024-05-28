import { z } from "zod";
import { t } from "../trpc/trpcInstance";
import { ChatRoomModel } from "../models/chat-room";
import { usernamify } from "../utils/string";
import { sha256 } from "../utils/crypto";
import { buildResponseZObjectType } from '../utils/zod';
import { TRPCError } from '@trpc/server';

export const chatRoomRouter = t.router({
  createRoom: t.procedure
    .input(
      z.object({
        chatRoomName: z.string(),
        password: z.string(),
        adminToken: z.string(),
      }),
    )
    .output(
      buildResponseZObjectType({
        chatRoomName: z.string(),
        password: z.string(),
        inviteCode: z.string(),
      }),
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

  joinRoom: t.procedure
    .input(
      z.object({
        inviteCode: z.string(),
        password: z.string(),
        userToken: z.string(),
      }),
    )
    .output(
      buildResponseZObjectType({
        inviteCode: z.string(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { inviteCode, password } = input;

      const requestedChatRoom = await ChatRoomModel.findOne({
        invite_code: inviteCode,
        password_hash: sha256(password),
      });

      if (!requestedChatRoom) {
        throw new TRPCError({
          message: 'Invalid room credentials',
          code: 'UNAUTHORIZED',
        });
      }
      return {
        success: true,
        payload: {
          inviteCode,
          password,
        },
        message: 'Access granted',
      };
    }),

  getMessages: t.procedure
    .input(
      z.object({
        frameIndex: z.number().min(1),
        inviteCode: z.string(),
        password: z.string(),
      }),
    )
    .output(
      buildResponseZObjectType({
        messages: z
          .object({
            content: z.string(),
            sender_token_hash: z.string(),
            sender_username: z.string(),
            reply_to: z
              .object({
                preview_content: z.string(),
                message_id: z.string(),
              })
              .nullable(),
            createdAt: z.date(),
            _id: z.string(),
          })
          .array(),
      }),
    )
    .query(async ({ input }) => {
      const requestedChatRoom = await ChatRoomModel.findOne({
        invite_code: input.inviteCode,
        password_hash: sha256(input.password),
      });

      if (!requestedChatRoom) {
        throw new TRPCError({
          message: 'Invalid room credentials',
          code: 'UNAUTHORIZED',
        });
      }

      return {
        success: true,
        payload: {
          messages: requestedChatRoom.toObject().messages.map((i) => ({
            ...i,
            _id: i._id?.toString(),
          })),
        },
      };
    }),

  sendMessage: t.procedure
    .input(
      z.object({
        messageBody: z.object({
          content: z.string(),
          sender_token_hash: z.string(),
          sender_username: z.string(),
          reply_to: z
            .object({
              preview_content: z.string(),
              message_id: z.string(),
            })
            .optional()
            .nullable()
            .default(null),
        }),
        inviteCode: z.string(),
        password: z.string(),
      }),
    )
    .output(buildResponseZObjectType())
    .mutation(async ({ input }) => {
      const requestedChatRoom = await ChatRoomModel.findOne({
        invite_code: input.inviteCode,
        password_hash: sha256(input.password),
      });

      if (!requestedChatRoom) {
        throw new TRPCError({
          message: 'Invalid room credentials',
          code: 'UNAUTHORIZED',
        });
      }

      await ChatRoomModel.findOneAndUpdate(
        {
          invite_code: input.inviteCode,
          password_hash: sha256(input.password),
        },
        { $push: { messages: input.messageBody } },
      );

      return {
        success: true,
      };
    }),
});
