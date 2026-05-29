import { auth } from "@clerk/nextjs/server"
import { Header } from "./Header"

export async function HeaderWrapper() {
  const { userId } = await auth()
  return <Header isSignedIn={!!userId} />
}
