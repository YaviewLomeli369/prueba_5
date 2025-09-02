import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

const ReloadOnStore: React.FC = () => {
  const [location] = useLocation();
  const previousWasStore = useRef(false);

  useEffect(() => {
    // Usamos sessionStorage para evitar loop infinito
    const hasReloaded = sessionStorage.getItem("storeReloaded");

    if (!hasReloaded) {
      if (location === "/store" || previousWasStore.current) {
        sessionStorage.setItem("storeReloaded", "true"); // marca recarga
        window.location.reload();
      }
    } else {
      // Limpiamos la marca si ya estamos fuera de /store
      if (location !== "/store") {
        sessionStorage.removeItem("storeReloaded");
      }
    }

    previousWasStore.current = location === "/store";
  }, [location]);

  return null;
};

export default ReloadOnStore;