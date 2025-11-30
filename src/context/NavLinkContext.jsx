import { createContext, useState } from "react";

export const NavLinkContext = createContext();

function NavLinkProvider({ children }) {
  const [navLink, setNavLink] = useState("profile");

  return (
    <NavLinkContext.Provider value={{ navLink, setNavLink }}>
      {children}
    </NavLinkContext.Provider>
  );
}

export default NavLinkProvider;
