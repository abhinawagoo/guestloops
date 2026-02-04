import Link from "next/link";
import { SigninForm } from "./signin-form";

const ERROR_MESSAGES: Record<string, string> = {
  auth_callback_error: "Sign-in failed. Please try again.",
  missing_code: "Missing authorization. Please try again.",
  config: "Sign-in is not configured.",
  no_tenant: "Your account is not linked to a business. Please sign up first or contact support.",
};

export default async function SigninPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorCode } = await searchParams;
  const errorMessage = errorCode ? ERROR_MESSAGES[errorCode] ?? "Something went wrong." : null;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Sign in to your account
        </h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Use your email or sign in with Google.
        </p>
      </div>
      {errorMessage && (
        <p className="text-center text-sm text-destructive rounded-xl bg-destructive/10 py-3 px-4 border border-destructive/20">
          {errorMessage}
        </p>
      )}
      <SigninForm />
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground underline underline-offset-2 hover:text-primary transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
