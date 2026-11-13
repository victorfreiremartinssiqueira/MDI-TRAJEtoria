import React, { useCallback, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthDatabase } from '../../src/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { BottomNav, BrandMark, Heading, BodyText, Button, IconView, StateView } from '../../src/components/Design';
import { listOrders, getOrderPieces, getOrderHistory } from '../../src/database/repositories';
import { datePT, dateShort, statusLabels } from '../../src/utils/format';
import { trackingMessages, trackingStages, canReviewOrder, validDeliveryDate } from '../../src/utils/orderTracking';
import { registeredPhoto } from '../../src/constants/pictures';
import type { Order, OrderPiece, OrderHistory } from '../../src/types/models';
import { colors, typography, radius, spacing } from '../../src/constants/theme';

export default function Tracking() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const db = useAuthDatabase();
  const router = useRouter();
  const [current, setCurrent] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderPiece[]>([]);
  const [history, setHistory] = useState<OrderHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [dialog, setDialog] = useState<'support' | 'notifications' | 'forecast' | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true); setError(false); setExpanded(false);
    const load = async () => {
      try {
        const all = await listOrders(db);
        // A requested ID must belong to the current young person; never substitute another order.
        const selected = id !== undefined ? all.find(order => order.id === Number(id)) ?? null : all[0] ?? null;
        const [pieces, events] = selected ? await Promise.all([getOrderPieces(db, selected.id), getOrderHistory(db, selected.id)]) : [[], []];
        if (active) { setCurrent(selected); setItems(pieces); setHistory(events); }
      } catch { if (active) setError(true); }
      finally { if (active) setLoading(false); }
    };
    void load();
    return () => { active = false; };
  }, [db, id, retry]));
  const back = () => router.replace('/(jovem)/historico-pedidos');
  const forecast = validDeliveryDate(current?.data_entrega_prevista ?? null);
  const dispatch = validDeliveryDate(current?.data_despacho_prevista ?? null);
  return <SafeAreaView edges={['top']} style={styles.safe}><View style={styles.page}>
    <LinearGradient colors={[colors.deep, colors.purpleDark, colors.purple]} style={styles.header}>
      <View style={styles.brand}><BrandMark size={47} /><Text style={styles.wordmark}>TRAJEtória</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Notificações" onPress={() => setDialog('notifications')} style={styles.bell}><IconView name="notifications-outline" size={21} color={colors.lavender} /></Pressable>
      <Svg width="100%" height={40} viewBox="0 0 390 40" preserveAspectRatio="none" style={styles.wave} accessible={false}><Path d="M0 34 C111 -33 204 72 390 5 L390 40 L0 40Z" fill={colors.lavender} opacity=".35" /><Path d="M0 35 C111 -29 204 73 390 12 L390 40 L0 40Z" fill={colors.ivory} /><Path d="M0 35 C111 -29 204 73 390 12" fill="none" stroke={colors.gold} strokeWidth="1.8" /></Svg>
    </LinearGradient>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.titleRow}><Pressable accessibilityRole="button" accessibilityLabel="Voltar ao histórico de pedidos" onPress={back} style={styles.back}><IconView name="arrow-back" size={21} /></Pressable><View style={styles.flex}><Heading size={29}>Acompanhar pedido</Heading><BodyText style={styles.subtitle}>Veja em que etapa está o seu pedido.</BodyText></View></View>
      {loading ? <StateView mode="loading" message="Carregando seu pedido..." /> : error ? <StateView mode="error" message="Não foi possível carregar o pedido." onRetry={() => setRetry(value => value + 1)} /> : !current ? <View><StateView mode="empty" message={id ? 'Pedido não encontrado para sua conta.' : 'Você ainda não possui pedidos confirmados.'} /><Button title="Ver histórico de pedidos" outline onPress={back} /></View> : <>
        <View style={styles.summary}><View style={styles.box}><IconView name="cube-outline" size={40} color={colors.purpleDark} /></View><View style={styles.flex}><View style={styles.status}><BodyText style={styles.statusText}>{statusLabels[current.status]}</BodyText></View><BodyText style={styles.message}>{trackingMessages[current.status]}</BodyText></View></View>
        <View style={styles.timeline} accessibilityLabel={`Pedido ${current.id}: ${statusLabels[current.status]}`}>
          {trackingStages(current.status).map((stage, index, stages) => <View key={stage.status} style={styles.stage}>
            {index < stages.length - 1 && <View style={[styles.connector, stage.completed && styles.completedLine]} />}
            <View accessibilityLabel={`${statusLabels[stage.status]}: ${stage.current ? 'etapa atual' : stage.completed ? 'concluída' : 'não concluída'}`} style={[styles.circle, (stage.completed || stage.current) && styles.filledCircle, stage.current && styles.currentCircle]}>{(stage.completed || stage.current) && <IconView name="checkmark" size={17} color={colors.white} />}</View>
            <BodyText style={[styles.stageLabel, stage.current && styles.currentLabel]}>{stage.status === 'em_separacao' ? 'Em\nseparação' : statusLabels[stage.status]}</BodyText>
          </View>)}
        </View>
        <View style={styles.forecast}><View style={styles.calendar}><IconView name="calendar-outline" size={29} /></View><View style={styles.flex}><BodyText style={styles.forecastTitle}>Previsão de entrega</BodyText><BodyText style={styles.forecastDate}>{forecast ? datePT(forecast) : 'Previsão de entrega ainda não disponível'}</BodyText></View><Pressable accessibilityRole="button" accessibilityLabel="Informações sobre a previsão de entrega" onPress={() => setDialog('forecast')} style={styles.info}><IconView name="information-circle-outline" size={21} /></Pressable></View>
        <BodyText style={styles.itemsTitle}>Itens do pedido #{current.id}</BodyText>
        <View style={styles.items}>{items.length ? items.map((piece, index) => {
          const photo = piece.foto ? registeredPhoto(piece.foto, piece.id) : null;
          return <View key={piece.pedido_item_id} style={[styles.item, index > 0 && styles.itemBorder]}><View style={styles.photoFrame}>{photo ? <Image source={photo} resizeMode="cover" style={styles.photo} accessibilityLabel={`Fotografia ilustrativa: ${piece.nome}`} /> : <IconView name="image-outline" size={25} />}</View><View style={styles.itemCopy}><BodyText style={styles.itemName}>{piece.nome}</BodyText><BodyText style={styles.itemDetails}>{piece.genero} · {piece.tamanho}</BodyText></View><View style={styles.quantity}><BodyText style={styles.quantityText}>1 un.</BodyText></View></View>;
        }) : <BodyText style={styles.noItems}>Nenhum item vinculado encontrado. Consulte a equipe.</BodyText>}</View>
        <Pressable accessibilityRole="button" onPress={() => setDialog('support')} style={styles.contact}><IconView name="chatbubble-ellipses-outline" size={25} /><Text style={styles.contactLabel}>Falar com a equipe</Text></Pressable>
        {canReviewOrder(current) && <View style={styles.feedback}><Button title="Avaliar peças recebidas" icon="heart-outline" outline onPress={() => router.push({ pathname: '/(jovem)/feedback', params: { id: String(current.id) } })} /></View>}
        <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(value => !value)} style={styles.historyToggle}><BodyText style={styles.historyLabel}>Histórico deste pedido</BodyText><IconView name={expanded ? 'chevron-up' : 'chevron-down'} size={17} /></Pressable>
        {expanded && <View style={styles.events}>{history.length ? history.map(event => <View key={event.id} style={styles.event}><IconView name="checkmark-circle-outline" size={17} /><BodyText style={styles.eventText}>{statusLabels[event.status]} · {dateShort(event.atualizado_em)}{event.observacao ? `\n${event.observacao}` : ''}</BodyText></View>) : <BodyText style={styles.eventText}>Nenhum evento registrado.</BodyText>}</View>}
        <Pressable accessibilityRole="button" onPress={back} style={styles.allOrders}><BodyText style={styles.allOrdersLabel}>Ver todos os pedidos</BodyText></Pressable>
      </>}
    </ScrollView>
    <BottomNav active="pedidos" />
  </View>
  <Modal visible={dialog !== null} transparent animationType="fade" onRequestClose={() => setDialog(null)}><View style={styles.overlay}><View accessibilityViewIsModal style={styles.dialog}><Heading size={29}>{dialog === 'support' ? 'Falar com a equipe' : dialog === 'forecast' ? 'Previsão de entrega' : 'Notificações'}</Heading><BodyText style={styles.dialogText}>{dialog === 'support' ? 'O canal de atendimento ainda não está configurado nesta demonstração. Procure a equipe da ONG vinculada ao seu cadastro para obter orientação sobre o pedido.' : dialog === 'forecast' ? `A previsão de entrega é informada pela equipe e não corresponde ao dia de despacho.${dispatch ? ` Despacho previsto: ${datePT(dispatch)}.` : ''}` : 'As notificações serão integradas ao módulo operacional em uma versão futura. Consulte as atualizações pelo histórico de pedidos.'}</BodyText><Button title="Fechar" onPress={() => setDialog(null)} /></View></View></Modal>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.deep }, page: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: colors.ivory }, flex: { flex: 1 }, scroll: { flex: 1 }, header: { height: 86 }, brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingTop: 8, paddingRight: 26 }, wordmark: { fontFamily: typography.headingRegular, fontSize: 29, color: colors.ivory }, bell: { position: 'absolute', right: 23, top: 13, width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.lavender + '22', alignItems: 'center', justifyContent: 'center' }, wave: { position: 'absolute', bottom: -1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg, flexGrow: 1 }, titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginBottom: spacing.md }, back: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.lilac, alignItems: 'center', justifyContent: 'center' }, subtitle: { fontSize: 12, lineHeight: 17, marginTop: 4 }, summary: { flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: radius.lg, backgroundColor: colors.lilacLight, padding: spacing.md }, box: { width: 65, height: 66, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lilac }, status: { alignSelf: 'flex-start', backgroundColor: colors.warningBg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 2 }, statusText: { fontFamily: typography.semibold, fontSize: 16, lineHeight: 21, color: colors.purpleDark }, message: { marginTop: 5, fontSize: 13, lineHeight: 18 },
  timeline: { flexDirection: 'row', marginTop: spacing.lg, marginBottom: spacing.md }, stage: { flex: 1, alignItems: 'center' }, connector: { position: 'absolute', top: 14, left: '50%', width: '100%', height: 2, backgroundColor: colors.lavender }, completedLine: { backgroundColor: colors.purple }, circle: { width: 28, height: 28, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.lavender, backgroundColor: colors.ivory, alignItems: 'center', justifyContent: 'center' }, filledCircle: { backgroundColor: colors.purpleDark, borderColor: colors.purpleDark }, currentCircle: { borderWidth: 3, borderColor: colors.purple }, stageLabel: { textAlign: 'center', fontSize: 10, lineHeight: 13, marginTop: 6, paddingHorizontal: 2 }, currentLabel: { fontFamily: typography.semibold, color: colors.purpleDark },
  forecast: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.warningBg, borderRadius: radius.md, paddingVertical: 9, paddingLeft: 12, paddingRight: 4 }, calendar: { paddingRight: 12, borderRightWidth: 1, borderRightColor: colors.gold }, forecastTitle: { fontFamily: typography.semibold, fontSize: 14, lineHeight: 18, color: colors.purpleDark }, forecastDate: { fontSize: 11, lineHeight: 15 }, info: { width: 36, minHeight: 44, justifyContent: 'center', alignItems: 'center' }, itemsTitle: { fontFamily: typography.semibold, color: colors.purpleDark, fontSize: 16, marginTop: spacing.md, marginBottom: 7 }, items: { borderRadius: radius.lg, backgroundColor: colors.lilacLight, overflow: 'hidden' }, item: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 6 }, itemBorder: { borderTopWidth: 1, borderTopColor: colors.line }, photoFrame: { width: 65, aspectRatio: 1.15, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.lilac, alignItems: 'center', justifyContent: 'center' }, photo: { width: '100%', height: '100%' }, itemCopy: { flex: 1 }, itemName: { fontFamily: typography.semibold, color: colors.purpleDark, fontSize: 14, lineHeight: 18 }, itemDetails: { fontSize: 12, lineHeight: 17, marginTop: 2 }, quantity: { backgroundColor: colors.lilac, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 }, quantityText: { fontFamily: typography.semibold, fontSize: 11, color: colors.purpleDark }, noItems: { padding: spacing.md, fontSize: 13 },
  contact: { alignSelf: 'center', maxWidth: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.purple, borderRadius: radius.pill, paddingHorizontal: spacing.xl, paddingVertical: 6, minHeight: 44, marginTop: spacing.md }, contactLabel: { flexShrink: 1, textAlign: 'center', fontFamily: typography.semibold, color: colors.purpleDark, fontSize: 14 }, feedback: { marginTop: spacing.sm }, historyToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, minHeight: 44, marginTop: 5 }, historyLabel: { fontSize: 11, color: colors.muted }, events: { padding: spacing.sm, gap: 9, borderRadius: radius.md, backgroundColor: colors.lilacLight }, event: { flexDirection: 'row', gap: 8 }, eventText: { flex: 1, fontSize: 12, lineHeight: 17 }, allOrders: { alignSelf: 'center', padding: 7 }, allOrdersLabel: { fontSize: 12, color: colors.purpleDark, textDecorationLine: 'underline' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, backgroundColor: colors.deep + '99' }, dialog: { width: '100%', maxWidth: 420, padding: spacing.xl, backgroundColor: colors.ivory, borderRadius: radius.lg }, dialogText: { marginVertical: spacing.lg },
});

