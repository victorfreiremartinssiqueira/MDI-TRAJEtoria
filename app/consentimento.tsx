import React,{useState} from 'react';
import {View,Text,ScrollView,Pressable,Alert,Modal} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRouter,Redirect} from 'expo-router';
import {useSQLiteContext} from 'expo-sqlite';
import {colors,spacing,typography} from '../src/constants/theme';
import {BrandHeader,Heading,BodyText,SmallHeading,IconView,Button} from '../src/components/Design';
import {useAuth} from '../src/context/AuthContext';
import {saveConsent} from '../src/database/repositories';
const summaries=[
 {title:'Quais dados são coletados?',txt:'Dados de identificação, tamanho das peças, contato e endereço de entrega.',icon:'server-outline'},
 {title:'Para que usamos?',txt:'Para organizar os pedidos de roupas, realizar as entregas e acompanhar os resultados.',icon:'heart-outline'},
 {title:'Com quem compartilhamos?',txt:'Com a equipe autorizada e parceiros da operação, como a ONG vinculada.',icon:'shield-checkmark-outline'},
 {title:'Por quanto tempo?',txt:'Durante o período necessário às finalidades do projeto, segundo a política aplicável.',icon:'time-outline'}
] as const;
export default function Consent(){
 const {authenticated,logout,grantConsent}=useAuth(),router=useRouter(),db=useSQLiteContext();const [checked,setChecked]=useState(false),[busy,setBusy]=useState(false),[open,setOpen]=useState(false);
 if(!authenticated)return <Redirect href="/"/>;
 const accept=async()=>{if(!checked)return;try{setBusy(true);await saveConsent(db);grantConsent();router.replace('/(jovem)/inicio')}catch{Alert.alert('Erro','Não foi possível salvar o consentimento. Tente novamente.')}finally{setBusy(false)}};
 return <SafeAreaView edges={['top','bottom']} style={{flex:1,backgroundColor:colors.deep}}><View style={{flex:1,backgroundColor:colors.ivory}}><BrandHeader/>
 <ScrollView contentContainerStyle={{padding:spacing.lg,paddingBottom:40}}><Heading size={35}>Termo de consentimento</Heading><BodyText style={{marginTop:10,marginBottom:20}}>Para continuar, precisamos do seu consentimento para o uso dos seus dados na plataforma TRAJEtória.</BodyText>
 {summaries.map(s=><View key={s.title} style={{flexDirection:'row',gap:12,alignItems:'center',marginBottom:17}}><View style={{height:53,width:53,borderRadius:17,backgroundColor:colors.lilac,alignItems:'center',justifyContent:'center'}}><IconView name={s.icon as any} size={25}/></View><View style={{flex:1}}><SmallHeading style={{fontSize:16}}>{s.title}</SmallHeading><BodyText style={{fontSize:13}}>{s.txt}</BodyText></View></View>)}
 <Pressable accessibilityRole="button" onPress={()=>setOpen(true)} style={{borderRadius:22,borderWidth:1,borderColor:colors.lavender,padding:14,flexDirection:'row',justifyContent:'center',alignItems:'center',gap:9,marginVertical:10}}><IconView name="document-text-outline"/><BodyText style={{fontFamily:typography.semibold,color:colors.purple}}>Ler termo completo</BodyText><IconView name="open-outline" size={16}/></Pressable>
 <Pressable accessibilityRole="checkbox" accessibilityState={{checked}} onPress={()=>setChecked(!checked)} style={{flexDirection:'row',gap:12,alignItems:'center',paddingVertical:16}}><IconView name={checked?'checkbox':'square-outline'} size={27}/><BodyText style={{flex:1}}>Li e concordo com o Termo de Consentimento para o uso dos meus dados.</BodyText></Pressable>
 <View style={{flexDirection:'row',gap:10}}><View style={{flex:1}}><Button title="Não aceitar" outline onPress={()=>{logout();router.replace('/')}}/></View><View style={{flex:1}}><Button title="Aceitar" icon="arrow-forward" disabled={!checked} loading={busy} onPress={accept}/></View></View>
 <BodyText style={{marginTop:14,fontSize:11,color:colors.muted,textAlign:'center'}}>Versão do termo 1.0 · Texto demonstrativo sujeito à validação jurídica.</BodyText>
 </ScrollView>
 <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={()=>setOpen(false)}><SafeAreaView style={{flex:1,backgroundColor:colors.ivory}} edges={['top','bottom']}><ScrollView contentContainerStyle={{padding:26}}><Heading>Consentimento e privacidade</Heading><BodyText style={{marginTop:16}}>Versão 1.0 - Material demonstrativo. O TRAJEtória registra os dados necessários para identificar o jovem, organizar a solicitação de roupas e viabilizar a entrega. Esses dados são utilizados pela equipe responsável e parceiros envolvidos na operação, respeitando a finalidade e a necessidade do serviço.</BodyText><BodyText style={{marginTop:12}}>O registro de aceite inclui a identificação do jovem, a versão do documento e a data e hora. Regras legais definitivas, prazo de conservação e consentimento de responsáveis por menores deverão ser validados antes de qualquer uso real.</BodyText><View style={{marginTop:26}}><Button title="Fechar" onPress={()=>setOpen(false)}/></View></ScrollView></SafeAreaView></Modal>
 </View></SafeAreaView>
}
