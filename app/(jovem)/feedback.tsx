import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthDatabase } from '../../src/context/AuthContext';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { getOrder, getOrderPieces, saveFeedback } from '../../src/database/repositories';
import type { Order, OrderPiece, FeedbackAnswers } from '../../src/types/models';
import { colors, radius, typography, spacing } from '../../src/constants/theme';
import { BottomNav, BrandMark, Heading, BodyText, IconView, Button, StateView } from '../../src/components/Design';
import { datePT } from '../../src/utils/format';
import { canReviewOrder, validDeliveryDate } from '../../src/utils/orderTracking';
import { registeredPhoto } from '../../src/constants/pictures';

type ChoiceProps = { label: string; selected: boolean; disabled: boolean; onPress: () => void; icon?: 'thumbs-up-outline' | 'thumbs-down-outline'; accessibilityLabel?: string };
function Choice({ label, selected, disabled, onPress, icon, accessibilityLabel }: ChoiceProps) {
  return <Pressable accessibilityRole="radio" accessibilityLabel={accessibilityLabel || label} accessibilityState={{ checked: selected, disabled }} disabled={disabled} onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}>{icon && <IconView name={icon} size={15} color={selected ? colors.white : colors.purpleDark} />}<Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>{label}</Text></Pressable>;
}
export default function Feedback() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useAuthDatabase();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [order, setOrder] = useState<Order | null>(null);
  const [pieces, setPieces] = useState<OrderPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [answers, setAnswers] = useState<FeedbackAnswers>({});
  const [interview, setInterview] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState<'success' | 'notifications' | null>(null);
  const [retry, setRetry] = useState(0);
  const saving = useRef(false);
  const sent = useRef(false);
  const formOrder = useRef<string | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true); setLoadError(false);
    if (formOrder.current !== id) {
      formOrder.current = id; setAnswers({}); setInterview(null); setComment(''); setError(''); sent.current = false;
    }
    const load = async () => {
      try {
        const orderId = Number(id);
        if (!Number.isSafeInteger(orderId) || orderId < 1) { if (active) { setOrder(null); setPieces([]); } return; }
        const selected = await getOrder(db, orderId);
        const items = selected && canReviewOrder(selected) ? await getOrderPieces(db, orderId) : [];
        if (active) { setOrder(selected); setPieces(items); }
      } catch { if (active) setLoadError(true); }
      finally { if (active) setLoading(false); }
    };
    void load();
    return () => { active = false; };
  }, [db, id, retry]));
  const back = () => order ? router.replace({ pathname: '/(jovem)/acompanhar', params: { id: String(order.id) } }) : router.replace('/(jovem)/historico-pedidos');
  const send = async () => {
    if (!order || !canReviewOrder(order) || saving.current || sent.current) return;
    if (!pieces.length || pieces.some(piece => typeof answers[piece.pedido_item_id] !== 'boolean') || interview === null) {
      setError('Avalie cada peça e responda à pergunta sobre entrevista de emprego antes de enviar.'); return;
    }
    saving.current = true; setBusy(true); setError('');
    try {
      await saveFeedback(db, order.id, answers, interview, comment);
      sent.current = true; setDialog('success');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar. Suas respostas foram preservadas. Tente novamente.'); }
    finally { saving.current = false; setBusy(false); }
  };
  const completed = pieces.length > 0 && interview !== null && pieces.every(piece => typeof answers[piece.pedido_item_id] === 'boolean');
  const deliveredDate = validDeliveryDate(order?.data_entrega_real ?? null);
  return <SafeAreaView edges={['top']} style={styles.safe}><View style={styles.page}>
    <LinearGradient colors={[colors.deep, colors.purpleDark, colors.purple]} style={styles.header}>
      <View style={styles.brand}><BrandMark size={47} /><Text style={styles.wordmark}>TRAJEtória</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Notificações" onPress={() => setDialog('notifications')} style={styles.bell}><IconView name="notifications-outline" size={21} color={colors.lavender} /></Pressable>
      <Svg width="100%" height={40} viewBox="0 0 390 40" preserveAspectRatio="none" style={styles.wave} accessible={false}><Path d="M0 34 C111 -33 204 72 390 5 L390 40 L0 40Z" fill={colors.lavender} opacity=".35" /><Path d="M0 35 C111 -29 204 73 390 12 L390 40 L0 40Z" fill={colors.ivory} /><Path d="M0 35 C111 -29 204 73 390 12" fill="none" stroke={colors.gold} strokeWidth="1.8" /></Svg>
    </LinearGradient>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
    <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.titleRow}><Pressable accessibilityRole="button" accessibilityLabel="Voltar ao pedido" disabled={busy} onPress={back} style={styles.back}><IconView name="arrow-back" size={21} /></Pressable><View style={styles.flex}><Heading size={30}>Feedback</Heading><BodyText style={styles.subtitle}>Conte pra gente como foi sua experiência com o pedido.</BodyText></View></View>
      {loading ? <StateView mode="loading" /> : loadError ? <StateView mode="error" message="Não foi possível carregar o pedido." onRetry={() => setRetry(value => value + 1)} /> : !order || order.status !== 'entregue' ? <View><StateView mode="empty" message="O feedback está disponível apenas para pedidos entregues da sua conta." /><Button title="Voltar aos pedidos" outline onPress={back} /></View> : !canReviewOrder(order) ? <View><StateView mode="empty" message="Você já enviou o feedback deste pedido. Obrigado!" /><Button title="Voltar ao início" onPress={() => router.replace('/(jovem)/inicio')} /></View> : <>
        <View style={styles.orderCard}><View style={styles.orderIcon}><IconView name="cube-outline" size={29} /></View><View style={styles.flex}><BodyText style={styles.orderTitle}>Pedido #{order.id}</BodyText><BodyText style={styles.deliveryDate}>{deliveredDate ? `Entregue em ${datePT(deliveredDate)}` : 'Entrega concluída · data não informada'}</BodyText></View><View style={styles.delivered}><IconView name="checkmark-circle-outline" size={15} color={colors.success} /><BodyText style={styles.deliveredText}>Entregue</BodyText></View></View>
        <BodyText style={styles.sectionTitle}>Avalie as peças recebidas</BodyText>
        {pieces.length === 0 && <BodyText style={styles.error}>Nenhuma peça vinculada foi encontrada. Consulte a equipe responsável antes de avaliar.</BodyText>}
        {pieces.map(piece => {
          const photo = piece.foto ? registeredPhoto(piece.foto, piece.id) : null;
          return <View key={piece.pedido_item_id} style={[styles.pieceCard, width < 390 && styles.pieceCardNarrow]}>
            <View style={styles.pieceIntro}><View style={styles.photoFrame}>{photo ? <Image source={photo} resizeMode="cover" style={styles.photo} accessibilityLabel={`Fotografia ilustrativa: ${piece.nome}`} /> : <IconView name="image-outline" size={24} />}</View><View style={styles.flex}><BodyText style={styles.pieceName}>{piece.nome}</BodyText><BodyText style={styles.pieceSize}>Tamanho: {piece.tamanho}</BodyText></View></View>
            <View accessibilityRole="radiogroup" accessibilityLabel={`A roupa ${piece.nome} serviu?`} style={styles.choices}><Choice label="Serviu" icon="thumbs-up-outline" accessibilityLabel={`${piece.nome}: Serviu`} selected={answers[piece.pedido_item_id] === true} disabled={busy || sent.current} onPress={() => setAnswers(current => ({ ...current, [piece.pedido_item_id]: true }))} /><Choice label="Não serviu" icon="thumbs-down-outline" accessibilityLabel={`${piece.nome}: Não serviu`} selected={answers[piece.pedido_item_id] === false} disabled={busy || sent.current} onPress={() => setAnswers(current => ({ ...current, [piece.pedido_item_id]: false }))} /></View>
          </View>;
        })}
        <View style={styles.interview}><View style={styles.interviewQuestion}><IconView name="chatbubbles-outline" size={27} /><BodyText style={styles.question}>Você participou de alguma entrevista de emprego?</BodyText></View><View accessibilityRole="radiogroup" accessibilityLabel="Participação em entrevista de emprego" style={styles.choices}><Choice label="Sim" selected={interview === true} disabled={busy || sent.current} onPress={() => setInterview(true)} /><Choice label="Não" selected={interview === false} disabled={busy || sent.current} onPress={() => setInterview(false)} /></View></View>
        <BodyText style={styles.sectionTitle}>Deixe um comentário <Text style={styles.optional}>(opcional)</Text></BodyText>
        <View style={styles.commentFrame}><TextInput accessibilityLabel="Comentário opcional, até 300 caracteres" multiline maxLength={300} editable={!busy && !sent.current} value={comment} onChangeText={setComment} placeholder="Conte o que achou das peças, do atendimento e da entrega..." placeholderTextColor={colors.muted} style={styles.comment} /><BodyText style={styles.counter}>{comment.length}/300</BodyText></View>
        {!!error && <BodyText accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</BodyText>}
        {!completed && <BodyText style={styles.required}>Responda sobre cada peça e a entrevista para liberar o envio.</BodyText>}
        <Pressable accessibilityRole="button" accessibilityLabel="Enviar feedback" accessibilityState={{ disabled: !completed || busy || sent.current, busy }} disabled={!completed || busy || sent.current} onPress={() => void send()} style={styles.send}><LinearGradient colors={[colors.purple, colors.purpleDark]} style={[styles.sendInner, (!completed || busy) && styles.disabled]}>{busy ? <ActivityIndicator color={colors.white} /> : <><IconView name="paper-plane-outline" size={25} color={colors.white} /><Text style={styles.sendLabel}>Enviar feedback</Text></>}</LinearGradient></Pressable>
      </>}
    </ScrollView></KeyboardAvoidingView>
    <BottomNav active="pedidos" />
  </View>
  <Modal visible={dialog !== null} transparent animationType="fade" onRequestClose={() => { if (dialog === 'success') router.replace('/(jovem)/inicio'); else setDialog(null); }}><View style={styles.overlay}><View accessibilityViewIsModal style={styles.dialog}><Heading size={29}>{dialog === 'success' ? 'Obrigado pelo feedback!' : 'Notificações'}</Heading><BodyText style={styles.dialogText}>{dialog === 'success' ? 'Suas respostas foram registradas e ajudarão a avaliar os resultados do TRAJEtória.' : 'As notificações serão integradas ao módulo operacional em uma versão futura. Consulte seus pedidos pelo histórico.'}</BodyText><Button title={dialog === 'success' ? 'Voltar ao início' : 'Fechar'} onPress={() => { if (dialog === 'success') router.replace('/(jovem)/inicio'); else setDialog(null); }} /></View></View></Modal>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.deep }, page: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: colors.ivory }, flex: { flex: 1 }, header: { height: 86 }, brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingTop: 8, paddingRight: 26 }, wordmark: { fontFamily: typography.headingRegular, fontSize: 29, color: colors.ivory }, bell: { position: 'absolute', right: 23, top: 13, width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.lavender + '22', alignItems: 'center', justifyContent: 'center' }, wave: { position: 'absolute', bottom: -1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl, flexGrow: 1 }, titleRow: { flexDirection: 'row', gap: 9, marginBottom: spacing.md }, back: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.lilac, alignItems: 'center', justifyContent: 'center' }, subtitle: { fontSize: 12, lineHeight: 16, marginTop: 3 }, orderCard: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: colors.lilacLight, borderRadius: radius.md, padding: 10 }, orderIcon: { paddingRight: 10, borderRightWidth: 1, borderRightColor: colors.line }, orderTitle: { fontFamily: typography.semibold, fontSize: 13, lineHeight: 18, color: colors.purpleDark }, deliveryDate: { fontSize: 10, lineHeight: 14 }, delivered: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: radius.pill, paddingHorizontal: 6, paddingVertical: 3, backgroundColor: colors.successBg }, deliveredText: { fontSize: 10, lineHeight: 14, color: colors.success },
  sectionTitle: { fontFamily: typography.semibold, color: colors.purpleDark, fontSize: 15, marginTop: spacing.md, marginBottom: 6 }, optional: { fontFamily: typography.regular }, pieceCard: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.lilacLight, borderRadius: radius.md, padding: 6, marginBottom: 6 }, pieceCardNarrow: { flexDirection: 'column', alignItems: 'stretch' }, pieceIntro: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }, photoFrame: { width: 53, aspectRatio: 1, borderRadius: radius.sm, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lilac }, photo: { width: '100%', height: '100%' }, pieceName: { fontFamily: typography.semibold, fontSize: 13, lineHeight: 17, color: colors.purpleDark }, pieceSize: { fontSize: 11, lineHeight: 16, marginTop: 2 }, choices: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: 5 }, choice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 40, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 5, borderWidth: 1, borderColor: colors.purple }, choiceSelected: { backgroundColor: colors.purpleDark }, choiceLabel: { fontFamily: typography.medium, fontSize: 11, color: colors.purpleDark }, choiceLabelSelected: { color: colors.white },
  interview: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, borderRadius: radius.md, backgroundColor: colors.warningBg, padding: 10, marginTop: 8 }, interviewQuestion: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1, minWidth: 170 }, question: { flex: 1, fontSize: 12, lineHeight: 16 }, commentFrame: { borderWidth: 1, borderColor: colors.lavender, borderRadius: radius.md, padding: 11 }, comment: { minHeight: 66, fontFamily: typography.regular, color: colors.text, fontSize: 13, lineHeight: 18, textAlignVertical: 'top', padding: 0 }, counter: { fontSize: 10, lineHeight: 15, textAlign: 'right', color: colors.muted }, error: { color: colors.danger, fontSize: 13, marginTop: spacing.sm }, required: { color: colors.muted, fontSize: 11, lineHeight: 15, marginTop: spacing.sm }, send: { marginTop: spacing.lg, borderRadius: radius.pill, shadowColor: colors.purpleDark, shadowOpacity: .18, shadowOffset: { width: 0, height: 4 }, shadowRadius: 7, elevation: 3 }, sendInner: { minHeight: 53, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 13, padding: 12 }, sendLabel: { fontFamily: typography.semibold, fontSize: 16, color: colors.white }, disabled: { opacity: .5 }, overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, backgroundColor: colors.deep + '99' }, dialog: { width: '100%', maxWidth: 420, backgroundColor: colors.ivory, borderRadius: radius.lg, padding: spacing.xl }, dialogText: { marginVertical: spacing.lg },
});

