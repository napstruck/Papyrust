import { t } from "../trpc/trpcInstance";
import { chatRoomRouter } from "./chat";
import { moderationRouter } from './moderation';

export const appRouter = t.router({
  helloStuti: t.procedure.query(async () => {
    return 'Hi WW 🌻';
  }),

  chat: chatRoomRouter,

  moderation: moderationRouter,
});

export type AppRouter = typeof appRouter;
