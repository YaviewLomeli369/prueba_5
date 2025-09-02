import { useEffect } from "react";
import { useLocation } from "wouter";

// Lista de rutas que queremos recargar al entrar o salir
const RELOAD_PATHS = ["/store", "/contact"];

const ReloadOnSpecialRoutes: React.FC = () => {
  const [location] = useLocation();

  useEffect(() => {
    // Revisamos si antes estábamos en alguna ruta especial
    const wasInSpecial = sessionStorage.getItem("wasInSpecial");

    // Si antes estábamos en una ruta especial y ahora salimos → recarga
    if (wasInSpecial && !RELOAD_PATHS.includes(location)) {
      window.location.reload();
    }

    // Si entramos a una ruta especial desde otra ruta → recarga
    if (RELOAD_PATHS.includes(location)) {
      const hasReloaded = sessionStorage.getItem(`reload_${location}`);
      if (!hasReloaded) {
        sessionStorage.setItem(`reload_${location}`, "true");
        window.location.reload();
      }
      sessionStorage.setItem("wasInSpecial", "true");
      sessionStorage.setItem("currentSpecial", location);
    } else {
      // Ya no estamos en ninguna ruta especial
      sessionStorage.removeItem("wasInSpecial");
      sessionStorage.removeItem("currentSpecial");
      RELOAD_PATHS.forEach(path => sessionStorage.removeItem(`reload_${path}`));
    }
  }, [location]);

  return null;
};

export default ReloadOnSpecialRoutes;

// import { useEffect } from "react";
// import { useLocation } from "wouter";

// const ReloadOnStore: React.FC = () => {
//   const [location] = useLocation();

//   useEffect(() => {
//     const wasInStore = sessionStorage.getItem("wasInStore");

//     // Si antes estábamos en /store y ahora salimos → recarga
//     if (wasInStore === "true" && location !== "/store") {
//       window.location.reload();
//     }

//     // Si entramos a /store desde cualquier otra ruta → recarga
//     if (location === "/store") {
//       const hasReloaded = sessionStorage.getItem("storeReloaded");
//       if (!hasReloaded) {
//         sessionStorage.setItem("storeReloaded", "true");
//         window.location.reload();
//       }
//       sessionStorage.setItem("wasInStore", "true");
//     } else {
//       // marcamos que ya no estamos en /store
//       sessionStorage.removeItem("wasInStore");
//       sessionStorage.removeItem("storeReloaded");
//     }
//   }, [location]);

//   return null;
// };

// export default ReloadOnStore;