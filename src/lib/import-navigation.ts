import { useCallback } from "react";
import {
  Outlet,
  useLocation as useRouterLocation,
  useNavigate as useRouterNavigate,
} from "@tanstack/react-router";

export { Outlet };
export type NavigateFunction = (
  path: string,
  options?: { replace?: boolean; state?: Record<string, unknown> },
) => void;

export function useNavigate(): NavigateFunction {
  const navigate = useRouterNavigate();
  return useCallback(
    (path, options) => {
      void navigate({
        to: path,
        replace: options?.replace,
        state: (previous) => ({ ...previous, ...options?.state }),
      });
    },
    [navigate],
  );
}

export function useLocation() {
  return useRouterLocation();
}

export function useSearchParams(): [URLSearchParams] {
  const location = useRouterLocation();
  return [new URLSearchParams(location.searchStr)];
}
