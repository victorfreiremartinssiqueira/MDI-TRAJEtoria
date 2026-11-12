import React,{useState,useCallback} from 'react';
import {View,Pressable,Alert,Text} from 'react-native';
import {useFocusEffect,useRouter} from 'expo-router';
import {useSQLiteContext} from 'expo-sqlite';
import {colors,config,typography,spacing} from '../../src/constants/theme';
import {AppScreen,PageHeader,BodyText,SmallHeading,Heading,ProductListRow,Button,InfoNotice,IconView,StateView,StatusPill} from '../../src/components/Design';
import {getSelection,removePieceFromSelection,listOrders} from '../../src/database/repositories';
import {dateShort} from '../../src/utils/format';
import type{Order,Piece} from '../../src/types/models';
export default function Basket(){
 const db=useSQLiteContext(),r=useRouter();const [items,setItems]=useState<Piece[]>([]),[orders,setOrders]=useState<Order[]>([]),[loading,setLoading]=useState(true);
 const load=useCallback(async()=>{try{setLoading(true);const [it,or]=await Promise.all([getSelection(db),listOrders(db)]);setItems(it);setOrders(or)}catch{Alert.alert('Erro','Não foi possível carregar seus pedidos.')}finally{setLoading(false)}},[db]);
 useFocusEffect(useCallback(()=>{load()},[load]));
 const remove=(p:Piece)=>Alert.alert('Remover peça?',`Deseja retirar ${p.nome} da seleção?`,[{text:'Cancelar',style:'cancel'},{text:'Remover',style:'destructive',onPress:async()=>{await removePieceFromSelection(db,p.id);await load()}}]);
 return <AppScreen active="pedidos"><PageHeader title="Meu pedido" subtitle="Revise as peças escolhidas antes de continuar para a entrega."/>
 {loading?<StateView mode="loading"/>:<>
 <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:10}}><SmallHeading>Peças escolhidas ({items.length}/{config.maxItemsPerOrder})</SmallHeading><BodyText style={{fontSize:12,color:colors.muted}}>Sem custo</BodyText></View>
 {items.length?items.map(p=><ProductListRow key={p.id} item={p} right={<Pressable accessibilityRole="button" accessibilityLabel={`Remover ${p.nome}`} onPress={()=>remove(p)} style={{padding:8}}><IconView name="trash-outline" color={colors.purple} size={22}/></Pressable>}/>):<StateView mode="empty" message="Seu pedido ainda está vazio. Escolha pelo menos uma peça no catálogo."/>}
 <View style={{marginTop:13}}><Button title="Adicionar mais peças" icon="add" outline onPress={()=>r.push('/(jovem)/catalogo')}/></View>
 <InfoNotice title="Reserva das peças">As peças serão reservadas após a confirmação do pedido. Você pode selecionar até {config.maxItemsPerOrder} peças.</InfoNotice>
 <View style={{flexDirection:'row',gap:8,marginBottom:26,marginTop:8}}><View style={{flex:1}}><Button title="Voltar ao catálogo" icon="arrow-back" outline onPress={()=>r.push('/(jovem)/catalogo')}/></View><View style={{flex:1.3}}><Button title="Continuar para a entrega" icon="car-outline" disabled={items.length===0} onPress={()=>r.push('/(jovem)/entrega')}/></View></View>
 </>}
 <SmallHeading style={{marginBottom:9}}>Solicitações realizadas</SmallHeading>
 {orders.length?orders.map(p=><Pressable accessibilityRole="button" accessibilityLabel={`Acompanhar pedido ${p.id}`} key={p.id} onPress={()=>r.push({pathname:'/(jovem)/acompanhar',params:{id:String(p.id)}})} style={{padding:13,backgroundColor:colors.lilacLight,borderRadius:17,marginBottom:9,flexDirection:'row',alignItems:'center',gap:9}}><IconView name="cube-outline" size={26}/><View style={{flex:1}}><BodyText style={{fontFamily:typography.semibold}}>Pedido #{p.id}</BodyText><BodyText style={{fontSize:12}}>Enviado em {dateShort(p.data_pedido)}</BodyText></View><StatusPill status={p.status}/><IconView name="chevron-forward" size={17}/></Pressable>):<BodyText style={{fontSize:12}}>Você ainda não realizou pedidos.</BodyText>}
 </AppScreen>
}
