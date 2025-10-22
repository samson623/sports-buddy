import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-[100vh] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication Error</CardTitle>
          <CardDescription>
            There was a problem completing your sign-in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The authentication code may have expired or been used already. Please try signing in again.
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/login">
              <Button className="w-full">Back to Login</Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" className="w-full">Back to Signup</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
