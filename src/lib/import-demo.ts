export function isImportDemo(): boolean {
  if (typeof window === "undefined") return false;
  const mock = new URLSearchParams(window.location.search).get("mock");
  if (mock === "true") sessionStorage.setItem("mock_mode", "true");
  if (mock === "false") sessionStorage.removeItem("mock_mode");
  return sessionStorage.getItem("mock_mode") === "true";
}

export const demoUser = { id: 0, name: "Demonstração", email: "", role: "owner" };
