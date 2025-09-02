import { useEffect } from "react";
import { useLocation } from "wouter";

// Lista de rutas que queremos recargar al entrar o salir
const RELOAD_PATHS = ["/store", "/contact"];

// Consideramos móvil si el ancho es menor a 768px
const isMobile = () => window.innerWidth < 768;

const ReloadOnSpecialRoutes: React.FC = () => {
  const [location] = useLocation();

  useEffect(() => {
    if (!isMobile()) return; // solo aplicamos en móviles

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

// // Lista de rutas que queremos recargar al entrar o salir
// const RELOAD_PATHS = ["/store", "/contact"];

// const ReloadOnSpecialRoutes: React.FC = () => {
//   const [location] = useLocation();

//   useEffect(() => {
//     // Revisamos si antes estábamos en alguna ruta especial
//     const wasInSpecial = sessionStorage.getItem("wasInSpecial");

//     // Si antes estábamos en una ruta especial y ahora salimos → recarga
//     if (wasInSpecial && !RELOAD_PATHS.includes(location)) {
//       window.location.reload();
//     }

//     // Si entramos a una ruta especial desde otra ruta → recarga
//     if (RELOAD_PATHS.includes(location)) {
//       const hasReloaded = sessionStorage.getItem(`reload_${location}`);
//       if (!hasReloaded) {
//         sessionStorage.setItem(`reload_${location}`, "true");
//         window.location.reload();
//       }
//       sessionStorage.setItem("wasInSpecial", "true");
//       sessionStorage.setItem("currentSpecial", location);
//     } else {
//       // Ya no estamos en ninguna ruta especial
//       sessionStorage.removeItem("wasInSpecial");
//       sessionStorage.removeItem("currentSpecial");
//       RELOAD_PATHS.forEach(path => sessionStorage.removeItem(`reload_${path}`));
//     }
//   }, [location]);

//   return null;
// };

// export default ReloadOnSpecialRoutes;
