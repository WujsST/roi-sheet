import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-app">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-bg-card border border-border-subtle shadow-xl"
          }
        }}
      />
    </div>
  )
}
