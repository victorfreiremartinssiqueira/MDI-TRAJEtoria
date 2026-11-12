import React,{useState,useCallback} from 'react';
import {View,Text,Image,Pressable} from 'react-native';
import {useSQLiteContext} from 'expo-sqlite';
import {useFocusEffect,useRouter} from 'expo-router';
import {LinearGradient} from 'expo-linear-gradient';
import {useAuth} from '../../src/context/AuthContext';
import {listOrders} from '../../src/database/repositories';
import type {Order} from '../../src/types/models';
import {colors,spacing,radius,typography} from '../../src/constants/theme';
import {AppScreen,Heading,BodyText,SmallHeading,IconView,StatusPill} from '../../src/components/Design';
export default function Home(){const db=useSQLiteContext(),r=useRouter(),{young}=useAuth(),[orders,setOrders]=useState<Order[]>([]);
 useFocusEffect(useCallback(()=>{listOrders(db).then(setOrders).catch(()=>{})},[db]));
 const inProgress=orders.find(o=>!['entregue','cancelado'].includes(o.status));
 return <AppScreen active="inicio" scroll={true}><View style={{flex:1,justifyContent:'space-around',paddingBottom:10}}>
 <View style={{minHeight:167,position:'relative',paddingTop:12,justifyContent:'center'}}><Image source={require('../../assets/images/hero-roupas.jpg')} resizeMode="cover" style={{position:'absolute',right:0,top:3,width:'42%',height:159,borderRadius:75,opacity:.96}}/><View style={{width:'66%',zIndex:1}}><Heading size={39}>Olá, {young?.nome?.split(' ')[0]??'Lucas'}! 👋</Heading><BodyText style={{fontFamily:typography.medium,fontSize:15,marginTop:7}}>Que bom ter você aqui!</BodyText><BodyText style={{fontSize:12,marginTop:8,maxWidth:195,color:colors.muted}}>Escolha suas peças, acompanhe seu pedido e faça parte dessa jornada de inclusão.</BodyText></View></View>
 <Pressable onPress={()=>inProgress?r.push({pathname:'/(jovem)/acompanhar',params:{id:String(inProgress.id)}}):r.push('/(jovem)/catalogo')} accessibilityRole="button" style={{flexDirection:'row',gap:14,alignItems:'center',padding:15,backgroundColor:colors.lilacLight,borderRadius:25,marginVertical:10}}>
  <View style={{width:56,height:56,borderRadius:17,backgroundColor:colors.lilac,alignItems:'center',justifyContent:'center'}}><IconView name="cube-outline" size={30}/></View><View style={{flex:1}}><SmallHeading>Meu pedido</SmallHeading>{inProgress?<><StatusPill status={inProgress.status}/><BodyText style={{fontSize:12,marginTop:3}}>Acompanhe o andamento da sua solicitação.</BodyText></>:<BodyText style={{fontSize:13,marginTop:4}}>Explore o catálogo para escolher suas peças.</BodyText>}</View><IconView name="chevron-forward" size={19}/>
 </Pressable>
 <View style={{flexDirection:'row',gap:11,marginVertical:6}}><Pressable onPress={()=>r.push('/(jovem)/catalogo')} accessibilityRole="button" style={{flex:1,minHeight:141,backgroundColor:colors.purple,borderRadius:24,padding:17,justifyContent:'space-between'}}><IconView name="shirt-outline" size={31} color={colors.white}/><View><Heading size={25} style={{color:colors.white}}>Ver catálogo</Heading><BodyText style={{color:colors.white,fontSize:12}}>Escolha suas peças  ›</BodyText></View></Pressable>
 <Pressable onPress={()=>r.push('/(jovem)/meu-pedido')} accessibilityRole="button" style={{flex:1,minHeight:141,backgroundColor:colors.lilacLight,borderRadius:24,padding:17,justifyContent:'space-between'}}><IconView name="list-outline" size={31}/><View><Heading size={25}>Meus pedidos</Heading><BodyText style={{fontSize:12}}>Acompanhe suas solicitações  ›</BodyText></View></Pressable></View>
 <View style={{flexDirection:'row',alignItems:'center',gap:10,marginTop:7,minHeight:110}}><Image source={require('../../assets/images/malha-roxa.jpg')} resizeMode="cover" style={{width:'48%',height:108,borderRadius:24}}/><View style={{flex:1}}><Heading size={27}>Moda que inclui, conecta e transforma.</Heading><View style={{width:52,height:3,backgroundColor:colors.gold,marginTop:8}}/></View></View>
 </View></AppScreen>
}
