import React,{useState} from 'react';
import {View,Text,ScrollView,Pressable,KeyboardAvoidingView,Platform,Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {LinearGradient} from 'expo-linear-gradient';
import {useRouter} from 'expo-router';
import {useSQLiteContext} from 'expo-sqlite';
import {BrandMark,Heading,BodyText,Button,FormInput,IconView} from '../src/components/Design';
import {colors,typography,config,spacing} from '../src/constants/theme';
import {useAuth} from '../src/context/AuthContext';
import {hasConsent} from '../src/database/repositories';
export default function Login(){
 const router=useRouter(),db=useSQLiteContext(),{login}=useAuth();const [username,setUsername]=useState(config.demoUser),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');const[visible,setVisible]=useState(false);
 const submit=async()=>{try{setBusy(true);setError('');const ok=await login(username,password);if(!ok){setError('Identificação ou senha inválida. Confira e tente novamente.');return}router.replace(await hasConsent(db)?'/(jovem)/inicio':'/consentimento')}catch(e){setError('Não foi possível acessar. Tente novamente.')}finally{setBusy(false)}};
 return <SafeAreaView edges={['top','bottom']} style={{flex:1,backgroundColor:colors.deep}}><KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={{flex:1}}><ScrollView contentContainerStyle={{flexGrow:1,backgroundColor:colors.ivory}} keyboardShouldPersistTaps="handled">
  <LinearGradient colors={[colors.deep,colors.purpleDark,colors.purple]} style={{minHeight:300,justifyContent:'center',alignItems:'center',paddingTop:14,paddingBottom:30,borderBottomLeftRadius:55,borderBottomRightRadius:55,borderBottomWidth:2,borderColor:colors.gold}}>
   <BrandMark size={105}/><Text style={{fontFamily:typography.heading,fontSize:55,color:colors.white}}>TRAJE<Text style={{color:colors.champagne}}>tória</Text></Text>
   <Text style={{fontFamily:typography.medium,color:colors.lavender,fontSize:10,letterSpacing:3}}>MODA  ·  INCLUSÃO  ·  OPORTUNIDADE</Text>
  </LinearGradient>
  <View style={{paddingHorizontal:28,paddingTop:30,paddingBottom:32,flex:1}}><Heading size={43}>Bem-vindo(a)!</Heading><BodyText style={{marginTop:8,marginBottom:25,color:colors.muted}}>Acesse sua conta para escolher roupas, acompanhar pedidos e muito mais.</BodyText>
   <FormInput label="Identificação do usuário" value={username} onChangeText={setUsername} placeholder="Digite sua identificação"/>
   <View style={{position:'relative'}}><FormInput label="Senha" value={password} onChangeText={setPassword} placeholder="Digite sua senha" secureTextEntry={!visible}/><Pressable style={{position:'absolute',right:13,bottom:27}} accessibilityRole="button" accessibilityLabel={visible?'Ocultar senha':'Mostrar senha'} onPress={()=>setVisible(x=>!x)}><IconView name={visible?'eye-off-outline':'eye-outline'} /></Pressable></View>
   {!!error&&<BodyText style={{color:colors.danger,marginBottom:12}} accessibilityRole="alert">{error}</BodyText>}
   <Button title="Entrar" icon="arrow-forward" onPress={submit} loading={busy}/>
   <Pressable onPress={()=>Alert.alert('Preciso de ajuda','Este é um ambiente de demonstração. Utilize as credenciais fictícias fornecidas no README. Na operação real, o suporte será prestado pela equipe responsável.')} style={{flexDirection:'row',justifyContent:'center',alignItems:'center',gap:8,marginTop:25,padding:6}} accessibilityRole="button"><IconView name="help-circle-outline"/><BodyText style={{fontFamily:typography.semibold,color:colors.purple}}>Preciso de ajuda</BodyText></Pressable>
   <BodyText style={{textAlign:'center',fontSize:11,color:colors.muted,marginTop:14}}>Versão acadêmica · Conta fictícia pré-cadastrada</BodyText>
  </View>
 </ScrollView></KeyboardAvoidingView></SafeAreaView>
}
