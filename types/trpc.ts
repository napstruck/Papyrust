import { z } from 'zod';

export const SendMessageInputZSchema = z.object({
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
  chatRoomName: z.string(),
  password: z.string(),
});

export const MessageBodyZSchema = z.object({
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
});

export const MemberChangeZSchema = z.object({
  user_token_hash: z.string(),
  userName: z.string(),
  chatRoomName: z.string(),
});