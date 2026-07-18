import { redirect } from "next/navigation";

/** The journey always begins at consent. */
export default function RootPage() {
  redirect("/consent");
}
