import { useState } from "react";
import { login, register } from "../components/services/authService";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ NEW: role selector for signup
  const [signUpRole, setSignUpRole] = useState("student");

  // ✅ NEW: admin passcode (only used if role=admin)
  const [adminPasscode, setAdminPasscode] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const user = await login(email, password);
      const role = String(user.role || "").toLowerCase();

      if (role === "admin") navigate("/admin");
      else navigate("/student");
    } catch (e) {
      alert(e.message || "Invalid login");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      if (!fullName.trim()) {
        alert("Full name is required.");
        return;
      }

      // ✅ If trying to sign up as admin, require passcode
      if (signUpRole === "admin" && !adminPasscode.trim()) {
        alert("Admin passcode is required for admin signup.");
        return;
      }

      // ✅ Send role + admin secret only when needed
      const user = await register(fullName, email, password, {
        role: signUpRole,
        admin_secret: signUpRole === "admin" ? adminPasscode : undefined,
      });

      const role = String(user.role || "").toLowerCase();
      if (role === "admin") navigate("/admin");
      else navigate("/student");
    } catch (e) {
      alert(e.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (loading) return;
    if (isSignUp) handleSignUp();
    else handleLogin();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0d47a1",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "10px",
          width: "320px",
        }}
      >
        <h2 style={{ textAlign: "center" }}>{isSignUp ? "Sign Up" : "Login"}</h2>

        {isSignUp && (
          <>
            <input
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
            />

            {/* ✅ NEW: Role dropdown */}
            <select
              value={signUpRole}
              onChange={(e) => setSignUpRole(e.target.value)}
              style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
            >
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>

            {/* ✅ NEW: Admin passcode only if admin */}
            {signUpRole === "admin" && (
              <input
                type="password"
                placeholder="Admin passcode"
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
              />
            )}
          </>
        )}

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", marginBottom: "15px", padding: "8px" }}
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            background: "#0d47a1",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.8 : 1,
          }}
        >
          {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Login"}
        </button>

        <div style={{ textAlign: "center", marginTop: "15px" }}>
          <span style={{ fontSize: "14px", color: "#666" }}>
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
          </span>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            style={{
              background: "none",
              border: "none",
              color: "#0d47a1",
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: "14px",
            }}
          >
            {isSignUp ? "Login" : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}