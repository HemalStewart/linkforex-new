import { redirect } from "next/navigation";

export default function SignUpVariantTwoRedirect() {
  redirect("/sign-in");
}
