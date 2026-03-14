import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import FormMessage from "@/components/auth/FormMessage";
import { supabase } from "@/lib/supabase";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const finalize = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }

        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (session?.user) {
          // Allowlist check: ensure the email exists in companies
          const email = session.user.email;
          if (email) {
            const { data: company } = await supabase
              .from("companies")
              .select("gstin")
              .eq("email", email)
              .maybeSingle();
            if (!company) {
              try { localStorage.setItem("auth_denied", "1"); } catch (_e) { void 0; }
              await supabase.auth.signOut();
              navigate("/login?denied=1", { replace: true });
              return;
            }
          }
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
      } catch (e) {
        setError("There was a problem verifying your email. Please sign in.");
      } finally {
        setVerifying(false);
      }
    };
    finalize();
  }, [navigate]);

  return (
    <AuthLayout title="Verifying your email…" subtitle="Completing sign-in">
      <div className="space-y-4">
        {error && <FormMessage type="error" message={error} />}
        {verifying && (
          <div className="h-11 w-full flex items-center justify-center">
            <div className="animate-pulse h-2 w-32 bg-muted rounded" />
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default AuthCallback;
