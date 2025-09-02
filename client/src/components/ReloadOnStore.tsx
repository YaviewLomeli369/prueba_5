import { useEffect } from "react";
import { useLocation } from "wouter";

const ReloadOnStore: React.FC = () => {
  const [location] = useLocation();

  useEffect(() => {
    const wasInStore = sessionStorage.getItem("wasInStore");

    // Si antes estábamos en /store y ahora salimos → recarga
    if (wasInStore === "true" && location !== "/store") {
      window.location.reload();
    }

    // Si entramos a /store desde cualquier otra ruta → recarga
    if (location === "/store") {
      const hasReloaded = sessionStorage.getItem("storeReloaded");
      if (!hasReloaded) {
        sessionStorage.setItem("storeReloaded", "true");
        window.location.reload();
      }
      sessionStorage.setItem("wasInStore", "true");
    } else {
      // marcamos que ya no estamos en /store
      sessionStorage.removeItem("wasInStore");
      sessionStorage.removeItem("storeReloaded");
    }
  }, [location]);

  return null;
};

export default ReloadOnStore;