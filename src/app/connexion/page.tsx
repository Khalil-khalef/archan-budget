import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function ConnexionPage() {
  const session = await getSession();
  if (session) redirect("/");

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-page px-4 py-10">
      <LoginForm />
    </main>
  );
}
