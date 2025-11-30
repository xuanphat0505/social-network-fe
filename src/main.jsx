import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

import { store, persistor } from "./redux/store.js";
import NavLinkProvider from "./context/NavLinkContext.jsx";
import ThemeProvider from "./context/ThemeContext.jsx";
import OpenProvider from "./context/OpenContext.jsx";
import IsEmptyProvider from "./context/IsEmptyContext.jsx";
import SocketProvider from "./context/SocketContext.jsx";
import AxiosProvider from "./context/AxiosContext.jsx";
import App from "./App.jsx";

import "./index.scss";
import "swiper/scss";
import "swiper/scss/navigation";
import "swiper/scss/pagination";
import "tippy.js/dist/tippy.css";
import "driver.js/dist/driver.css";
import "./utils/i18n.js";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <PersistGate persistor={persistor} loading={null}>
      <StrictMode>
        <NavLinkProvider>
          <OpenProvider>
            <ThemeProvider>
              <IsEmptyProvider>
                <AxiosProvider>
                  <SocketProvider>
                    <BrowserRouter>
                      <App />
                    </BrowserRouter>
                  </SocketProvider>
                </AxiosProvider>
              </IsEmptyProvider>
            </ThemeProvider>
          </OpenProvider>
        </NavLinkProvider>
      </StrictMode>
    </PersistGate>
  </Provider>
);
