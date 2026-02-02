import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Reset password
        </h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>
      <ForgotPasswordForm />
      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/signin"
          className="font-medium text-foreground underline underline-offset-2 hover:text-primary transition-colors"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
