import {DatabaseBoundary} from '../src/components/DatabaseBoundary';
import React,{Suspense} from 'react';
import {Stack} from 'expo-router';
import {SQLiteProvider} from 'expo-sqlite';
import {ActivityIndicator,View} from 'react-native';
import {useFonts} from 'expo-font';
import {CormorantGaramond_500Medium,CormorantGaramond_600SemiBold} from '@expo-google-fonts/cormorant-garamond';
import {Jost_400Regular,Jost_500Medium,Jost_600SemiBold,Jost_700Bold} from '@expo-google-fonts/jost';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {initializeDatabase,DATABASE_NAME} from '../src/database/connection';
import {AuthProvider} from '../src/context/AuthContext';
import {colors} from '../src/constants/theme';

function Splash(){return <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:colors.ivory}}><ActivityIndicator color={colors.purple} size="large"/></View>}
export default function RootLayout(){
 const [loaded,error]=useFonts({CormorantGaramond_500Medium,CormorantGaramond_600SemiBold,Jost_400Regular,Jost_500Medium,Jost_600SemiBold,Jost_700Bold});
 if(!loaded&&!error) return <Splash/>;
 return <DatabaseBoundary><SafeAreaProvider><Suspense fallback={<Splash/>}><SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabase} useSuspense>
  <AuthProvider><StatusBar style="light"/><Stack screenOptions={{headerShown:false,animation:'fade'}}>
   <Stack.Screen name="index"/><Stack.Screen name="consentimento"/><Stack.Screen name="(jovem)"/>
  </Stack></AuthProvider>
 </SQLiteProvider></Suspense></SafeAreaProvider></DatabaseBoundary>
}


