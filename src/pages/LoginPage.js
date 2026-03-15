import { useState } from "react";
import { login, register } from "../components/services/authService";
import { useNavigate } from "react-router-dom";

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "12px",
  boxSizing: "border-box",
  border: "1px solid #dadce0",
  borderRadius: "6px",
  fontSize: "14px",
  height: "40px"
};

export default function LoginPage() {
  const [loginValue, setLoginValue] = useState("");
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const [signUpRole, setSignUpRole] = useState("student");
  const [adminPasscode, setAdminPasscode] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const user = await login(loginValue, password);

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

      if (!email.trim()) {
        alert("Email is required.");
        return;
      }

      if (!idNumber.trim()) {
        alert("ID Number is required.");
        return;
      }

      if (signUpRole === "admin" && !adminPasscode.trim()) {
        alert("Admin passcode is required for admin signup.");
        return;
      }

      const user = await register(fullName, email, password, {
        school_id: idNumber,
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
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          {isSignUp ? "Sign Up" : "Login"}
        </h2>

        {isSignUp ? (
          <>
            <input
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={inputStyle}
            />

            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />

            <input
              placeholder="ID Number"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              style={inputStyle}
            />

            <select
              value={signUpRole}
              onChange={(e) => setSignUpRole(e.target.value)}
              style={inputStyle}
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
                style={inputStyle}
              />
            )}

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </>
        ) : (
          <>
            <input
              placeholder="Email or ID Number"
              value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)}
              style={inputStyle}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.5 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
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
  button: {
    display: "block",
    margin: "0 auto",
    width: "100%",
    padding: "12px",
    marginTop: "6px",
    background: "#0d47a1",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 600,
    opacity: 1,
  },
  linkButton: {
    background: "none",
    border: "none",
    color: "#0d47a1",
    cursor: "pointer",
    textDecoration: "underline",
    fontSize: "14px",
    padding: 0,
  },
};