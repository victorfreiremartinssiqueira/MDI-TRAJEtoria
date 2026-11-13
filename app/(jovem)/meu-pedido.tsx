import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuthDatabase } from '../../src/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { colors, config, radius, typography, spacing } from '../../src/constants/theme';
import { BottomNav, BrandMark, BodyText, Heading, Button, IconView, StateView } from '../../src/components/Design';
import { getSelection, removePieceFromSelection } from '../../src/database/repositories';
import { pieceImage } from '../../src/constants/pictures';
import type { Piece } from '../../src/types/models';

type Notice = { title: string; message: string };
export default function Basket() {
  const db = useAuthDatabase();
  const router = useRouter();
  const [items, setItems] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<Piece | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [retry, setRetry] = useState(0);
  const mutation = useRef(false);
  const catalog = () => router.push('/(jovem)/catalogo');
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true); setError('');
    getSelection(db).then(result => { if (active) setItems(result); })
      .catch(() => { if (active) setError('Não foi possível carregar sua seleção. Tente novamente.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [db, retry]));
  const remove = async (piece: Piece) => {
    if (mutation.current) return;
    mutation.current = true; setRemoving(piece.id); setConfirmRemove(null);
    try {
      await removePieceFromSelection(db, piece.id);
      setItems(current => current.filter(item => item.id !== piece.id));
    } catch {
      setNotice({ title: 'Não foi possível remover', message: 'Sua seleção foi preservada. Tente novamente.' });
    } finally { mutation.current = false; setRemoving(null); }
  };
  const continueDelivery = async () => {
    if (mutation.current) return;
    mutation.current = true; setChecking(true);
    try {
      const current = await getSelection(db);
      setItems(current);
      if (current.length < 1 || current.length > config.maxItemsPerOrder) {
        setNotice({ title: 'Revise sua seleção', message: `Escolha de 1 a ${config.maxItemsPerOrder} peças antes de continuar para a entrega.` });
        return;
      }
      if (current.some(item => item.status !== 'disponivel')) {
        setNotice({ title: 'Peça indisponível', message: 'Uma peça da seleção não está mais disponível. Remova as peças indicadas e escolha outras no catálogo.' });
        return;
      }
      router.push('/(jovem)/entrega');
    } catch { setNotice({ title: 'Não foi possível continuar', message: 'Não foi possível conferir sua seleção. Tente novamente.' }); }
    finally { mutation.current = false; setChecking(false); }
  };
  const valid = items.length > 0 && items.length <= config.maxItemsPerOrder && items.every(item => item.status === 'disponivel');
  const busy = removing !== null || checking;
  return <SafeAreaView edges={['top']} style={styles.safe}><View style={styles.page}>
    <LinearGradient colors={[colors.deep, colors.purpleDark, colors.purple]} style={styles.header}>
      <View style={styles.brand}><BrandMark size={47} /><Text style={styles.wordmark}>TRAJEtória</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Notificações" onPress={() => setNotice({ title: 'Notificações', message: 'As notificações serão integradas ao módulo operacional em uma versão futura. Acompanhe seus pedidos pela tela de acompanhamento.' })} style={styles.bell}><IconView name="notifications-outline" size={21} color={colors.lavender} /></Pressable>
      <Svg width="100%" height={40} viewBox="0 0 390 40" preserveAspectRatio="none" style={styles.wave} accessible={false}>
        <Path d="M0 34 C111 -33 204 72 390 5 L390 40 L0 40Z" fill={colors.lavender} opacity=".35" />
        <Path d="M0 35 C111 -29 204 73 390 12 L390 40 L0 40Z" fill={colors.ivory} />
        <Path d="M0 35 C111 -29 204 73 390 12" fill="none" stroke={colors.gold} strokeWidth="1.8" />
      </Svg>
    </LinearGradient>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.titleRow}><Pressable accessibilityRole="button" accessibilityLabel="Voltar ao catálogo" onPress={catalog} style={styles.backIcon}><IconView name="arrow-back" size={22} /></Pressable><View style={styles.flex}><Heading size={31}>Meu pedido</Heading><BodyText style={styles.subtitle}>Revise as peças escolhidas antes de continuar para a entrega.</BodyText></View></View>
      <Pressable accessibilityRole="button" onPress={() => router.push('/(jovem)/historico-pedidos')} style={styles.historyLink}><IconView name="time-outline" size={21} /><BodyText style={styles.historyLabel}>Histórico de pedidos</BodyText><IconView name="chevron-forward" size={18} /></Pressable>
      {loading ? <StateView mode="loading" message="Carregando sua seleção..." /> : error ? <StateView mode="error" message={error} onRetry={() => setRetry(value => value + 1)} /> : <>
        {items.length === 0 ? <View style={styles.empty}><IconView name="bag-handle-outline" size={48} /><Heading size={28} style={styles.emptyTitle}>Seu pedido está vazio</Heading><BodyText style={styles.emptyText}>Escolha suas peças favoritas para começar.</BodyText><Button title="Explorar catálogo" icon="add" onPress={catalog} /></View> : <>
          <View style={styles.list}>{items.map(piece => <View key={piece.id} style={styles.product}>
            <View style={styles.photoFrame}><Image source={pieceImage(piece.id)} resizeMode="cover" style={styles.photo} accessibilityLabel={`Fotografia ilustrativa: ${piece.nome}`} /></View>
            <View style={styles.productCopy}><BodyText style={styles.productName}>{piece.nome}</BodyText><BodyText style={styles.productInfo}>{piece.genero}</BodyText><BodyText style={styles.productInfo}>Tamanho: {piece.tamanho}</BodyText>{piece.status !== 'disponivel' && <BodyText style={styles.unavailable}>Indisponível — remova para continuar.</BodyText>}</View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Remover ${piece.nome}`} accessibilityState={{ disabled: busy, busy: removing === piece.id }} disabled={busy} onPress={() => setConfirmRemove(piece)} style={styles.trash}>{removing === piece.id ? <ActivityIndicator color={colors.purple} size="small" /> : <IconView name="trash-outline" size={23} color={colors.purpleDark} />}</Pressable>
          </View>)}</View>
          <Pressable accessibilityRole="button" onPress={catalog} style={styles.addMore}><IconView name="add" size={24} color={colors.purpleDark} /><Text style={styles.addMoreLabel}>Adicionar mais peças</Text></Pressable>
        </>}
        <View style={styles.reservation}><View style={styles.noticeIcon}><IconView name="information-circle-outline" size={27} color={colors.purpleDark} /></View><View style={styles.reservationText}><BodyText style={styles.reservationTitle}>Reserva das peças</BodyText><BodyText style={styles.reservationBody}>As peças serão reservadas para você após a confirmação do pedido. Escolha até {config.maxItemsPerOrder} peças.</BodyText></View></View>
        <View style={styles.actions}><Pressable accessibilityRole="button" onPress={catalog} style={styles.backButton}><IconView name="arrow-back" size={21} /><Text style={styles.backLabel}>Voltar ao catálogo</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Continuar para a entrega" accessibilityState={{ disabled: !valid || busy, busy: checking }} disabled={!valid || busy} onPress={() => void continueDelivery()} style={styles.continueButton}><LinearGradient colors={[colors.purple, colors.purpleDark]} style={[styles.continueInner, (!valid || busy) && styles.disabled]}>{checking ? <ActivityIndicator color={colors.white} /> : <><IconView name="car-outline" size={25} color={colors.white} /><Text style={styles.continueLabel}>Continuar para a entrega</Text></>}</LinearGradient></Pressable></View>
      </>}
    </ScrollView>
    <BottomNav active="pedidos" />
  </View>
  <Modal visible={confirmRemove !== null} transparent animationType="fade" onRequestClose={() => setConfirmRemove(null)}><View style={styles.overlay}><View accessibilityViewIsModal style={styles.dialog}><Heading size={29}>Remover peça?</Heading><BodyText style={styles.dialogText}>Deseja retirar {confirmRemove?.nome} da seleção? As outras peças serão mantidas.</BodyText><Button title="Remover" icon="trash-outline" onPress={() => { if (confirmRemove) void remove(confirmRemove); }} style={{ marginBottom: spacing.sm }} /><Button title="Cancelar" outline onPress={() => setConfirmRemove(null)} /></View></View></Modal>
  <Modal visible={notice !== null} transparent animationType="fade" onRequestClose={() => setNotice(null)}><View style={styles.overlay}><View accessibilityViewIsModal style={styles.dialog}><Heading size={29}>{notice?.title}</Heading><BodyText style={styles.dialogText}>{notice?.message}</BodyText><Button title="Fechar" onPress={() => setNotice(null)} /></View></View></Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  historyLink: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 44, marginBottom: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line }, historyLabel: { flex: 1, fontFamily: typography.medium, color: colors.purpleDark, fontSize: 14 },
  safe: { flex: 1, backgroundColor: colors.deep }, page: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: colors.ivory }, flex: { flex: 1 }, scroll: { flex: 1 },
  header: { height: 86 }, brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingTop: 8, paddingRight: 26 }, wordmark: { fontFamily: typography.headingRegular, fontSize: 29, color: colors.ivory }, bell: { position: 'absolute', right: 23, top: 13, width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.lavender + '22', alignItems: 'center', justifyContent: 'center' }, wave: { position: 'absolute', bottom: -1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl, flexGrow: 1 }, titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: spacing.xl }, backIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lilac, borderRadius: radius.pill }, subtitle: { fontSize: 14, lineHeight: 19, marginTop: spacing.xs, maxWidth: 300 },
  list: { gap: spacing.sm }, product: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.lilacLight, borderRadius: radius.lg, padding: 6, minHeight: 92 }, photoFrame: { width: '27%', maxWidth: 96, aspectRatio: 1.06, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.lilac }, photo: { width: '100%', height: '100%' }, productCopy: { flex: 1, paddingVertical: 4 }, productName: { fontSize: 16, fontFamily: typography.semibold, lineHeight: 20, color: colors.purpleDark, marginBottom: 4 }, productInfo: { fontSize: 13, lineHeight: 19 }, trash: { width: 40, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.lilac, marginRight: 4 }, unavailable: { color: colors.danger, fontSize: 11, lineHeight: 15, marginTop: 4 },
  addMore: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: spacing.xl, paddingVertical: 5, minHeight: 42, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.purple, marginTop: spacing.md, maxWidth: '100%' }, addMoreLabel: { flexShrink: 1, textAlign: 'center', fontFamily: typography.semibold, color: colors.purpleDark, fontSize: 14 },
  reservation: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.warningBg, borderRadius: radius.lg, paddingVertical: 11, paddingHorizontal: spacing.md, gap: 12, marginTop: spacing.lg }, noticeIcon: { paddingRight: 9, borderRightWidth: 1, borderRightColor: colors.champagne }, reservationText: { flex: 1 }, reservationTitle: { fontFamily: typography.semibold, color: colors.purpleDark, fontSize: 14, lineHeight: 18 }, reservationBody: { fontSize: 11, lineHeight: 15, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 12, marginTop: spacing.lg }, backButton: { flex: 1, minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.purple, paddingHorizontal: 12, paddingVertical: 8 }, backLabel: { flex: 1, fontFamily: typography.semibold, color: colors.purpleDark, fontSize: 14, textAlign: 'center', lineHeight: 18 }, continueButton: { flex: 1.35, borderRadius: radius.pill, shadowColor: colors.purpleDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: .16, shadowRadius: 7, elevation: 3 }, continueInner: { flex: 1, minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 }, continueLabel: { flex: 1, textAlign: 'center', fontFamily: typography.medium, color: colors.white, fontSize: 14, lineHeight: 18 }, disabled: { opacity: .5 },
  empty: { alignItems: 'center', backgroundColor: colors.lilacLight, borderRadius: radius.lg, padding: spacing.xl }, emptyTitle: { marginTop: spacing.md, textAlign: 'center' }, emptyText: { fontSize: 14, textAlign: 'center', marginVertical: spacing.md }, overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, backgroundColor: colors.deep + '99' }, dialog: { width: '100%', maxWidth: 420, padding: spacing.xl, backgroundColor: colors.ivory, borderRadius: radius.lg }, dialogText: { marginVertical: spacing.lg },
});

