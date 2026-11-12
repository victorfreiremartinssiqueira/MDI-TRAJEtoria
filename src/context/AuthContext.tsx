import React,{createContext,useContext,useMemo,useState} from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { authenticate,getYoung,hasConsent } from '../database/repositories';
import type {Young} from '../types/models';

type AuthValue={young:Young|null;authenticated:boolean;consentGranted:boolean;grantConsent:()=>void;login:(username:string,password:string)=>Promise<boolean>;logout:()=>void;refreshProfile:()=>Promise<void>};
const AuthContext=createContext<AuthValue|undefined>(undefined);
export function AuthProvider({children}:{children:React.ReactNode}){
 const db=useSQLiteContext();const [young,setYoung]=useState<Young|null>(null);const [consentGranted,setConsentGranted]=useState(false);
 const login=async (username:string,password:string)=>{
  const ok=await authenticate(db,username,password);
  if(ok){setYoung(await getYoung(db));setConsentGranted(await hasConsent(db));} return ok;
 };
 const logout=()=>{setYoung(null);setConsentGranted(false)};
 const grantConsent=()=>setConsentGranted(true);
 const refreshProfile=async()=>{if(young)setYoung(await getYoung(db))};
 const value=useMemo(()=>({young,authenticated:!!young,consentGranted,grantConsent,login,logout,refreshProfile}),[young,consentGranted]);
 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export function useAuth(){const ctx=useContext(AuthContext);if(!ctx)throw new Error('AuthProvider ausente');return ctx}
