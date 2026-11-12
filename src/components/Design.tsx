import React,{useMemo} from 'react';
import { View,Text,ScrollView,Pressable,StyleSheet,TextInput,ActivityIndicator,Image,KeyboardTypeOptions,Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg,{Ellipse,Circle,Path} from 'react-native-svg';
import { useRouter } from 'expo-router';
import { colors,spacing,radius,shadow,typography } from '../constants/theme';
import { statusLabels,statusSteps } from '../utils/format';
import type {OrderStatus,Piece} from '../types/models';
import { pieceImage } from '../constants/pictures';

type Icon=React.ComponentProps<typeof Ionicons>['name'];
export function IconView({name,size=22,color=colors.purple}:{name:Icon;size?:number;color?:string}){
 return <Ionicons name={name} size={size} color={color}/>;
}
export function BrandMark({size=43}:{size?:number}){
 return <Svg width={size} height={size} viewBox="0 0 48 48">
  <Ellipse cx="24" cy="24" rx="21" ry="8" transform="rotate(-42 24 24)" fill="none" stroke={colors.gold} strokeWidth="1.3"/>
  <Ellipse cx="24" cy="24" rx="21" ry="8" transform="rotate(42 24 24)" fill="none" stroke={colors.gold} strokeWidth="1.3"/>
  <Ellipse cx="24" cy="24" rx="21" ry="8" transform="rotate(90 24 24)" fill="none" stroke={colors.gold} strokeWidth="1.3"/>
  <Circle cx="24" cy="24" r="3.5" fill={colors.champagne}/><Circle cx="41" cy="15" r="2.4" fill={colors.gold}/>
 </Svg>
}
export function BodyText({children,style,numberOfLines,...rest}:any){return <Text {...rest} numberOfLines={numberOfLines} style={[{fontFamily:typography.regular,fontSize:15,color:colors.text,lineHeight:21},style]}>{children}</Text>}
export function Heading({children,style,size=34}:any){return <Text style={[{fontFamily:typography.heading,fontSize:size,color:colors.purpleDark,lineHeight:size*1.03},style]}>{children}</Text>}
export function SmallHeading({children,style}:any){return <Text style={[{fontFamily:typography.semibold,fontSize:19,color:colors.purpleDark},style]}>{children}</Text>}
export function BrandHeader({compact=false}:{compact?:boolean}){
 return <LinearGradient colors={[colors.deep,colors.purpleDark,colors.purple]} style={[styles.header,{height:compact?90:116}]}>
  <View style={styles.headerInner}><BrandMark size={45}/><Text style={styles.wordmark}>TRAJE<Text style={{color:colors.champagne}}>tória</Text></Text><Pressable onPress={()=>Alert.alert('Notificações','As notificações serão integradas ao módulo operacional em uma versão futura. Acompanhe seus pedidos pela aba Pedidos.')} accessibilityRole="button" accessibilityLabel="Notificações" style={styles.bell}><IconView name="notifications-outline" color={colors.white} size={22}/></Pressable></View>
  <Svg width="100%" height={26} viewBox="0 0 400 26" preserveAspectRatio="none" style={{position:'absolute',bottom:-1}}>
   <Path d="M0 19 C 82 -12 140 17 206 20 C 289 40 339 15 400 2 L400 27 L0 27Z" fill={colors.ivory} stroke={colors.gold} strokeWidth="1.5"/>
  </Svg>
 </LinearGradient>
}
const navs=[{key:'inicio',label:'Início',icon:'home-outline',activeIcon:'home',path:'/(jovem)/inicio'},{key:'catalogo',label:'Catálogo',icon:'shirt-outline',activeIcon:'shirt',path:'/(jovem)/catalogo'},{key:'pedidos',label:'Pedidos',icon:'cube-outline',activeIcon:'cube',path:'/(jovem)/meu-pedido'},{key:'perfil',label:'Perfil',icon:'person-outline',activeIcon:'person',path:'/(jovem)/perfil'}] as const;
export function HangerIcon({size=27,color=colors.purpleDark}:{size?:number;color?:string}){return <Svg height={size} width={size} viewBox="0 0 32 32"><Path d="M14 9a3 3 0 0 1 3-3c2.4 0 4 2.5 2.2 4.5L16 14m0 0L3.5 23.5a2 2 0 0 0 1.2 3.6h22.6a2 2 0 0 0 1.2-3.6L16 14Z" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></Svg>}
export function BottomNav({active}:{active:'inicio'|'catalogo'|'pedidos'|'perfil'}){
 const router=useRouter();return <SafeAreaView edges={['bottom']} style={{backgroundColor:colors.ivory}}><View style={styles.tabBar}>
  {navs.map(n=><Pressable key={n.key} accessibilityRole="tab" accessibilityState={{selected:active===n.key}} accessibilityLabel={n.label} onPress={()=>router.replace(n.path as any)} style={[styles.tab,{backgroundColor:active===n.key?colors.lilac:colors.transparent}]}>
   {n.key==='catalogo'?<HangerIcon size={27}/>:<IconView name={(active===n.key?n.activeIcon:n.icon) as Icon} color={colors.purpleDark} size={25}/>}
   <Text style={{fontFamily:active===n.key?typography.semibold:typography.medium,fontSize:12,color:colors.purpleDark}}>{n.label}</Text>
  </Pressable>)}
 </View></SafeAreaView>
}
export function AppScreen({active='inicio',children,scroll=true,refreshing,onRefresh}:{active:'inicio'|'catalogo'|'pedidos'|'perfil';children:React.ReactNode;scroll?:boolean;refreshing?:boolean;onRefresh?:()=>void}){
 return <SafeAreaView edges={['top']} style={{flex:1,backgroundColor:colors.deep}}><View style={{flex:1,backgroundColor:colors.ivory}}>
  <BrandHeader/>
  {scroll?<ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingHorizontal:spacing.lg,paddingTop:4,paddingBottom:28}} showsVerticalScrollIndicator={false}>{children}</ScrollView>:<View style={{flex:1,paddingHorizontal:spacing.lg,paddingTop:4}}>{children}</View>}
  <BottomNav active={active}/>
 </View></SafeAreaView>
}
export function PageHeader({title,subtitle,back=true}:{title:string;subtitle?:string;back?:boolean}){
 const r=useRouter();return <View style={{marginBottom:spacing.lg}}>
  <View style={{flexDirection:'row',alignItems:'center',gap:10,marginBottom:3}}>{back&&<Pressable onPress={()=>r.back()} accessibilityRole="button" accessibilityLabel="Voltar" style={styles.back}><IconView name="arrow-back" size={22}/></Pressable>}<Heading size={31} style={{flexShrink:1}}>{title}</Heading></View>
  {!!subtitle&&<BodyText style={{marginLeft:back?51:0,color:colors.muted,fontSize:14}}>{subtitle}</BodyText>}
 </View>
}
export function Panel({children,style}:{children:React.ReactNode;style?:any}){return <View style={[styles.panel,style]}>{children}</View>}
export function Button({title,icon,onPress,disabled=false,outline=false,loading=false,style}:{title:string;icon?:Icon;onPress:()=>void;disabled?:boolean;outline?:boolean;loading?:boolean;style?:any}){
 const inner=<View style={[styles.button,{borderWidth:outline?1.5:0,borderColor:colors.purpleDark,backgroundColor:outline?colors.transparent:colors.purple,opacity:disabled?0.5:1},style]}>
  {loading?<ActivityIndicator color={outline?colors.purple:colors.white}/>:<>{icon&&<IconView name={icon} size={18} color={outline?colors.purpleDark:colors.white}/>}<Text style={{fontFamily:typography.semibold,fontSize:14,color:outline?colors.purpleDark:colors.white,textAlign:'center',flexShrink:1}}>{title}</Text></>}
 </View>;
 return <Pressable onPress={onPress} disabled={disabled||loading} accessibilityRole="button" accessibilityState={{disabled}} accessibilityLabel={title}>{inner}</Pressable>;
}
export function FormInput({label,value,onChangeText,placeholder,secureTextEntry,keyboardType='default',editable=true,multiline=false}:{label:string;value:string;onChangeText:(s:string)=>void;placeholder?:string;secureTextEntry?:boolean;keyboardType?:KeyboardTypeOptions;editable?:boolean;multiline?:boolean}){
 return <View style={{marginBottom:spacing.md}}><BodyText style={{fontFamily:typography.semibold,color:colors.purpleDark,marginBottom:6}}>{label}</BodyText><TextInput accessibilityLabel={label} editable={editable} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} secureTextEntry={secureTextEntry} keyboardType={keyboardType} multiline={multiline} style={[styles.input,{minHeight:multiline?95:48,textAlignVertical:multiline?'top':'center'}]}/></View>
}
export function InfoNotice({title,children,icon='information-circle-outline'}:{title?:string;children:React.ReactNode;icon?:Icon}){
 return <View style={{borderRadius:radius.lg,backgroundColor:colors.warningBg,padding:spacing.md,flexDirection:'row',gap:11,alignItems:'flex-start',marginVertical:10}}><IconView name={icon} size={22}/><View style={{flex:1}}>{title&&<SmallHeading>{title}</SmallHeading>}<BodyText style={{fontSize:13}}>{children}</BodyText></View></View>
}
export function StatusPill({status}:{status:OrderStatus|'disponivel'}){
 const label=status==='disponivel'?'Disponível':statusLabels[status];return <View style={{alignSelf:'flex-start',backgroundColor:status==='entregue'||status==='disponivel'?colors.successBg:colors.warningBg,paddingHorizontal:11,paddingVertical:5,borderRadius:radius.pill}}><BodyText style={{fontSize:12,fontFamily:typography.semibold,color:colors.purpleDark}}>{label}</BodyText></View>
}
export function ProgressSteps({status}:{status:OrderStatus}){
 const current=statusSteps.indexOf(status);return <View style={{flexDirection:'row',justifyContent:'space-between',paddingHorizontal:5,marginVertical:18}}>{statusSteps.map((s,i)=><View key={s} style={{flex:1,alignItems:'center'}}>
  <View style={{height:32,width:32,borderRadius:16,backgroundColor:i<=current?colors.purple:colors.ivory,borderColor:colors.lavender,borderWidth:1.5,alignItems:'center',justifyContent:'center'}}>{i<=current?<IconView name="checkmark" color={colors.white} size={18}/>:<View style={{width:8,height:8,borderRadius:5,backgroundColor:colors.lavender}}/>}</View>
  <BodyText style={{fontSize:10,textAlign:'center',marginTop:7,fontFamily: i===current?typography.semibold:typography.regular}}>{statusLabels[s]}</BodyText>
 </View>)}</View>
}
export function PiecePhoto({id,style}:{id:number;style?:any}){return <Image source={pieceImage(id)} resizeMode="cover" style={[{width:110,height:110,borderRadius:radius.md,backgroundColor:colors.lilac},style]} accessibilityLabel="Imagem ilustrativa da peça"/>}
export function ProductListRow({item,right,press}:{item:Piece;right?:React.ReactNode;press?:()=>void}){
 return <Pressable onPress={press} disabled={!press} style={[styles.productRow]}><PiecePhoto id={item.id} style={{width:86,height:91}}/><View style={{flex:1,justifyContent:'center'}}><SmallHeading style={{fontSize:17}}>{item.nome}</SmallHeading><BodyText style={{fontSize:13,color:colors.muted}}>{item.genero} · {item.tamanho}</BodyText><BodyText style={{fontSize:13}}>Tamanho: {item.tamanho}</BodyText></View>{right}</Pressable>
}
export function StateView({mode,message,onRetry}:{mode:'loading'|'error'|'empty';message?:string;onRetry?:()=>void}){
 return <View style={{alignItems:'center',padding:30,gap:12}}>{mode==='loading'?<ActivityIndicator size="large" color={colors.purple}/>:<IconView name={mode==='error'?'alert-circle-outline':'search-outline'} size={36}/>}<BodyText style={{textAlign:'center'}}>{message??(mode==='empty'?'Nenhum resultado disponível.':mode==='loading'?'Carregando dados...':'Não foi possível carregar os dados.')}</BodyText>{onRetry&&<Button title="Tentar novamente" icon="refresh" onPress={onRetry} outline/>}</View>
}
export const styles=StyleSheet.create({
 header:{width:'100%',position:'relative',justifyContent:'flex-start'},headerInner:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingTop:16},wordmark:{fontFamily:typography.heading,fontSize:28,color:colors.white,letterSpacing:.3},bell:{position:'absolute',right:24,top:20,height:40,width:40,borderRadius:22,alignItems:'center',justifyContent:'center',backgroundColor:'#ffffff1c'},
 tabBar:{paddingHorizontal:16,paddingTop:11,paddingBottom:5,minHeight:78,borderTopLeftRadius:30,borderTopRightRadius:30,backgroundColor:colors.ivory,flexDirection:'row',justifyContent:'space-around',...shadow},tab:{flex:1,borderRadius:24,alignItems:'center',justifyContent:'center',gap:4,minHeight:61},
 panel:{padding:spacing.md,backgroundColor:colors.lilacLight,borderRadius:radius.lg,marginBottom:spacing.sm},back:{height:41,width:41,borderRadius:24,backgroundColor:colors.lilac,alignItems:'center',justifyContent:'center'},
 button:{minHeight:48,borderRadius:radius.pill,paddingHorizontal:15,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},
 input:{backgroundColor:colors.lilacLight,borderWidth:1,borderColor:colors.lavender,borderRadius:radius.md,paddingHorizontal:14,paddingVertical:10,fontFamily:typography.regular,fontSize:15,color:colors.text},
 productRow:{flexDirection:'row',gap:13,padding:8,borderRadius:radius.lg,backgroundColor:colors.lilacLight,alignItems:'center',marginVertical:6}
});
