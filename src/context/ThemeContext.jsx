import { createContext, useContext, useState, useEffect } from "react";
import { themes } from "../theme/studentTheme";


const ThemeContext = createContext();

export function ThemeProvider({ children }) {
	const [themeName, setThemeName] = useState(
		localStorage.getItem("theme") || "dark"
	);

	useEffect(() => {
		localStorage.setItem("theme", themeName);
	}, [themeName]);

	const toggleTheme = () => {
		setThemeName(prev => (prev === "dark" ? "light" : "dark"));
	};

	return (
		<ThemeContext.Provider
			value={{
				themeName,
				theme: themes[themeName],
				toggleTheme
			}}
		>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	return useContext(ThemeContext);
}