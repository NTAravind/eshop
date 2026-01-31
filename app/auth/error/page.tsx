import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AuthErrorPage({
    searchParams,
}: {
    searchParams: { error?: string };
}) {
    const error = searchParams.error;

    let errorMessage = "An unknown error occurred.";
    if (error === "Configuration") {
        errorMessage = "There is a problem with the server configuration. Please contact support.";
    } else if (error === "AccessDenied") {
        errorMessage = "You do not have permission to sign in.";
    } else if (error === "Verification") {
        errorMessage = "The sign in link is no longer valid. It may have been used already or it may have expired.";
    } else if (error) {
        errorMessage = error;
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <AlertCircle className="h-12 w-12 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-destructive">Authentication Error</CardTitle>
                    <CardDescription>
                        We ran into an issue while trying to sign you in.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-muted-foreground">{errorMessage}</p>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button asChild>
                        <Link href="/login">Return to Sign In</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
