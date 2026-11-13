import React from 'react';
import {Stack,Redirect} from 'expo-router';
import {useAuth} from '../../src/context/AuthContext';
export default function YoungLayout(){const{authenticated,consentGranted}=useAuth();if(!authenticated)return <Redirect href="/"/>;if(!consentGranted)return <Redirect href="/consentimento"/>;return <Stack screenOptions={{headerShown:false,animation:'slide_from_right'}}/>}

