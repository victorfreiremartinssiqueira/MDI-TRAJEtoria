import React,{useCallback,useState} from 'react';
import {View,Text,Pressable,Alert,Image} from 'react-native';
import {useSQLiteContext} from 'expo-sqlite';
import {useFocusEffect,useRouter} from 'expo-router';
import {AppScreen,Heading,BodyText,SmallHeading,IconView,StatusPill,StateView} from '../../src/components/Design';
import {colors,config,radius,spacing,typography} from '../../src/constants/theme';
import {useAuth} from '../../src/context/AuthContext';
import {fetchCatalog} from '../../src/services/catalogService';
import {addPieceToSelection} from '../../src/database/repositories';
import type {Piece} from '../../src/types/models';
import {pieceImage} from '../../src/constants/pictures';
export default function Catalog(){
 const db=useSQLiteContext(),router=useRouter(),{young}=useAuth();const [pieces,setPieces]=useState<Piece[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[size,setSize]=useState('M'),[category,setCategory]=useState('Todas'),[gender,setGender]=useState('Todos'),[fail,setFail]=useState(false);
 const reload=useCallback(async(testFail=false)=>{try{setLoading(true);setError('');setPieces(await fetchCatalog(db,testFail))}catch(e){setError(e instanceof Error?e.message:'Falha no carregamento')}finally{setLoading(false)}},[db]);
 useFocusEffect(useCallback(()=>{reload(false)},[reload]));
 const sizes=young?JSON.parse(young.tamanhos_json) as string[]:[young?.tamanho_referencia??'M'];
 const categories=['Todas',...Array.from(new Set(pieces.map(p=>p.categoria)))];
 const genders=['Todos','Feminino','Masculino','Unissex'];
 const filtered=pieces.filter(p=>p.tamanho===size&&(category==='Todas'||p.categoria===category)&&(gender==='Todos'||p.genero===gender));
 const add=async(p:Piece)=>{try{await addPieceToSelection(db,p.id);Alert.alert('Peça adicionada',`${p.nome} foi adicionada ao seu pedido.`,[{text:'Continuar escolhendo'},{text:'Ver meu pedido',onPress:()=>router.push('/(jovem)/meu-pedido')}])}catch(e){Alert.alert('Atenção',e instanceof Error?e.message:'Não foi possível adicionar a peça')}};
 const cycle=(items:string[],value:string,set:(x:string)=>void)=>set(items[(items.indexOf(value)+1)%items.length]);
 return <AppScreen active="catalogo"><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><View style={{flex:1}}><Heading size={38}>Catálogo</Heading><BodyText style={{fontSize:14}}>Escolha peças do seu tamanho.</BodyText></View><IconView name="shirt-outline" size={47} color={colors.purple}/></View>
 <View style={{backgroundColor:colors.lilac,borderRadius:radius.lg,padding:12,flexDirection:'row',gap:10,alignItems:'center',marginVertical:16}}><IconView name="ribbon-outline" color={colors.gold} size={30}/><View style={{flex:1}}><SmallHeading style={{fontSize:16}}>Catálogo curado</SmallHeading><BodyText style={{fontSize:12}}>Peças selecionadas, em bom estado e sem custo.</BodyText></View></View>
 <View style={{flexDirection:'row',gap:6,marginBottom:12}}>
  <Pressable accessibilityRole="button" accessibilityLabel={`Categoria: ${category}. Toque para alterar`} onPress={()=>cycle(categories,category,setCategory)} style={filterStyle}><IconView name="options-outline" size={15}/><Text numberOfLines={1} style={filterLabel}> {category==='Todas'?'Categoria':category}  ⌄</Text></Pressable>
  <Pressable accessibilityRole="button" accessibilityLabel={`Gênero: ${gender}. Toque para alterar`} onPress={()=>cycle(genders,gender,setGender)} style={filterStyle}><IconView name="people-outline" size={15}/><Text numberOfLines={1} style={filterLabel}> {gender==='Todos'?'Gênero':gender}  ⌄</Text></Pressable>
  <Pressable accessibilityRole="button" accessibilityLabel={`Tamanho: ${size}. Toque para alterar`} onPress={()=>cycle(sizes,size,setSize)} style={filterStyle}><IconView name="resize-outline" size={15}/><Text style={filterLabel}> {size}  ⌄</Text></Pressable>
 </View>
 <View style={{borderRadius:18,backgroundColor:colors.lilacLight,padding:11,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:12}}><BodyText style={{fontSize:12,fontFamily:typography.medium,color:colors.purple}}>Filtrado para seu tamanho: {size}</BodyText><Pressable accessibilityRole="button" onPress={()=>{setSize(young?.tamanho_referencia??'M');setCategory('Todas');setGender('Todos')}}><BodyText style={{fontSize:12,textDecorationLine:'underline',color:colors.purple}}>Limpar filtros</BodyText></Pressable></View>
 {loading?<StateView mode="loading" message="Carregando peças disponíveis..."/>:error?<StateView mode="error" message={error} onRetry={()=>reload(false)}/>:filtered.length===0?<StateView mode="empty" message="Nenhuma peça encontrada com estes filtros. Escolha outra combinação." onRetry={()=>{setCategory('Todas');setGender('Todos');setSize('M')}}/>:
 <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'}}>{filtered.map(p=><View key={p.id} style={{width:'48.5%',borderRadius:radius.lg,backgroundColor:colors.white,marginBottom:13,overflow:'hidden',borderWidth:1,borderColor:colors.line}}>
  <Pressable onPress={()=>router.push({pathname:'/(jovem)/detalhe/[id]',params:{id:String(p.id)}})} accessibilityRole="button" accessibilityLabel={`Ver detalhes de ${p.nome}`}><Image source={pieceImage(p.id)} style={{width:'100%',height:145}} resizeMode="cover"/><View style={{position:'absolute',top:7,left:7,backgroundColor:colors.successBg,paddingHorizontal:8,paddingVertical:3,borderRadius:40}}><Text style={{fontFamily:typography.semibold,fontSize:10,color:colors.success}}>✓ Disponível</Text></View></Pressable>
  <View style={{padding:9,gap:3}}><Heading size={22} style={{lineHeight:23}}>{p.nome}</Heading><BodyText style={{fontSize:11}}>Gênero: {p.genero}</BodyText><BodyText style={{fontSize:11}}>Tamanho: {p.tamanho}</BodyText><BodyText style={{fontSize:11}}>Estado: {p.conservacao}</BodyText><View style={{gap:6,marginTop:8}}><Pressable accessibilityRole="button" onPress={()=>router.push({pathname:'/(jovem)/detalhe/[id]',params:{id:String(p.id)}})} style={{borderWidth:1,borderColor:colors.purple,borderRadius:20,alignItems:'center',paddingVertical:7}}><Text style={{fontFamily:typography.semibold,color:colors.purpleDark,fontSize:11}}>Ver detalhes</Text></Pressable><Pressable accessibilityRole="button" onPress={()=>add(p)} style={{backgroundColor:colors.purple,borderRadius:20,paddingVertical:9,alignItems:'center'}}><Text style={{fontFamily:typography.semibold,color:colors.white,fontSize:11}}>+ Adicionar ao pedido</Text></Pressable></View></View>
 </View>)}</View>}
 {__DEV__&&<Pressable onPress={()=>reload(true)} style={{alignSelf:'center',padding:12}} accessibilityLabel="Simular erro de carregamento"><BodyText style={{fontSize:10,color:colors.muted}}>Modo demonstração: simular falha de carregamento</BodyText></Pressable>}
 </AppScreen>
}
const filterStyle={flex:1,minWidth:0,borderWidth:1,borderColor:colors.lavender,borderRadius:40,paddingVertical:9,paddingHorizontal:5,flexDirection:'row' as const,alignItems:'center' as const,justifyContent:'center' as const};
const filterLabel={fontFamily:typography.medium,fontSize:11,color:colors.purpleDark,flexShrink:1 as const};
