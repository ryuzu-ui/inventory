import { useState, useEffect } from "react";
import { login, register } from "../components/services/authService";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";

import logo1 from "../assets/logo1.jpg";

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

function FloatingInput({ label, type = "text", value, onChange }) {
	const [isFocused, setIsFocused] = useState(false);
	const [hasValue, setHasValue] = useState(false);

	useEffect(() => {
		setHasValue(!!value);
	}, [value]);

	const isActive = isFocused || hasValue;

	return (
		<div style={styles.inputGroup}>
			<input
				type={type}
				value={value}
				onChange={onChange}
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
				style={styles.input}
			/>
			<label
				style={{
					...styles.label,
					top: isActive ? "-10px" : "50%",
					fontSize: isActive ? "12px" : "14px",
					color: "#9aa0a6",
				}}
			>
				{label}
			</label>
		</div>
	);
}

export default function LoginPage() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );
  const [loginValue, setLoginValue] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [section, setSection] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  

  const toast = useToast();
  const [signUpRole, setSignUpRole] = useState("student");
  const [adminPasscode, setAdminPasscode] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const user = await login(loginValue, password);
      const role = String(user.role || "").toLowerCase();
      if (role === "admin") navigate("/admin", { replace: true });
      else navigate("/student", { replace: true });
    } catch (e) {
      toast.push({ type: "error", title: "Login failed", description: e.message || "Invalid login" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      if (!firstName.trim()) {
        toast.push({ type: "warning", title: "Missing information", description: "First name is required." });
        return;
      }
      if (!lastName.trim()) {
        toast.push({ type: "warning", title: "Missing information", description: "Last name is required." });
        return;
      }
      if (!email.trim()) {
        toast.push({ type: "warning", title: "Missing information", description: "Email is required." });
        return;
      }
      if (!idNumber.trim()) {
        toast.push({ type: "warning", title: "Missing information", description: "ID Number is required." });
        return;
      }
      if (!section.trim()) {
        toast.push({ type: "warning", title: "Missing information", description: "Section is required." });
        return;
      }
      if (signUpRole === "admin" && !adminPasscode.trim()) {
        toast.push({ type: "warning", title: "Missing information", description: "Admin passcode is required for admin signup." });
        return;
      }

      const user = await register({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        school_id: idNumber,
        section,
        role: signUpRole,
        admin_secret: signUpRole === "admin" ? adminPasscode : undefined,
      });

      const role = String(user.role || "").toLowerCase();
      if (role === "admin") navigate("/admin", { replace: true });
      else navigate("/student", { replace: true });
    } catch (e) {
      toast.push({ type: "error", title: "Sign up failed", description: e.message || "Sign up failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (loading) return;
    if (isSignUp) handleSignUp();
    else handleLogin();
  };

  const mobileInputStyle = isMobile ? { fontSize: "16px" } : null;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>

        {/* Logo */}
        <img
          src={logo1}
          alt="Lyceum Logo"
          style={{
            width: "110px",
            height: "110px",
            objectFit: "contain",
            marginBottom: "6px",
            borderRadius: "50%",
          }}
        />

        {/* School Name */}
        <div style={{ textAlign: "center", marginBottom: "14px" }}>
          <p style={{ color: "#FFD700", fontWeight: 700, fontSize: "16px", margin: 0 }}>
            Lyceum of Alabang
          </p>
          <p style={{ color: "#90caf9", fontSize: "12px", margin: 0 }}>
            College of Tourism & Hospitality Management
          </p>
        </div>

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
              <FloatingInput label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              <FloatingInput label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              <FloatingInput label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <FloatingInput label="ID Number" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
              <FloatingInput label="Section" value={section} onChange={(e) => setSection(e.target.value)} />

                <select value={signUpRole} onChange={(e) => setSignUpRole(e.target.value)} style={{ ...inputStyle, ...(mobileInputStyle || {}) }}> 
                  <option value="student">Student</option> 
                  <option value="admin">Admin</option> 
                </select>

              {signUpRole === "admin" && (
                <FloatingInput
                  label="Admin passcode"
                  type="password"
                  value={adminPasscode}
                  onChange={(e) => setAdminPasscode(e.target.value)}
                />
              )}

              <FloatingInput
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </>
          ) : (
            <>
            <FloatingInput
              label="Email or ID Number"
              value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)}
            />

            <FloatingInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />  
            </>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              display: "block",
              margin: "0 auto",
              width: "100%",
              padding: "12px",
              marginTop: "6px",
              background: "#0d47a1",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: 600,
              opacity: loading ? 0.5 : 1,
              pointerEvents: loading ? "none" : "auto",
            }}
          >
            {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Login"}
          </button>

          <div style={{ textAlign: "center", marginTop: "18px" }}>
            <span style={{ fontSize: "14px", color: "#666" }}>
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
            </span>
            <button onClick={() => setIsSignUp(!isSignUp)} style={styles.linkButton}>
              {isSignUp ? "Login" : "Sign Up"}
            </button>
          </div>
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

  inputGroup: {
    position: "relative",
    marginBottom: "24px",
  },

  input: {
    width: "100%",
    padding: "12px 10px",
    border: "1px solid #dadce0",
    borderRadius: "6px",
    fontSize: "14px",
    outline: "none",
  },

  label: {
    position: "absolute",
    left: "10px", // 👈 ibalik mo sa original spacing mo
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent", // 👈 FIX
    padding: "0", // 👈 tanggal padding para di mukhang patch
    color: "#9aa0a6",
    fontSize: "14px",
    pointerEvents: "none",
    transition: "0.2s ease",
  },
};