import React,{useState,useEffect} from 'react';
import {View,Image,Pressable,Alert} from 'react-native';
import {useLocalSearchParams,useRouter} from 'expo-router';
import {useSQLiteContext} from 'expo-sqlite';
import {AppScreen,PageHeader,Heading,BodyText,SmallHeading,Button,IconView,StatusPill,StateView,Panel} from '../../../src/components/Design';
import {getPiece,addPieceToSelection} from '../../../src/database/repositories';
import type {Piece} from '../../../src/types/models';
import {colors,radius,spacing,typography} from '../../../src/constants/theme';
import {pieceImage,hoodieGallery} from '../../../src/constants/pictures';
export default function Detail(){
 const {id}=useLocalSearchParams<{id:string}>(),db=useSQLiteContext(),router=useRouter();const [piece,setPiece]=useState<Piece|null>(null),[loading,setLoading]=useState(true),[imageIndex,setImageIndex]=useState(0);
 useEffect(()=>{setLoading(true);getPiece(db,Number(id)).then(setPiece).finally(()=>setLoading(false))},[id,db]);
 const gallery=Number(id)===1?hoodieGallery:piece?[pieceImage(piece.id)]:[];
 const add=async()=>{if(!piece)return;try{await addPieceToSelection(db,piece.id);Alert.alert('Adicionado ao pedido',`${piece.nome} foi adicionada à sua seleção.`,[{text:'Continuar no catálogo',onPress:()=>router.replace('/(jovem)/catalogo')},{text:'Meu pedido',onPress:()=>router.push('/(jovem)/meu-pedido')}])}catch(e){Alert.alert('Atenção',e instanceof Error?e.message:'Peça indisponível')}};
 return <AppScreen active="catalogo">{loading?<StateView mode="loading"/>:!piece?<StateView mode="empty" message="Peça não encontrada." onRetry={()=>router.back()}/>:<>
 <PageHeader title={piece.nome} subtitle={`${piece.categoria} · ${piece.genero}`}/><View style={{alignSelf:'flex-start',backgroundColor:piece.status==='disponivel'?colors.successBg:colors.warningBg,borderRadius:30,paddingHorizontal:13,paddingVertical:5}}><BodyText style={{fontSize:12,fontFamily:typography.semibold}}>{piece.status==='disponivel'?'✓ Disponível':'Indisponível'}</BodyText></View>
 <View style={{marginTop:14}}><Image source={gallery[imageIndex]} resizeMode="cover" style={{width:'100%',height:255,borderRadius:radius.lg,backgroundColor:colors.lilac}}/><View style={{flexDirection:'row',gap:10,justifyContent:'center',marginTop:11}}>{gallery.map((source,i)=><Pressable key={i} onPress={()=>setImageIndex(i)} accessibilityRole="button" accessibilityLabel={`Fotografia ${i+1}`}><Image source={source} style={{width:56,height:48,borderRadius:10,borderWidth:2,borderColor:i===imageIndex?colors.purple:colors.transparent}}/></Pressable>)}</View></View>
 <Heading size={27} style={{marginTop:17}}>Sobre a peça</Heading><BodyText style={{fontSize:14,marginBottom:15}}>{piece.descricao||'Peça selecionada para o catálogo social do TRAJEtória.'}</BodyText>
 <Panel><View style={{flexDirection:'row',justifyContent:'space-between',gap:7}}>{[{label:'Categoria',val:piece.categoria,icon:'layers-outline'},{label:'Gênero',val:piece.genero,icon:'people-outline'},{label:'Conservação',val:piece.conservacao,icon:'leaf-outline'}].map(x=><View key={x.label} style={{flex:1,alignItems:'center'}}><IconView name={x.icon as any}/><BodyText style={{fontSize:11,color:colors.muted}}>{x.label}</BodyText><BodyText style={{fontFamily:typography.semibold,fontSize:12,textAlign:'center'}}>{x.val}</BodyText></View>)}</View></Panel>
 <Heading size={25} style={{marginTop:10}}>Tamanho da peça</Heading><View style={{flexDirection:'row',gap:10,marginTop:9,marginBottom:8}}><View style={{backgroundColor:colors.purple,borderRadius:40,paddingHorizontal:21,paddingVertical:8}}><BodyText style={{color:colors.white,fontFamily:typography.semibold}}>{piece.tamanho}</BodyText></View></View><BodyText style={{fontSize:12,color:colors.muted}}>Cada roupa é uma peça única. Não há outras variantes de tamanho para este item.</BodyText>
 <Panel style={{marginTop:15}}><SmallHeading style={{fontSize:16}}>Medidas</SmallHeading><BodyText style={{fontSize:12,marginTop:4}}>Medidas detalhadas não informadas para esta peça.</BodyText></Panel>
 <View style={{flexDirection:'row',gap:10,marginTop:9,marginBottom:16}}><View style={{flex:1}}><Button outline title="Voltar" icon="arrow-back" onPress={()=>router.back()}/></View><View style={{flex:1.6}}><Button title="Adicionar ao pedido" icon="bag-add-outline" onPress={add} disabled={piece.status!=='disponivel'}/></View></View>
 </>}</AppScreen>
}
