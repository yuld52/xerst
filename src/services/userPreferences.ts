import { apiRequest } from "@/services/api";

export type UserPreferences = Record<string, unknown>;

export function fetchUserPreferences(): Promise<UserPreferences> {
  return apiRequest<UserPreferences>("/profile/preferences");
}

export function updateUserPreferences(preferences: UserPreferences): Promise<UserPreferences> {
  return apiRequest<UserPreferences>("/profile/preferences", {
    method: "PUT",
    body: { preferences },
  });
}
