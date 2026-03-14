import { useMemo, useState, FormEvent, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/auth/AuthLayout";
import FormMessage from "@/components/auth/FormMessage";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { user, loading, company } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!loading && user && company) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, company, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F7FB]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  const denied = useMemo(() => {
    const fromUrl = searchParams.get("denied") === "1";
    const fromStorage = typeof window !== 'undefined' && localStorage.getItem("auth_denied") === "1";
    if (fromStorage) {
      localStorage.removeItem("auth_denied");
    }
    return fromUrl || fromStorage;
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setSubmitError("Invalid email or password.");
        setIsSubmitting(false);
        return;
      }
      // Ensure user is loaded from session
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData?.user?.email) {
        setSubmitError("Invalid email or password.");
        setIsSubmitting(false);
        return;
      }
      const authedEmail = (userData.user.email || "").trim();

      // Validate against companies allowlist
      const { data: company, error: companyErr } = await supabase
        .from("companies")
        .select("trade_name, gstin")
        .ilike("email", authedEmail)
        .maybeSingle();

      if (companyErr || !company) {
        await supabase.auth.signOut();
        setSubmitError("Access denied. This account is not registered in the system.");
        setIsSubmitting(false);
        return;
      }
      navigate("/dashboard", { replace: true });
    } catch {
      setSubmitError("Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your account">
      <form onSubmit={handleSubmit} className="space-y-5">
        {submitError && <FormMessage type="error" message={submitError} />}

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your Gmail address"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
        </div>

        <Button type="submit" className="w-full h-11 font-medium" disabled={isSubmitting}>
          {isSubmitting ? "Signing In..." : "Login"}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-6">
        
        </p>
      </form>
    </AuthLayout>
  );
};

export default Login;
