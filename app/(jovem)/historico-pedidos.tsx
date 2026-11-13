import React, { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { BottomNav, BrandMark, Button, Heading, BodyText, IconView, StateView } from '../../src/components/Design';
import { listOrders } from '../../src/database/repositories';
import type { Order } from '../../src/types/models';
import { colors, radius, spacing, typography } from '../../src/constants/theme';
import { dateShort, statusLabels } from '../../src/utils/format';

export default function OrderHistory() {
  const [notifications, setNotifications] = useState(false);
  const db = useSQLiteContext();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true); setError(false);
    listOrders(db).then(result => { if (active) setOrders(result); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [db, retry]));
  return <SafeAreaView edges={['top']} style={styles.safe}><View style={styles.page}>
    <LinearGradient colors={[colors.deep, colors.purpleDark, colors.purple]} style={styles.header}>
      <View style={styles.brand}><BrandMark size={47} /><Text style={styles.wordmark}>TRAJEtória</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Notificações" onPress={() => setNotifications(true)} style={styles.bell}><IconView name="notifications-outline" size={21} color={colors.lavender} /></Pressable>
      <Svg width="100%" height={40} viewBox="0 0 390 40" preserveAspectRatio="none" style={styles.wave} accessible={false}><Path d="M0 34 C111 -33 204 72 390 5 L390 40 L0 40Z" fill={colors.lavender} opacity=".35" /><Path d="M0 35 C111 -29 204 73 390 12 L390 40 L0 40Z" fill={colors.ivory} /><Path d="M0 35 C111 -29 204 73 390 12" fill="none" stroke={colors.gold} strokeWidth="1.8" /></Svg>
    </LinearGradient>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.titleRow}><Pressable accessibilityRole="button" accessibilityLabel="Voltar ao meu pedido" onPress={() => router.replace('/(jovem)/meu-pedido')} style={styles.back}><IconView name="arrow-back" size={21} /></Pressable><View style={styles.copy}><Heading size={29}>Histórico de pedidos</Heading><BodyText style={styles.subtitle}>Consulte suas solicitações e acompanhe cada pedido.</BodyText></View></View>
    {loading ? <StateView mode="loading" message="Carregando seus pedidos..." /> : error ? <StateView mode="error" message="Não foi possível carregar o histórico." onRetry={() => setRetry(value => value + 1)} /> : orders.length === 0 ? <StateView mode="empty" message="Você ainda não confirmou nenhum pedido. Escolha suas peças no catálogo para começar." /> :
      <View style={styles.list}>{orders.map(order => <Pressable key={order.id} accessibilityRole="button" accessibilityLabel={`Pedido ${order.id}, ${statusLabels[order.status]}. Ver acompanhamento`} onPress={() => router.push({ pathname: '/(jovem)/acompanhar', params: { id: String(order.id) } })} style={styles.card}>
        <View style={styles.icon}><IconView name="cube-outline" size={27} /></View>
        <View style={styles.copy}><BodyText style={styles.title}>Pedido #{order.id}</BodyText><BodyText style={styles.date}>Enviado em {dateShort(order.data_pedido)}</BodyText><View style={styles.status}><BodyText style={styles.statusText}>{statusLabels[order.status]}</BodyText></View></View>
        <IconView name="chevron-forward" size={20} />
      </Pressable>)}</View>}
    </ScrollView>
    <BottomNav active="pedidos" />
  </View>
  <Modal visible={notifications} transparent animationType="fade" onRequestClose={() => setNotifications(false)}><View style={styles.overlay}><View accessibilityViewIsModal style={styles.dialog}><Heading size={29}>Notificações</Heading><BodyText style={{ marginVertical: spacing.lg }}>As notificações serão integradas ao módulo operacional em uma versão futura. Consulte as atualizações pelo histórico de pedidos.</BodyText><Button title="Fechar" onPress={() => setNotifications(false)} /></View></View></Modal>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.deep }, page: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: colors.ivory }, scroll: { flex: 1 }, content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg, flexGrow: 1 },
  header: { height: 86 }, brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingTop: 8, paddingRight: 26 }, wordmark: { fontFamily: typography.headingRegular, fontSize: 29, color: colors.ivory }, bell: { position: 'absolute', right: 23, top: 13, width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.lavender + '22', alignItems: 'center', justifyContent: 'center' }, wave: { position: 'absolute', bottom: -1 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginBottom: spacing.md }, back: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.lilac, alignItems: 'center', justifyContent: 'center' }, subtitle: { fontSize: 12, lineHeight: 17, marginTop: 4 },
  status: { alignSelf: 'flex-start', backgroundColor: colors.warningBg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 2 }, statusText: { fontFamily: typography.semibold, fontSize: 13, lineHeight: 18, color: colors.purpleDark },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, backgroundColor: colors.deep + '99' }, dialog: { width: '100%', maxWidth: 420, padding: spacing.xl, backgroundColor: colors.ivory, borderRadius: radius.lg },
  list: { gap: spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.lilacLight },
  icon: { width: 45, height: 45, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lilac },
  copy: { flex: 1, gap: 4 },
  title: { fontFamily: typography.semibold, color: colors.purpleDark, fontSize: 17 },
  date: { color: colors.muted, fontSize: 12 },
});

