import Link from "next/link";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Create your business account
        </h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Hotels and restaurants: get your own feedback & review growth system.
        </p>
      </div>
      <SignupForm />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/signin"
          className="font-medium text-foreground underline underline-offset-2 hover:text-primary transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
