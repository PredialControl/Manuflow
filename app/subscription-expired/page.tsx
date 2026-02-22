import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";

export default async function SubscriptionExpiredPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 bg-rose-500/10 rounded-xl flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-rose-500" />
            </div>
            <CardTitle className="text-2xl font-bold">Assinatura Expirada</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            A assinatura da sua empresa expirou ou foi suspensa. Entre em contato com o administrador para renovar o acesso.
          </p>
          <div className="pt-4">
            <SignOutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
