import { redirect } from "next/navigation";

export default function SignUpVariantThreeRedirect() {
  redirect("/sign-in");
}
