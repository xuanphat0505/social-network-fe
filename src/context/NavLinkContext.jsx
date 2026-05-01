import { createContext, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export const NavLinkContext = createContext();

function NavLinkProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Lấy tab từ query param, mặc định là 'profile'
  const navLink = searchParams.get("tab") || "profile";

  // Hàm cập nhật tab bằng cách update search params
  const setNavLink = useCallback(
    (newTab) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (newTab && newTab !== "profile") {
          next.set("tab", newTab);
        } else {
          next.delete("tab"); // Nếu là profile thì xóa param cho gọn URL
        }
        return next;
      });
    },
    [setSearchParams]
  );

  return (
    <NavLinkContext.Provider value={{ navLink, setNavLink }}>
      {children}
    </NavLinkContext.Provider>
  );
}

export default NavLinkProvider;

