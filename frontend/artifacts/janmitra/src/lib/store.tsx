import React, { createContext, useContext, useEffect, useState } from "react";
import { ChatMessageRequestLanguage, ChatMessageRequestUserType } from "@workspace/api-client-react";

interface UserPreferencesContextType {
  sessionId: string;
  language: ChatMessageRequestLanguage;
  userType: ChatMessageRequestUserType;
  setLanguage: (lang: ChatMessageRequestLanguage) => void;
  setUserType: (type: ChatMessageRequestUserType) => void;
}

const defaultPreferences = {
  sessionId: crypto.randomUUID(),
  language: ChatMessageRequestLanguage.english,
  userType: ChatMessageRequestUserType.general,
};

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem("janmitra-preferences");
    if (saved) {
      try {
        return { ...defaultPreferences, ...JSON.parse(saved) };
      } catch (e) {
        // ignore
      }
    }
    return defaultPreferences;
  });

  useEffect(() => {
    localStorage.setItem("janmitra-preferences", JSON.stringify(preferences));
  }, [preferences]);

  const value = {
    ...preferences,
    setLanguage: (language: ChatMessageRequestLanguage) => setPreferences((p: any) => ({ ...p, language })),
    setUserType: (userType: ChatMessageRequestUserType) => setPreferences((p: any) => ({ ...p, userType })),
  };

  return <UserPreferencesContext.Provider value={value}>{children}</UserPreferencesContext.Provider>;
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context) throw new Error("useUserPreferences must be used within UserPreferencesProvider");
  return context;
}
