import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-app">
      <SignUp
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
