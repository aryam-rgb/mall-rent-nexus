import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Mail, Lock, User, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const AuthPage = () => {
  const [isLogin] = useState(true); // Only login allowed
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(identifier, password);
      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">
            Welcome Back
          </CardTitle>
          <CardDescription>
            Sign in to access your mall management dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Username or Email
              </Label>
              <Input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your username or email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-4">
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-3">
                Multi-Tenant Access Control
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-red-50 dark:bg-red-950 p-2 rounded border">
                  <UserCheck className="h-4 w-4 mx-auto mb-1 text-red-600" />
                  <div className="font-medium text-red-700 dark:text-red-300">Super Admin</div>
                  <div className="text-red-600 dark:text-red-400">Full Control</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded border">
                  <Building2 className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                  <div className="font-medium text-blue-700 dark:text-blue-300">Landlord</div>
                  <div className="text-blue-600 dark:text-blue-400">Property Mgmt</div>
                </div>
                <div className="bg-green-50 dark:bg-green-950 p-2 rounded border">
                  <User className="h-4 w-4 mx-auto mb-1 text-green-600" />
                  <div className="font-medium text-green-700 dark:text-green-300">Tenant</div>
                  <div className="text-green-600 dark:text-green-400">View & Pay</div>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Access restricted to authorized users only.
              <br />
              Contact your administrator for account creation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};