"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Hrani zadnji uspešno oddani e-poštni naslov samo v pomnilniku trenutnega
 * obiska strani (ne v brskalniški shrambi), da ga obiskovalcu ni treba
 * ponovno vpisovati pri drugih izdelkih.
 */
interface InterestSession {
  email: string;
  setEmail: (email: string) => void;
}

const InterestSessionContext = createContext<InterestSession>({
  email: "",
  setEmail: () => {},
});

export function InterestSessionProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState("");
  const value = useMemo(() => ({ email, setEmail }), [email]);
  return (
    <InterestSessionContext.Provider value={value}>
      {children}
    </InterestSessionContext.Provider>
  );
}

export function useInterestSession(): InterestSession {
  return useContext(InterestSessionContext);
}
