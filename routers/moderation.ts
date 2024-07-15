import { z } from 'zod';
import { t } from '../trpc/trpcInstance';
import { ChatRoomModel } from '../models/chat-room';
import { buildResponseZObjectType } from '../utils/zod';
import { sha256 } from '../utils/crypto';
import { TRPCError } from '@trpc/server';
import { observable } from '@trpc/server/observable';
import EventEmitter from 'events';
import { randomBytes } from 'crypto';

const ee = new EventEmitter();

export const moderationRouter = t.router({
  blacklistMember: t.procedure
    .input(
      z.object({
        chatRoomName: z.string(),
        password: z.string(),
        user_token_hash: z.string(),
        target_user_token_hash: z.string(),
        reason: z.string(),
      }),
    )
    .output(buildResponseZObjectType())
    .mutation(async ({ input }) => {
      const requestedChatRoom = await ChatRoomModel.findOne({
        name: input.chatRoomName,
        password_hash: sha256(input.password),
        admin_token_hash: input.user_token_hash,
      });

      if (!requestedChatRoom) {
        throw new TRPCError({
          message: 'Invalid room credentials',
          code: 'UNAUTHORIZED',
        });
      }

      requestedChatRoom.blacklisted_user_token_hashes.push(input.target_user_token_hash);
      requestedChatRoom.invite_code = randomBytes(48).toString('hex');
      await requestedChatRoom.save();

      ee.emit('memberBlacklisted', {
        chatRoomName: input.chatRoomName,
        target_user_token_hash: input.target_user_token_hash,
        reason: `${input.reason} 🗿`,
      });

      return {
        success: true,
      };
    }),

  onSelfBlacklisted: t.procedure
    .input(
      z.object({
        chatRoomName: z.string(),
        password: z.string(),
        user_token_hash: z.string(),
      }),
    )
    .subscription(async ({ input }) => {
      const { chatRoomName, password, user_token_hash } = input;
      const chatRoom = await ChatRoomModel.findOne({ name: chatRoomName });
      if (chatRoom === null) throw Error('The chat room does not exist');
      if (
        sha256(password) !== chatRoom.password_hash ||
        chatRoom.blacklisted_user_token_hashes.includes(user_token_hash)
      ) {
        throw new Error('You are unauthorised to access the requested chatRoom');
      }

      return observable<{ reason: string }>((observer) => {
        const onBlacklisted = (blacklistPayload: {
          chatRoomName: string;
          target_user_token_hash: string;
          reason: string;
        }) => {
          if (
            chatRoomName === blacklistPayload.chatRoomName &&
            user_token_hash === blacklistPayload.target_user_token_hash
          ) {
            console.log('firing onselfblacklisted for', blacklistPayload.target_user_token_hash);
            observer.next({ reason: blacklistPayload.reason });
          }
        };
        console.log('sub to onselfblacklisted from', user_token_hash);

        ee.on('memberBlacklisted', onBlacklisted);
        return () => {
          ee.off('memberBlacklisted', onBlacklisted);
        };
      });
    }),
});
