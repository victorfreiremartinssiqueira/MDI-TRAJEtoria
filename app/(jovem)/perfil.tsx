import React, { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuthDatabase } from '../../src/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { colors, typography, radius, spacing, config } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { BottomNav, BrandMark, Heading, BodyText, IconView, Button, StateView } from '../../src/components/Design';
import { getYoung, getLatestConsent } from '../../src/database/repositories';
import type { Young } from '../../src/types/models';
import { datePT } from '../../src/utils/format';
import { validDeliveryDate } from '../../src/utils/orderTracking';

type Panel = 'address' | 'privacy' | 'support' | 'logout' | 'notifications';
export default function Profile() {
  const { logout } = useAuth();
  const router = useRouter();
  const db = useAuthDatabase();
  const [young, setYoung] = useState<Young | null>(null);
  const [consent, setConsent] = useState<Awaited<ReturnType<typeof getLatestConsent>>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [panel, setPanel] = useState<Panel | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true); setError(false);
    Promise.all([getYoung(db), getLatestConsent(db)]).then(([profile, accepted]) => { if (active) { setYoung(profile); setConsent(accepted); } })
      .catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [db, retry]));
  const rows = [
    { label: 'Nome', value: young?.nome, icon: 'person-outline' },
    { label: 'Tamanho cadastrado', value: young?.tamanho_referencia, icon: 'shirt-outline' },
    { label: 'ONG vinculada', value: young?.ong_nome, icon: 'people-outline' },
  ] as const;
  const menu = [
    { label: 'Endereço e contato', icon: 'location-outline', key: 'address' },
    { label: 'Privacidade e consentimento', icon: 'shield-checkmark-outline', key: 'privacy' },
    { label: 'Ajuda e suporte', icon: 'help-circle-outline', key: 'support' },
  ] as const;
  return <SafeAreaView edges={['top']} style={styles.safe}><View style={styles.page}>
    <LinearGradient colors={[colors.deep, colors.purpleDark]} style={styles.header}>
      <View style={styles.brand}><BrandMark size={37} /><Text style={styles.wordmark}>TRAJEtória</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Notificações" onPress={() => setPanel('notifications')} style={styles.bell}><IconView name="notifications-outline" color={colors.ivory} size={23} /></Pressable>
      <View style={styles.hero}><View style={styles.flex}><Text style={styles.profileTitle}>Perfil</Text><BodyText style={styles.subtitle}>Seus dados e informações da conta.</BodyText></View><LinearGradient colors={[colors.lavender, colors.purple]} style={styles.avatar}><IconView name="person-outline" size={54} color={colors.ivory} /></LinearGradient></View>
      <Svg width="100%" height={75} viewBox="0 0 390 75" preserveAspectRatio="none" style={styles.wave} accessible={false}><Path d="M0 70 C50 0 215 87 390 0 L390 75 L0 75Z" fill={colors.lilac} /><Path d="M0 75 C32 31 100 50 200 50 C300 50 348 36 390 36 L390 75Z" fill={colors.lilacLight} /></Svg>
    </LinearGradient>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {loading ? <StateView mode="loading" message="Carregando seu perfil..." /> : error ? <StateView mode="error" message="Não foi possível carregar seu perfil." onRetry={() => setRetry(value => value + 1)} /> : <>
        <View style={styles.card}><Text style={styles.sectionLabel}>DADOS DO CADASTRO</Text>{rows.map((row, index) => <View key={row.label} style={[styles.dataRow, index < rows.length - 1 && styles.line]}><View style={styles.dataIcon}><IconView name={row.icon} color={colors.text} size={24} /></View><View style={styles.flex}><BodyText style={styles.dataLabel}>{row.label}</BodyText><BodyText style={styles.dataValue}>{row.value?.trim() || 'Não informado'}</BodyText></View></View>)}</View>
        <Text style={styles.accountLabel}>MINHA CONTA</Text>
        <View style={styles.menuCard}>{menu.map((item, index) => <Pressable key={item.key} accessibilityRole="button" onPress={() => setPanel(item.key)} style={[styles.menuRow, index < menu.length - 1 && styles.line]}><IconView name={item.icon} color={colors.text} size={23} /><BodyText style={styles.menuLabel}>{item.label}</BodyText><IconView name="chevron-forward" color={colors.text} size={18} /></Pressable>)}</View>
      </>}
      <Pressable accessibilityRole="button" onPress={() => setPanel('logout')} style={styles.logout}><IconView name="log-out-outline" size={24} /><BodyText style={styles.logoutLabel}>Sair da conta</BodyText></Pressable>
    </ScrollView>
    <BottomNav active="perfil" />
  </View>
  <Modal visible={panel !== null} transparent animationType="fade" onRequestClose={() => setPanel(null)}><View style={styles.overlay}><View accessibilityViewIsModal style={styles.dialog}><ScrollView contentContainerStyle={styles.dialogContent}>
    <Heading size={30}>{panel === 'address' ? 'Endereço e contato' : panel === 'privacy' ? 'Privacidade e consentimento' : panel === 'support' ? 'Ajuda e suporte' : panel === 'logout' ? 'Sair da conta?' : 'Notificações'}</Heading>
    {panel === 'address' ? <View style={styles.details}>{[
      ['Logradouro', young?.logradouro], ['Número', young?.numero], ['Complemento', young?.complemento], ['Bairro', young?.bairro], ['Cidade', young?.cidade], ['UF', young?.uf], ['CEP', young?.cep], ['Contato', young?.telefone],
    ].map(([label, value]) => <View key={label} style={styles.detailRow}><BodyText style={styles.dataLabel}>{label}</BodyText><BodyText>{value?.trim() || 'Não informado'}</BodyText></View>)}<BodyText style={styles.note}>Informações somente para consulta. O endereço para entrega pode ser corrigido ao confirmar um pedido.</BodyText></View> : panel === 'privacy' ? <View style={styles.details}>
      {consent ? <><BodyText>Versão aceita: {consent.versao_termo}</BodyText><BodyText>Data do consentimento: {validDeliveryDate(consent.aceito_em) ? datePT(consent.aceito_em) : 'Não informada'}</BodyText></> : <BodyText>Nenhum consentimento registrado foi encontrado.</BodyText>}
      <BodyText style={styles.termTitle}>Termo de consentimento · versão {config.consentVersion}</BodyText>
      <BodyText>Versão {config.consentVersion} - Material demonstrativo. O TRAJEtória registra os dados necessários para identificar o jovem, organizar a solicitação de roupas e viabilizar a entrega. Esses dados são utilizados pela equipe responsável e parceiros envolvidos na operação, respeitando a finalidade e a necessidade do serviço.</BodyText>
      <BodyText>O registro de aceite inclui a identificação do jovem, a versão do documento e a data e hora. Regras legais definitivas, prazo de conservação e consentimento de responsáveis por menores deverão ser validados antes de qualquer uso real.</BodyText>
      {consent && consent.versao_termo !== config.consentVersion && <BodyText style={styles.note}>O texto histórico da versão aceita não está disponível neste aplicativo. O conteúdo acima corresponde à versão atual apresentada no consentimento.</BodyText>}
      <BodyText style={styles.note}>Texto demonstrativo sujeito à validação jurídica. O conteúdo definitivo do termo ainda está pendente.</BodyText>
    </View> : <BodyText style={styles.paragraph}>{panel === 'support' ? 'O canal oficial de suporte ainda não está configurado nesta demonstração. Procure a equipe responsável por meio da ONG vinculada ao seu cadastro para receber orientação.' : panel === 'logout' ? 'Deseja encerrar sua sessão? Seus pedidos, feedbacks e consentimentos serão preservados.' : 'As notificações serão integradas ao módulo operacional em uma versão futura. Consulte seus pedidos pelo histórico.'}</BodyText>}
    {panel === 'logout' && <Button title="Sair da conta" icon="log-out-outline" onPress={() => { setPanel(null); logout(); router.replace('/'); }} style={{ marginBottom: spacing.sm }} />}
    <Button title={panel === 'logout' ? 'Cancelar' : 'Fechar'} outline onPress={() => setPanel(null)} />
  </ScrollView></View></View></Modal>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.deep }, page: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: colors.lilacLight }, flex: { flex: 1 }, scroll: { flex: 1 }, header: { height: 190 }, brand: { flexDirection: 'row', gap: 7, alignItems: 'center', paddingLeft: spacing.xl, paddingTop: spacing.sm }, wordmark: { fontFamily: typography.regular, fontSize: 19, color: colors.ivory }, bell: { position: 'absolute', right: 24, top: 15, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }, hero: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.xl, paddingTop: 18, zIndex: 1 }, profileTitle: { fontFamily: typography.bold, fontSize: 34, color: colors.white }, subtitle: { fontSize: 12, lineHeight: 17, color: colors.ivory, marginTop: 1 }, avatar: { width: 80, height: 80, borderRadius: 25, alignItems: 'center', justifyContent: 'center', shadowColor: colors.deep, shadowOpacity: .18, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3 }, wave: { position: 'absolute', bottom: -1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, flexGrow: 1 }, card: { backgroundColor: colors.ivory, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingTop: 12, paddingBottom: 4, borderWidth: 1, borderColor: colors.lilacLight, shadowColor: colors.deep, shadowOpacity: .04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 }, sectionLabel: { fontFamily: typography.semibold, fontSize: 10, letterSpacing: 2, color: colors.text, marginBottom: 4 }, dataRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 10, minHeight: 58 }, dataIcon: { width: 42, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lilacLight }, dataLabel: { color: colors.muted, fontSize: 11, lineHeight: 15 }, dataValue: { fontFamily: typography.medium, fontSize: 15, lineHeight: 20 }, line: { borderBottomWidth: 1, borderBottomColor: colors.line }, accountLabel: { fontFamily: typography.semibold, fontSize: 10, letterSpacing: 2, color: colors.text, marginVertical: spacing.lg, marginLeft: 12 }, menuCard: { backgroundColor: colors.ivory, borderRadius: radius.lg, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.lilacLight, shadowColor: colors.deep, shadowOpacity: .03, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 }, menuRow: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 51, paddingVertical: 10 }, menuLabel: { flex: 1, fontSize: 13, fontFamily: typography.medium }, logout: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: spacing.md, marginTop: spacing.md }, logoutLabel: { fontFamily: typography.medium, color: colors.purpleDark, fontSize: 14 },
  overlay: { flex: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.deep + '99' }, dialog: { width: '100%', maxWidth: 480, maxHeight: '85%', backgroundColor: colors.ivory, borderRadius: radius.lg, overflow: 'hidden' }, dialogContent: { padding: spacing.xl }, details: { gap: 12, marginVertical: spacing.lg }, detailRow: { borderBottomWidth: 1, borderBottomColor: colors.line, paddingBottom: 7 }, note: { fontSize: 12, lineHeight: 17, color: colors.muted }, termTitle: { fontFamily: typography.semibold, marginTop: spacing.sm }, paragraph: { marginVertical: spacing.lg },
});

