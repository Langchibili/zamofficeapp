import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAgentAuth } from "@/hooks/useAgentAuth";

export default function Index() {
  const navigate = useNavigate();
  const { token } = useAgentAuth();

  useEffect(() => {
    if (token) navigate("/agent/dashboard", { replace: true });
    else navigate("/agent/login", { replace: true });
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting…</p>
    </div>
  );
}
