import { ClipLoader } from "react-spinners";
import { useContext } from "react";

import { ThemeContext } from "../../context/ThemeContext";

function Loader() {
  const { theme } = useContext(ThemeContext);
  return <ClipLoader 
  color={theme === "dark" ? "#a6b0cf" : "fff"} size={16} />;
}

export default Loader;
