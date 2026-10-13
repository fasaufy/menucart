import { redirect } from "next/navigation";

// The Welcome screen takes over "/" for signed-out users in step 6.
export default function Home() {
  redirect("/plan");
}
