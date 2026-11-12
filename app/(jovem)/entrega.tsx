import React,{useEffect,useState} from 'react';
import {View,Alert,Pressable} from 'react-native';
import {useRouter} from 'expo-router';
import {useSQLiteContext} from 'expo-sqlite';
import {useAuth} from '../../src/context/AuthContext';
import {getSelection,confirmOrder} from '../../src/database/repositories';
import type{Address} from '../../src/types/models';
import {colors,spacing,typography,radius} from '../../src/constants/theme';
import {AppScreen,PageHeader,Heading,SmallHeading,BodyText,FormInput,Button,IconView,InfoNotice,StateView} from '../../src/components/Design';
import {datePT,nextDispatch} from '../../src/utils/format';
export default function Delivery(){
 const r=useRouter(),db=useSQLiteContext(),{young,refreshProfile}=useAuth();
 const [address,setAddress]=useState<Address>({cep:young?.cep??'',logradouro:young?.logradouro??'',numero:young?.numero??'',complemento:young?.complemento??'',bairro:young?.bairro??'',cidade:young?.cidade??'',uf:young?.uf??'',contato:young?.telefone??''});
 const [editable,setEditable]=useState(false),[busy,setBusy]=useState(false),[qty,setQty]=useState<number|null>(null);
 useEffect(()=>{getSelection(db).then(items=>setQty(items.length)).catch(()=>setQty(0))},[db]);
 const update=(key:keyof Address,value:string)=>setAddress(old=>({...old,[key]:value}));
 const submit=async()=>{try{setBusy(true);const id=await confirmOrder(db,address);await refreshProfile();Alert.alert('Pedido enviado!',`Sua solicitação #${id} foi registrada. As peças foram reservadas e o pedido começa como Solicitado.`,[{text:'Ir para início',onPress:()=>r.replace('/(jovem)/inicio')},{text:'Acompanhar',onPress:()=>r.replace({pathname:'/(jovem)/acompanhar',params:{id:String(id)}})}])}catch(e){Alert.alert('Não foi possível enviar',e instanceof Error?e.message:'Tente novamente. Revise a seleção na tela Meu pedido.')}finally{setBusy(false)}};
 const block=(title:string,icon:any,lines:string[],onPress:()=>void)=><View style={{backgroundColor:colors.lilacLight,borderRadius:20,padding:14,marginBottom:12,flexDirection:'row',gap:10,alignItems:'center'}}><IconView name={icon} size={25}/><View style={{flex:1}}><SmallHeading style={{fontSize:16}}>{title}</SmallHeading>{lines.map((x,i)=><BodyText key={i} style={{fontSize:13}}>{x}</BodyText>)}</View><Pressable accessibilityRole="button" accessibilityLabel={`Editar ${title}`} onPress={onPress} style={{padding:5}}><IconView name="create-outline" size={20}/><BodyText style={{fontSize:11,color:colors.purple}}>Editar</BodyText></Pressable></View>;
 return <AppScreen active="pedidos"><PageHeader title="Endereço e janela de entrega" subtitle="Confira seus dados antes de enviar o pedido."/>
 <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',marginBottom:20,gap:15}}><View style={{alignItems:'center'}}><IconView name="checkmark-circle" size={29}/><BodyText style={{fontSize:12}}>Meu pedido</BodyText></View><View style={{height:2,width:50,backgroundColor:colors.purple}}/><View style={{alignItems:'center'}}><IconView name="location" size={29}/><BodyText style={{fontSize:12,fontFamily:typography.semibold}}>Confirmar entrega</BodyText></View></View>
 {qty===null?<StateView mode="loading"/>:qty===0?<StateView mode="empty" message="Adicione uma peça antes de confirmar a entrega." onRetry={()=>r.replace('/(jovem)/catalogo')}/>:<>
 {!editable?<>{block('Endereço de entrega','location-outline',[`${address.logradouro}, ${address.numero}`,`${address.bairro} · ${address.cidade}/${address.uf}`,`CEP: ${address.cep}`],()=>setEditable(true))}{block('Contato','call-outline',[address.contato],()=>setEditable(true))}</>:<View style={{padding:14,backgroundColor:colors.lilacLight,borderRadius:20,marginBottom:12}}><SmallHeading style={{marginBottom:10}}>Corrigir informações</SmallHeading><FormInput label="CEP" value={address.cep} onChangeText={v=>update('cep',v)} keyboardType="numbers-and-punctuation"/><FormInput label="Rua / logradouro" value={address.logradouro} onChangeText={v=>update('logradouro',v)}/><FormInput label="Número" value={address.numero} onChangeText={v=>update('numero',v)}/><FormInput label="Complemento (opcional)" value={address.complemento} onChangeText={v=>update('complemento',v)}/><FormInput label="Bairro" value={address.bairro} onChangeText={v=>update('bairro',v)}/><FormInput label="Cidade" value={address.cidade} onChangeText={v=>update('cidade',v)}/><FormInput label="UF" value={address.uf} onChangeText={v=>update('uf',v)}/><FormInput label="Contato" value={address.contato} onChangeText={v=>update('contato',v)} keyboardType="phone-pad"/><Button title="Concluir revisão" onPress={()=>setEditable(false)}/></View>}
 <View style={{backgroundColor:colors.warningBg,borderRadius:20,padding:15,flexDirection:'row',gap:13,alignItems:'center',marginBottom:13}}><IconView name="calendar-outline" size={25}/><View style={{flex:1}}><SmallHeading style={{fontSize:16}}>Próximo dia de despacho</SmallHeading><BodyText style={{fontSize:13}}>{datePT(nextDispatch())} · quinta-feira</BodyText></View></View>
 <InfoNotice icon="information-circle-outline">O despacho acontece às quintas-feiras. A data de entrega será informada pela equipe quando disponível; ela não é igual ao dia de despacho.</InfoNotice>
 <View style={{flexDirection:'row',gap:9,marginTop:10,marginBottom:22}}><View style={{flex:1}}><Button title="Voltar" outline icon="arrow-back" onPress={()=>r.back()}/></View><View style={{flex:1.3}}><Button title="Enviar pedido" icon="cube-outline" onPress={submit} loading={busy}/></View></View>
 </>}
 </AppScreen>
}
