import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { BottomNav, BrandMark, Heading, BodyText, Button, IconView, StateView } from '../../../src/components/Design';
import { getPiece, getPiecePhotos, addPieceToSelection } from '../../../src/database/repositories';
import type { Piece } from '../../../src/types/models';
import { colors, radius, spacing, typography } from '../../../src/constants/theme';
import { registeredPhoto } from '../../../src/constants/pictures';

type Notice = { title: string; message: string; success?: boolean };
export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const router = useRouter();
  const [piece, setPiece] = useState<Piece | null>(null);
  const [gallery, setGallery] = useState<ImageSourcePropType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageIndex, setImageIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [retry, setRetry] = useState(0);
  const saving = useRef(false);
  const catalog = () => router.replace('/(jovem)/catalogo');
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true); setError(''); setImageIndex(0);
    const pieceId = Number(id);
    if (!Number.isSafeInteger(pieceId) || pieceId < 1) {
      setPiece(null); setGallery([]); setLoading(false);
      return;
    }
    Promise.all([getPiece(db, pieceId), getPiecePhotos(db, pieceId)]).then(([item, photos]) => {
      if (!active) return;
      setPiece(item);
      setGallery(photos.map(photo => registeredPhoto(photo.referencia, pieceId)).filter((source): source is ImageSourcePropType => source !== null));
    }).catch(() => { if (active) setError('Não foi possível carregar a peça. Tente novamente.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, db, retry]));
  const add = async () => {
    if (!piece || saving.current || piece.status !== 'disponivel') return;
    saving.current = true; setBusy(true);
    try {
      await addPieceToSelection(db, piece.id);
      setNotice({ title: 'Peça adicionada', message: `${piece.nome} foi adicionada à sua seleção. A reserva acontecerá somente ao confirmar o pedido.`, success: true });
    } catch (cause) {
      setNotice({ title: 'Não foi possível adicionar', message: cause instanceof Error ? cause.message : 'Tente novamente.' });
      try { const current = await getPiece(db, piece.id); setPiece(current); } catch { /* Keep the last loaded piece and the original error. */ }
    } finally { saving.current = false; setBusy(false); }
  };
  const available = piece?.status === 'disponivel';
  return <SafeAreaView edges={['top']} style={styles.safe}><View style={styles.page}>
    <LinearGradient colors={[colors.deep, colors.purpleDark, colors.purple]} style={styles.header}>
      <View style={styles.brand}><BrandMark size={47} /><Text style={styles.wordmark}>TRAJEtória</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Notificações" onPress={() => setNotice({ title: 'Notificações', message: 'As notificações serão integradas ao módulo operacional em uma versão futura. Acompanhe seus pedidos pela aba Pedidos.' })} style={styles.bell}><IconView name="notifications-outline" size={21} color={colors.lavender} /></Pressable>
      <Svg width="100%" height={40} viewBox="0 0 390 40" preserveAspectRatio="none" style={styles.wave} accessible={false}>
        <Path d="M0 34 C111 -33 204 72 390 5 L390 40 L0 40Z" fill={colors.lavender} opacity=".35" />
        <Path d="M0 35 C111 -29 204 73 390 12 L390 40 L0 40Z" fill={colors.ivory} />
        <Path d="M0 35 C111 -29 204 73 390 12" fill="none" stroke={colors.gold} strokeWidth="1.8" />
      </Svg>
    </LinearGradient>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {loading ? <StateView mode="loading" /> : error ? <StateView mode="error" message={error} onRetry={() => setRetry(value => value + 1)} /> : !piece ? <StateView mode="empty" message="Peça não encontrada. Volte ao catálogo para ver outras opções." onRetry={catalog} /> : <>
        <View style={styles.pageTitle}>
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar ao catálogo" onPress={catalog} style={styles.backIcon}><IconView name="arrow-back" size={20} /></Pressable>
          <View style={styles.flex}><Heading size={25} style={styles.name}>{piece.nome}</Heading><BodyText style={styles.subtitle}>{piece.categoria} · {piece.genero}</BodyText></View>
          <View style={[styles.status, { backgroundColor: available ? colors.successBg : colors.warningBg }]}><IconView name={available ? 'checkmark' : 'alert-circle-outline'} size={12} color={colors.purpleDark} /><BodyText style={styles.statusText}>{available ? 'Disponível' : 'Indisponível'}</BodyText></View>
        </View>
        {gallery.length > 0 ? <>
          <View style={styles.gallery}>
            <View style={styles.mainPhoto}><Image source={gallery[imageIndex]} resizeMode="contain" style={styles.fillPhoto} accessibilityLabel={`${piece.nome}, fotografia ${imageIndex + 1} de ${gallery.length}`} /></View>
            {gallery.length > 1 && <ScrollView style={styles.thumbnails} contentContainerStyle={styles.thumbnailList} showsVerticalScrollIndicator={false}>
              {gallery.map((source, index) => <Pressable key={index} onPress={() => setImageIndex(index)} accessibilityRole="button" accessibilityLabel={`Selecionar fotografia ${index + 1}`} accessibilityState={{ selected: imageIndex === index }} style={[styles.thumbnail, imageIndex === index && styles.selectedThumbnail]}><Image source={source} resizeMode="contain" style={styles.fillPhoto} /></Pressable>)}
            </ScrollView>}
          </View>
          {gallery.length > 1 && <View style={styles.dots}>{gallery.map((_, index) => <Pressable key={index} accessibilityRole="button" accessibilityLabel={`Fotografia ${index + 1}`} accessibilityState={{ selected: imageIndex === index }} onPress={() => setImageIndex(index)} style={styles.dotTarget}><View style={[styles.dot, index === imageIndex && styles.activeDot]} /></Pressable>)}</View>}
        </> : <View style={styles.noPhoto}><IconView name="image-outline" size={35} /><BodyText>Fotografia não disponível.</BodyText></View>}
        <Heading size={21} style={styles.sectionTitle}>Sobre a peça</Heading>
        <BodyText style={styles.description}>{piece.descricao || 'Descrição não informada para esta peça.'}</BodyText>
        <View style={styles.attributes}>
          {([{ label: 'Categoria', value: piece.categoria, icon: 'layers-outline' }, { label: 'Gênero', value: piece.genero, icon: 'people-outline' }, { label: 'Conservação', value: piece.conservacao, icon: 'leaf-outline' }] as const).map((item, index) => <View key={item.label} style={[styles.attribute, index > 0 && styles.attributeBorder]}><IconView name={item.icon} size={22} /><View style={styles.flex}><BodyText style={styles.attributeLabel}>{item.label}</BodyText><BodyText style={styles.attributeValue}>{item.value}</BodyText></View></View>)}
        </View>
        <Heading size={20} style={styles.sectionTitle}>Tamanho disponível</Heading>
        <View style={styles.sizeRow}><LinearGradient colors={[colors.purple, colors.purpleDark]} style={styles.sizeBadge}><BodyText style={styles.sizeText}>{piece.tamanho}</BodyText></LinearGradient><BodyText style={styles.unique}>Peça única no tamanho cadastrado.</BodyText></View>
        <View style={styles.measurements}><View style={styles.measureTitle}><IconView name="resize-outline" size={21} /><BodyText style={styles.measureLabel}>Medidas ({piece.tamanho})</BodyText></View><BodyText style={styles.measureText}>Medidas detalhadas não informadas para esta peça.</BodyText></View>
        {!available && <BodyText accessibilityRole="alert" style={styles.unavailable}>Esta peça não está disponível. Volte ao catálogo para escolher outras opções.</BodyText>}
        <View style={styles.actions}><Pressable accessibilityRole="button" onPress={catalog} style={styles.backButton}><IconView name="arrow-back" size={18} /><Text style={styles.backLabel}>Voltar</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Adicionar ao pedido" accessibilityState={{ disabled: !available || busy, busy }} disabled={!available || busy} onPress={() => void add()} style={styles.addButton}><LinearGradient colors={[colors.purple, colors.purpleDark]} style={[styles.addInner, (!available || busy) && styles.disabled]}>{busy ? <ActivityIndicator color={colors.white} /> : <><IconView name="bag-add-outline" size={22} color={colors.white} /><Text style={styles.addLabel}>Adicionar ao pedido</Text></>}</LinearGradient></Pressable></View>
      </>}
    </ScrollView>
    <BottomNav active="catalogo" />
  </View>
  <Modal visible={notice !== null} transparent animationType="fade" onRequestClose={() => setNotice(null)}><View style={styles.overlay}><View accessibilityViewIsModal style={styles.dialog}><Heading size={30}>{notice?.title}</Heading><BodyText style={styles.notice}>{notice?.message}</BodyText>
    {notice?.success && <Button title="Ver meu pedido" onPress={() => { setNotice(null); router.push('/(jovem)/meu-pedido'); }} style={{ marginBottom: spacing.sm }} />}
    {notice?.success || (piece && !available) ? <Button title="Continuar no catálogo" onPress={() => { setNotice(null); catalog(); }} style={{ marginBottom: spacing.sm }} /> : null}
    <Button title="Fechar" outline onPress={() => setNotice(null)} />
  </View></View></Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.deep }, page: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: colors.ivory }, flex: { flex: 1 }, scroll: { flex: 1 },
  header: { height: 86 }, brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingTop: 8, paddingRight: 26 }, wordmark: { fontFamily: typography.headingRegular, fontSize: 29, color: colors.ivory }, bell: { position: 'absolute', right: 23, top: 13, width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.lavender + '22', alignItems: 'center', justifyContent: 'center' }, wave: { position: 'absolute', bottom: -1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: 4, paddingBottom: spacing.md }, pageTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm }, backIcon: { width: 34, height: 40, borderRadius: radius.pill, backgroundColor: colors.lilacLight, alignItems: 'center', justifyContent: 'center' }, name: { fontFamily: typography.headingRegular }, subtitle: { fontSize: 12, lineHeight: 16 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: radius.pill, paddingHorizontal: 6, paddingVertical: 3 }, statusText: { fontSize: 9, lineHeight: 13, color: colors.purpleDark },
  gallery: { flexDirection: 'row', gap: 8, height: 188 }, mainPhoto: { flex: 1, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.lilacLight }, fillPhoto: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }, thumbnails: { flexGrow: 0, flexShrink: 0, width: '22%' }, thumbnailList: { gap: 5 }, thumbnail: { width: '100%', aspectRatio: 1.25, borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.transparent, overflow: 'hidden', backgroundColor: colors.lilacLight }, selectedThumbnail: { borderColor: colors.gold }, dots: { flexDirection: 'row', justifyContent: 'center', minHeight: 20 }, dotTarget: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }, dot: { width: 6, height: 6, borderRadius: radius.pill, backgroundColor: colors.line }, activeDot: { backgroundColor: colors.purple }, noPhoto: { minHeight: 140, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lilacLight, borderRadius: radius.md },
  sectionTitle: { marginTop: 7, marginBottom: 3 }, description: { fontSize: 13, lineHeight: 17, marginBottom: 7 }, attributes: { flexDirection: 'row', backgroundColor: colors.lilacLight, borderRadius: radius.md, paddingVertical: 9 }, attribute: { flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center', paddingHorizontal: 7 }, attributeBorder: { borderLeftWidth: 1, borderLeftColor: colors.line }, attributeLabel: { fontSize: 9, lineHeight: 13 }, attributeValue: { fontSize: 11, lineHeight: 14, fontFamily: typography.semibold },
  sizeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 5 }, sizeBadge: { minWidth: 62, alignItems: 'center', paddingVertical: 5, paddingHorizontal: 15, borderRadius: radius.pill }, sizeText: { fontSize: 13, fontFamily: typography.semibold, color: colors.white }, unique: { flex: 1, fontSize: 11, lineHeight: 15, color: colors.muted }, measurements: { backgroundColor: colors.lilacLight, borderRadius: radius.md, padding: spacing.sm, marginTop: 7 }, measureTitle: { flexDirection: 'row', alignItems: 'center', gap: 7 }, measureLabel: { fontFamily: typography.semibold, fontSize: 12, color: colors.purpleDark }, measureText: { fontSize: 12, lineHeight: 16, paddingLeft: 28 },
  actions: { flexDirection: 'row', gap: 10, marginTop: spacing.lg }, backButton: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 5, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.purple }, backLabel: { fontFamily: typography.semibold, fontSize: 13, color: colors.purpleDark }, addButton: { flex: 1.75, borderRadius: radius.pill, overflow: 'hidden' }, addInner: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 8, paddingVertical: 7, borderRadius: radius.pill }, addLabel: { flexShrink: 1, textAlign: 'center', fontFamily: typography.medium, fontSize: 13, color: colors.white }, disabled: { opacity: .5 }, unavailable: { fontSize: 13, color: colors.danger, marginTop: spacing.sm },
  overlay: { flex: 1, padding: spacing.xl, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.deep + '99' }, dialog: { width: '100%', maxWidth: 420, padding: spacing.xl, borderRadius: radius.lg, backgroundColor: colors.ivory }, notice: { marginVertical: spacing.lg },
});
