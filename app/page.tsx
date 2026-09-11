import { redirect } from "next/navigation";

export default function HomePage() {
  // Direct entry points to login page for session verification
  redirect("/login");
}
