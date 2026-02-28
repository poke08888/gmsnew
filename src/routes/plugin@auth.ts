import { QwikAuth$ } from "@auth/qwik";
import Credentials from "@auth/qwik/providers/credentials";
import { User } from "~/models/user.model";
import { connectDB, clientPromise } from "~/libs/db";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { AuthUser } from '~/services/user.service';
export const { onRequest, useSession, useSignIn, useSignOut } = QwikAuth$(
  () => ({
    providers: [Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "username" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // return { id: "1", name: "Admin Test", email: "admin@test.com" };
        await connectDB();
        // console.log('Authorizing user with credentials:', credentials);
        const user = await User.findOne({ username: credentials?.username as any });
        // console.log('User found in database:', user);
        const isValid = await AuthUser(credentials?.username as any, credentials?.password as any);
        if (!user) return null;
        if (user && isValid) {
          // console.log('User authorized successfully:', user);
          return user.toObject() as { _id : string, name: string, email: string, role: string };
          // return {
          //   id: user._id.toString(),
          //   name: user.name,
          //   email: user.email
          // }
        }
        return null;
      }
    })],
    // adapter: MongoDBAdapter(clientPromise),
    session: {
      strategy: "jwt",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    },
    pages: {
      signIn: '/login',
      error: '/login',
    },
    secret: process.env.AUTH_SECRET || "yrqfrrpaues0lngntl2cb2thj81i0a93",
    callbacks: {
      async jwt({token, user}) {
        if (user) {
          token.id = (user as { _id: string })._id;
        }
        return token;
      },
      async session({ session, token }) {
        if (token) {
          (session.user as any)._id = token.id;
        }
        return session;
      }
    }
  }),
);
