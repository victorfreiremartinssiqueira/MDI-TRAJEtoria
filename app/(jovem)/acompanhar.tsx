import React,{useCallback,useState} from 'react';
import {View,Pressable,Alert} from 'react-native';
import {useSQLiteContext} from 'expo-sqlite';
import {useFocusEffect,useLocalSearchParams,useRouter} from 'expo-router';
import {AppScreen,PageHeader,BodyText,SmallHeading,IconView,Panel,StatusPill,ProgressSteps,ProductListRow,Button,StateView} from '../../src/components/Design';
import {listOrders,getOrderPieces,getOrderHistory} from '../../src/database/repositories';
import {datePT,dateShort} from '../../src/utils/format';
import type{Order,OrderPiece,OrderHistory} from '../../src/types/models';
import {colors,typography} from '../../src/constants/theme';
export default function Tracking(){
 const {id}=useLocalSearchParams<{id?:string}>(),db=useSQLiteContext(),r=useRouter();const [orders,setOrders]=useState<Order[]>([]),[current,setCurrent]=useState<Order|null>(null),[items,setItems]=useState<OrderPiece[]>([]),[history,setHistory]=useState<OrderHistory[]>([]),[loading,setLoading]=useState(true);
 const load=useCallback(async()=>{try{setLoading(true);const all=await listOrders(db);setOrders(all);const sel=all.find(x=>x.id===Number(id))??all[0]??null;setCurrent(sel);if(sel){const [it,his]=await Promise.all([getOrderPieces(db,sel.id),getOrderHistory(db,sel.id)]);setItems(it);setHistory(his)}}catch{Alert.alert('Erro','Não foi possível carregar o pedido.')}finally{setLoading(false)}},[db,id]);
 useFocusEffect(useCallback(()=>{load()},[load]));
 const otherOrders=orders.filter(x=>x.id!==current?.id);
 return <AppScreen active="pedidos"><PageHeader title="Acompanhar pedido" subtitle="Veja em que etapa está o seu pedido."/>
 {loading?<StateView mode="loading"/>:!current?<StateView mode="empty" message="Você ainda não possui pedidos. Explore o catálogo para começar." onRetry={()=>r.replace('/(jovem)/catalogo')}/>:<>
 <Panel style={{padding:17,flexDirection:'row',alignItems:'center',gap:14}}><View style={{backgroundColor:colors.lilac,borderRadius:22,width:68,height:68,alignItems:'center',justifyContent:'center'}}><IconView name="cube-outline" size={37}/></View><View style={{flex:1}}><StatusPill status={current.status}/><BodyText style={{fontSize:13,marginTop:7}}>{current.status==='solicitado'?'Pedido registrado. Aguardando preparação.':current.status==='em_separacao'?'Seu pedido está sendo preparado pela equipe.':current.status==='despachado'?'Seu pacote saiu para entrega.':current.status==='entregue'?'Sua entrega foi concluída!':'Pedido cancelado.'}</BodyText></View></Panel>
 <ProgressSteps status={current.status}/>
 <Panel style={{backgroundColor:colors.warningBg,flexDirection:'row',gap:11,alignItems:'center'}}><IconView name="calendar-outline" size={25}/><View style={{flex:1}}><SmallHeading style={{fontSize:16}}>Previsão de entrega</SmallHeading><BodyText style={{fontSize:13}}>{datePT(current.data_entrega_prevista)}</BodyText><BodyText style={{fontSize:11,color:colors.muted}}>Despacho previsto: {dateShort(current.data_despacho_prevista)}</BodyText></View></Panel>
 <SmallHeading style={{marginTop:8,marginBottom:8}}>Itens do pedido #{current.id}</SmallHeading>{items.map(p=><ProductListRow key={p.pedido_item_id} item={p} right={<BodyText style={{fontSize:12,color:colors.muted}}>1 un.</BodyText>}/>)}
 <Button title="Falar com a equipe" icon="chatbubble-ellipses-outline" outline onPress={()=>Alert.alert('Contato com a equipe','Na versão de demonstração, o atendimento não está conectado. A equipe operacional receberá este recurso na versão integrada.')}/>
 {current.status==='entregue'&&<View style={{marginTop:12}}><Button title={current.feedback_id?'Feedback já enviado':'Avaliar peças recebidas'} icon="heart-outline" disabled={current.feedback_id!==null} onPress={()=>r.push({pathname:'/(jovem)/feedback',params:{id:String(current.id)}})}/></View>}
 <SmallHeading style={{marginTop:20}}>Histórico</SmallHeading>{history.map(h=><View key={h.id} style={{flexDirection:'row',gap:10,marginTop:10,alignItems:'center'}}><IconView name="checkmark-circle-outline" size={16}/><BodyText style={{fontSize:12}}>{h.status.replace('_',' ')} · {dateShort(h.atualizado_em)}</BodyText></View>)}
 {!!otherOrders.length&&<><SmallHeading style={{marginTop:23,marginBottom:9}}>Outros pedidos</SmallHeading>{otherOrders.map(o=><Pressable key={o.id} accessibilityRole="button" onPress={()=>r.replace({pathname:'/(jovem)/acompanhar',params:{id:String(o.id)}})} style={{borderRadius:17,backgroundColor:colors.lilacLight,padding:12,flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8}}><BodyText style={{fontSize:13,fontFamily:typography.semibold}}>Pedido #{o.id}</BodyText><StatusPill status={o.status}/><IconView name="chevron-forward" size={18}/></Pressable>)}</>}
 </>}</AppScreen>
}
