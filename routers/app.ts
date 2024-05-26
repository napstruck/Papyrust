import { t } from "../trpc/trpcInstance";
import { chatRoomRouter } from "./chat";

export const appRouter = t.router({
  helloStuti: t.procedure.query(async () => {
    return "Hi WW 🌻";
  }),

  chat: chatRoomRouter,
});

export type AppRouter = typeof appRouter;
