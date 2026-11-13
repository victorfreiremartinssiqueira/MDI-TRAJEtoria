import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { authenticate, getYoung, hasConsent } from '../database/repositories';
import { createSessionDatabase } from '../database/session';
import type { Young } from '../types/models';
type AuthValue = { young: Young | null; authenticated: boolean; consentGranted: boolean; database: SQLiteDatabase; grantConsent: () => void; login: (username: string, password: string) => Promise<boolean>; logout: () => void; refreshProfile: () => Promise<void> };
const AuthContext = createContext<AuthValue | undefined>(undefined);
export function AuthProvider({ children }: { children: React.ReactNode }) {
 const raw = useSQLiteContext();
 const [young, setYoung] = useState<Young | null>(null);
 const [consentGranted, setConsentGranted] = useState(false);
 const [database, setDatabase] = useState(raw);
 const generation = useRef(0);
 const session = useRef<ReturnType<typeof createSessionDatabase> | null>(null);
 const logout = () => { generation.current++; session.current?.close(); session.current=null; setYoung(null); setConsentGranted(false); setDatabase(raw); };
 const login = async (username: string, password: string) => {
  const attempt = ++generation.current;
  const profile = await authenticate(raw, username, password);
  if (attempt !== generation.current || !profile) return false;
  const candidate = createSessionDatabase(raw, profile.id);
  try {
   const consent = await hasConsent(candidate.db);
   if (attempt !== generation.current) { candidate.close(); return false; }
   session.current?.close(); session.current=candidate;
   setDatabase(candidate.db); setYoung(profile); setConsentGranted(consent); return true;
  } catch (error) { candidate.close(); throw error; }
 };
 const refreshProfile = async () => {
  const active=session.current; const version=generation.current;
  if (!active) return;
  const profile=await getYoung(active.db);
  if (version===generation.current && session.current===active) setYoung(profile);
 };
 const grantConsent = () => { if(session.current)setConsentGranted(true); };
 const value=useMemo(()=>({ young, authenticated:!!young, consentGranted, database, grantConsent, login, logout, refreshProfile }),[young,consentGranted,database]);
 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(){const ctx=useContext(AuthContext);if(!ctx)throw new Error('AuthProvider ausente');return ctx;}
export function useAuthDatabase(){return useAuth().database;}
