import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthDatabase } from '../../src/context/AuthContext';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../../src/context/AuthContext';
import { listOrders } from '../../src/database/repositories';
import type { Order, OrderStatus } from '../../src/types/models';
import { colors, spacing, radius, typography } from '../../src/constants/theme';
import { BottomNav, BrandMark, Heading, BodyText, IconView, HangerIcon, Button } from '../../src/components/Design';
import { statusLabels } from '../../src/utils/format';

const orderMessages: Record<OrderStatus, string> = {
  solicitado: 'Sua solicitação foi registrada e aguarda preparação.',
  em_separacao: 'Sua solicitação está sendo preparada pela nossa equipe.',
  despachado: 'Seu pedido foi despachado. Acompanhe sua entrega.',
  entregue: 'Seu pedido foi entregue.',
  cancelado: 'Seu pedido foi cancelado.',
};

function Chevron({ light = false }: { light?: boolean }) {
  return <View style={[styles.chevron, light && styles.chevronLight]}><IconView name="chevron-forward" size={17} color={light ? colors.white : colors.purpleDark} /></View>;
}

export default function Home() {
  const db = useAuthDatabase();
  const router = useRouter();
  const { young } = useAuth();
  const { height } = useWindowDimensions();
  const compact = height < 850;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [reload, setReload] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError(false);
    listOrders(db).then(result => { if (active) setOrders(result); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [db, reload]));
  const inProgress = orders.find(order => !['entregue', 'cancelado'].includes(order.status));
  const openOrder = () => {
    if (error) { setReload(value => value + 1); return; }
    if (inProgress) router.push({ pathname: '/(jovem)/acompanhar', params: { id: String(inProgress.id) } });
    else router.push('/(jovem)/catalogo');
  };

  return <SafeAreaView edges={['top']} style={styles.safe}>
    <View style={styles.page}>
      <LinearGradient colors={[colors.deep, colors.purpleDark, colors.purple]} style={styles.header}>
        <View style={styles.brand}><BrandMark size={47} /><Text style={styles.wordmark}>TRAJEtória</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Notificações" onPress={() => setNotifications(true)} style={styles.bell}><IconView name="notifications-outline" size={21} color={colors.lavender} /></Pressable>
        <Svg width="100%" height={40} viewBox="0 0 390 40" preserveAspectRatio="none" style={styles.wave} accessible={false}>
          <Path d="M0 34 C111 -33 204 72 390 5 L390 40 L0 40Z" fill={colors.lavender} opacity=".35" />
          <Path d="M0 35 C111 -29 204 73 390 12 L390 40 L0 40Z" fill={colors.ivory} />
          <Path d="M0 35 C111 -29 204 73 390 12" fill="none" stroke={colors.gold} strokeWidth="1.8" />
        </Svg>
      </LinearGradient>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={[styles.welcome, { minHeight: compact ? 148 : 180 }]}>
          <Image source={require('../../assets/images/hero-roupas.jpg')} style={styles.clothes} resizeMode="cover" accessible={false} />
          <View style={styles.greeting}>
            <Heading size={30} style={styles.greetingTitle}>Olá, {young?.nome?.trim().split(/\s+/)[0] || 'jovem'}! <Text style={{ fontSize: 24 }}>👋</Text></Heading>
            <BodyText style={styles.welcomeText}>Que bom ter você aqui!</BodyText>
            <BodyText style={styles.presentation}>Escolha suas peças, acompanhe seu pedido e faça parte dessa jornada de inclusão.</BodyText>
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={error ? 'Tentar carregar pedido novamente' : inProgress ? `Meu pedido: ${statusLabels[inProgress.status]}. Acompanhar pedido` : 'Meu pedido. Explorar catálogo'} disabled={loading} onPress={openOrder} style={styles.order}>
          <View style={styles.orderIcon}><IconView name="cube-outline" size={30} color={colors.purpleDark} /></View>
          <View style={styles.orderBody}>
            <BodyText style={styles.cardTitle}>Meu pedido</BodyText>
            {loading ? <ActivityIndicator style={{ alignSelf: 'flex-start' }} color={colors.purple} /> : error ? <BodyText style={styles.orderDescription}>Não foi possível carregar. Toque para tentar novamente.</BodyText> : inProgress ? <>
              <View style={styles.status}><IconView name="cube-outline" size={14} color={colors.purpleDark} /><BodyText style={styles.statusLabel}>{statusLabels[inProgress.status]}</BodyText></View>
              <BodyText style={styles.orderDescription}>{orderMessages[inProgress.status]}</BodyText>
            </> : <BodyText style={styles.orderDescription}>Explore o catálogo para escolher suas peças.</BodyText>}
          </View>
          <Chevron />
        </Pressable>
        <View style={styles.cards}>
          <Pressable accessibilityRole="button" accessibilityLabel="Ver catálogo" onPress={() => router.push('/(jovem)/catalogo')} style={styles.catalogShadow}>
            <LinearGradient colors={[colors.purple, colors.purpleDark]} style={[styles.actionCard, { minHeight: compact ? 120 : 140 }]}>
              <HangerIcon size={39} color={colors.ivory} />
              <View style={styles.actionText}><View style={styles.actionCopy}><Heading size={22} style={styles.catalogTitle}>Ver catálogo</Heading><BodyText style={styles.catalogDescription}>Escolha suas peças</BodyText></View><Chevron light /></View>
              <Svg pointerEvents="none" width="100%" height={24} viewBox="0 0 170 24" preserveAspectRatio="none" style={styles.wave} accessible={false}>
                <Path d="M0 5 C60 34 116 -5 170 15 L170 24 L0 24Z" fill={colors.lavender} opacity=".22" />
                <Path d="M0 23 C60 30 121 -3 170 15" fill="none" stroke={colors.gold} strokeWidth=".8" />
              </Svg>
            </LinearGradient>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Meus pedidos" onPress={() => router.push('/(jovem)/meu-pedido')} style={[styles.actionCard, styles.ordersCard, { minHeight: compact ? 120 : 140 }]}>
            <IconView name="clipboard-outline" size={37} color={colors.purpleDark} />
            <View style={styles.actionText}><View style={styles.actionCopy}><BodyText style={styles.cardTitle}>Meus pedidos</BodyText><BodyText style={styles.ordersDescription}>Acompanhe suas solicitações</BodyText></View><Chevron /></View>
          </Pressable>
        </View>
        <View style={[styles.institutional, { minHeight: compact ? 110 : 150 }]}>
          <Image source={require('../../assets/images/malha-roxa.jpg')} resizeMode="cover" style={styles.fabric} accessible={false} />
          <Svg style={styles.heart} width={53} height={66} viewBox="0 0 53 66" accessible={false}>
            <Path d="M25 54 C-8 31 7 7 22 26 C28 -1 53 8 42 30 C35 43 16 48 11 62 M22 26 C16 42 31 34 22 26" stroke={colors.gold} strokeWidth="1.4" fill="none" />
          </Svg>
          <View style={styles.message}><Heading size={24} style={styles.messageText}>Moda que inclui, conecta e transforma.</Heading><View style={styles.goldLine} /></View>
        </View>
      </ScrollView>
      <BottomNav active="inicio" />
    </View>
    <Modal visible={notifications} transparent animationType="fade" onRequestClose={() => setNotifications(false)}>
      <View style={styles.overlay}><View accessibilityViewIsModal style={styles.dialog}><Heading size={30}>Notificações</Heading><BodyText style={{ marginVertical: spacing.lg }}>As notificações serão integradas ao módulo operacional em uma versão futura. Acompanhe seus pedidos pela aba Pedidos.</BodyText><Button title="Fechar" onPress={() => setNotifications(false)} /></View></View>
    </Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.deep },
  page: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: colors.ivory },
  header: { height: 86, justifyContent: 'flex-start' },
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingTop: 8, paddingRight: 26 },
  wordmark: { fontFamily: typography.headingRegular, fontSize: 29, color: colors.ivory },
  bell: { position: 'absolute', right: 23, top: 13, width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.lavender + '22', alignItems: 'center', justifyContent: 'center' },
  wave: { position: 'absolute', bottom: -1 },
  scroll: { flex: 1 },
  body: { flexGrow: 1, paddingTop: 4 },
  welcome: { marginLeft: spacing.xl, justifyContent: 'flex-start', paddingTop: spacing.sm },
  clothes: { position: 'absolute', right: 0, top: 0, width: '44%', height: '95%', borderTopLeftRadius: 90, borderBottomLeftRadius: 85 },
  greeting: { width: '63%', paddingRight: 4 },
  greetingTitle: { fontFamily: typography.headingRegular },
  welcomeText: { fontSize: 15, lineHeight: 20, marginTop: 4 },
  presentation: { fontSize: 12, lineHeight: 16, marginTop: 9, maxWidth: 195, paddingRight: 12 },
  order: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: spacing.xl, paddingHorizontal: 12, paddingVertical: 10, minHeight: 90, backgroundColor: colors.lilacLight, borderRadius: radius.lg },
  orderIcon: { width: 51, height: 53, borderRadius: radius.md, backgroundColor: colors.lilac, justifyContent: 'center', alignItems: 'center' },
  orderBody: { flex: 1, gap: 3 },
  cardTitle: { fontFamily: typography.semibold, color: colors.purpleDark, fontSize: 16, lineHeight: 21 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.warningBg, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start' },
  statusLabel: { fontSize: 12, lineHeight: 17, fontFamily: typography.semibold, color: colors.purpleDark },
  orderDescription: { fontSize: 11, lineHeight: 14 },
  chevron: { width: 25, height: 25, borderRadius: radius.pill, backgroundColor: colors.lilac, alignItems: 'center', justifyContent: 'center' },
  chevronLight: { backgroundColor: colors.lavender + '33' },
  cards: { flexDirection: 'row', gap: 13, marginHorizontal: spacing.lg, marginTop: spacing.md },
  catalogShadow: { flex: 1, borderRadius: radius.lg, shadowColor: colors.deep, shadowOpacity: .12, shadowRadius: 7, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  actionCard: { borderRadius: radius.lg, padding: spacing.lg, paddingBottom: spacing.xl, justifyContent: 'space-between', gap: 6, overflow: 'hidden' },
  ordersCard: { flex: 1, backgroundColor: colors.lilacLight },
  actionText: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  actionCopy: { flex: 1 },
  catalogTitle: { color: colors.ivory, fontFamily: typography.headingRegular },
  catalogDescription: { fontSize: 11, lineHeight: 15, color: colors.ivory, marginTop: 3 },
  ordersDescription: { fontSize: 12, lineHeight: 15, marginTop: 4 },
  institutional: { flexGrow: 1, marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  fabric: { position: 'absolute', left: -7, bottom: 0, width: '62%', height: '100%', borderTopRightRadius: 115 },
  heart: { position: 'absolute', left: '40%', top: 3 },
  message: { marginLeft: '62%', flex: 1, paddingRight: spacing.lg, paddingVertical: spacing.sm },
  messageText: { fontFamily: typography.headingRegular, lineHeight: 23 },
  goldLine: { width: 47, height: 2, backgroundColor: colors.gold, marginTop: 10 },
  overlay: { flex: 1, backgroundColor: colors.deep + '99', justifyContent: 'center', padding: spacing.xl },
  dialog: { width: '100%', maxWidth: 420, alignSelf: 'center', padding: spacing.xl, backgroundColor: colors.ivory, borderRadius: radius.lg },
});


