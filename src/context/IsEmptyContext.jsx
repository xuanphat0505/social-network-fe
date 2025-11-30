import { createContext, useState } from "react";

export const IsEmptyContext = createContext();

function IsEmptyProvider({ children }) {
  const [isEmpty, setIsEmpty] = useState(false);

  return (
    <IsEmptyContext.Provider value={{ isEmpty, setIsEmpty }}>
      {children}
    </IsEmptyContext.Provider>
  );
}

export default IsEmptyProvider;
