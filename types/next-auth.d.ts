import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      imageUrl: string;
      role: "user" | "staff" | "admin";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}