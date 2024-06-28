import { z } from 'zod';
import { t } from '../trpc/trpcInstance';
import { ChatRoomModel } from '../models/chat-room';
import { usernamify } from '../utils/string';
import { sha256 } from '../utils/crypto';
import { observable } from '@trpc/server/observable';
import { buildResponseZObjectType } from '../utils/zod';
import { TRPCError } from '@trpc/server';
import { EventEmitter } from 'events';
import { MessageBodyZSchema, SendMessageInputZSchema } from '../types/trpc';

const ee = new EventEmitter();

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
        chatRoomName: z.string(),
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
          chatRoomName: requestedChatRoom.name,
          password,
        },
        message: 'Access granted',
      };
    }),

  getMessages: t.procedure
    .input(
      z.object({
        frameIndex: z.number().min(1),
        chatRoomName: z.string(),
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
        name: input.chatRoomName,
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

  onNewMessage: t.procedure
    .input(
      z.object({
        chatRoomName: z.string(),
        password: z.string(),
        user_token_hash: z.string(),
      }),
    )
    .subscription(({ input }) => {
      const { chatRoomName, password, user_token_hash } = input;

      return observable<z.infer<typeof MessageBodyZSchema>>((emit) => {
        const onSendMessage = async (data: z.infer<typeof SendMessageInputZSchema>) => {
          const chatRoom = await ChatRoomModel.findOne({ name: data.chatRoomName });

          if (chatRoom === null) throw Error('The chat room in tunneling request does not exist');

          if (
            data.chatRoomName === chatRoomName &&
            data.password === password &&
            !chatRoom.blacklisted_user_token_hashes.includes(user_token_hash)
          ) {
            emit.next({ ...data.messageBody });
          }
        };

        ee.on('newMessage', onSendMessage);

        return () => {
          ee.off('newMessage', onSendMessage);
        };
      });
    }),

  sendMessage: t.procedure
    .input(
      z.object({
        messageBody: z.object({
          content: z.string(),
          sender_token: z.string(),
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
        chatRoomName: z.string(),
        password: z.string(),
      }),
    )
    .output(buildResponseZObjectType())
    .mutation(async ({ input }) => {
      const requestedChatRoom = await ChatRoomModel.findOne({
        name: input.chatRoomName,
        password_hash: sha256(input.password),
      });

      if (!requestedChatRoom) {
        throw new TRPCError({
          message: 'Invalid room credentials',
          code: 'UNAUTHORIZED',
        });
      }

      const { content, sender_token, sender_username, reply_to } = input.messageBody;

      await ChatRoomModel.findOneAndUpdate(
        {
          name: input.chatRoomName,
          password_hash: sha256(input.password),
        },
        { $push: { messages: { content, sender_token_hash: sha256(sender_token), sender_username, reply_to } } },
      );

      ee.emit('newMessage', { ...input });

      return {
        success: true,
      };
    }),
});
