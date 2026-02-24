import { useState } from "react";
import { login, register } from "../components/services/authService";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const [signUpRole, setSignUpRole] = useState("student");
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

      if (signUpRole === "admin" && !adminPasscode.trim()) {
        alert("Admin passcode is required for admin signup.");
        return;
      }

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
        margin: 0,
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0d47a1",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "12px",
          width: "350px",
          boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          {isSignUp ? "Sign Up" : "Login"}
        </h2>

        {isSignUp && (
          <>
            <input
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={styles.input}
            />

            <select
              value={signUpRole}
              onChange={(e) => setSignUpRole(e.target.value)}
              style={styles.input}
            >
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>

            {signUpRole === "admin" && (
              <input
                type="password"
                placeholder="Admin passcode"
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                style={styles.input}
              />
            )}
          </>
        )}

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ ...styles.input, marginBottom: "20px" }}
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={styles.button}
        >
          {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Login"}
        </button>

        <div style={{ textAlign: "center", marginTop: "18px" }}>
          <span style={{ fontSize: "14px", color: "#666" }}>
            {isSignUp
              ? "Already have an account? "
              : "Don't have an account? "}
          </span>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            style={styles.linkButton}
          >
            {isSignUp ? "Login" : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  input: {
    width: "100%",
    marginBottom: "12px",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
  },
  button: {
    display: "block",
    margin: "0 auto",
    width: "220px",
    padding: "10px",
    background: "#0d47a1",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  linkButton: {
    background: "none",
    border: "none",
    color: "#0d47a1",
    cursor: "pointer",
    textDecoration: "underline",
    fontSize: "14px",
  },
};