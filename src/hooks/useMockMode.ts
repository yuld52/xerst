import { useState, useEffect } from "react";
import { useLocation } from "@/lib/import-navigation";
import { isImportDemo } from "@/lib/import-demo";

export function useMockMode() {
  const [isMock, setIsMock] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const check = () => {
      setIsMock(isImportDemo());
    };

    check();

    // Observa mudanças no sessionStorage (ex: ao navegar com ?mock=true)
    window.addEventListener("storage", check);
    return () => window.removeEventListener("storage", check);
  }, [location.pathname, location.searchStr]);

  const deactivateMock = () => {
    sessionStorage.removeItem("mock_mode");
    setIsMock(false);

    // Remove ?mock=true da URL e recarrega para buscar dados reais
    const url = new URL(window.location.href);
    url.searchParams.delete("mock");
    window.location.replace(url.toString());
  };

  return { isMock, deactivateMock };
}
