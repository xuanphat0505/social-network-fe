import { createContext, useEffect } from "react";
import { useState } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext();

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // lấy từ localStorage hoặc mặc định là "dark"
    return localStorage.getItem("theme") || "dark";
  });
  useEffect(() => {
    // cập nhật attribute cho HTML
    document.documentElement.setAttribute("data-bs-theme", theme);
    localStorage.setItem("theme", theme); // lưu lại
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };
  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
