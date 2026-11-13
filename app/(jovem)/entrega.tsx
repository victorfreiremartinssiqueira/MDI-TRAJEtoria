import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../../src/context/AuthContext';
import { getYoung, getSelection, confirmOrder } from '../../src/database/repositories';
import type { Address } from '../../src/types/models';
import { colors, spacing, typography, radius, config } from '../../src/constants/theme';
import { BottomNav, BrandMark, Heading, BodyText, FormInput, Button, IconView, StateView } from '../../src/components/Design';
import { datePT, nextDispatch } from '../../src/utils/format';

type Editor = 'address' | 'contact';
const emptyAddress: Address = { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '', contato: '' };
const addressFields = [
  { key: 'cep', label: 'CEP', keyboard: 'numbers-and-punctuation' },
  { key: 'logradouro', label: 'Rua / logradouro' },
  { key: 'numero', label: 'Número' },
  { key: 'complemento', label: 'Complemento (opcional)' },
  { key: 'bairro', label: 'Bairro' },
  { key: 'cidade', label: 'Cidade' },
  { key: 'uf', label: 'UF' },
] as const;
function missingAddress(address: Address) {
  return addressFields.filter(field => field.key !== 'complemento' && !address[field.key].trim()).map(field => field.label);
}

export default function Delivery() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { refreshProfile } = useAuth();
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [draft, setDraft] = useState<Address>(emptyAddress);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [editError, setEditError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [qty, setQty] = useState(0);
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState(false);
  const [dispatch, setDispatch] = useState(() => nextDispatch());
  const submitting = useRef(false);
  const sent = useRef(false);
  const review = () => router.replace('/(jovem)/meu-pedido');
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true); setLoadError(false); setError(''); setDispatch(nextDispatch());
    Promise.all([getYoung(db), getSelection(db)]).then(([young, items]) => {
      if (!active) return;
      setAddress({ cep: young.cep || '', logradouro: young.logradouro || '', numero: young.numero || '', complemento: young.complemento || '', bairro: young.bairro || '', cidade: young.cidade || '', uf: young.uf || '', contato: young.telefone || '' });
      setQty(items.length);
    }).catch(() => { if (active) setLoadError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [db, retry]));
  const openEditor = (target: Editor) => { setDraft({ ...address }); setEditError(''); setEditor(target); };
  const saveEditor = () => {
    const missing = editor === 'address' ? missingAddress(draft) : !draft.contato.trim() ? ['Contato'] : [];
    if (missing.length) { setEditError(`Preencha: ${missing.join(', ')}.`); return; }
    const normalized = Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, value.trim()])) as Address;
    normalized.uf = normalized.uf.toUpperCase();
    setAddress(normalized); setEditor(null); setError('');
  };
  const submit = async () => {
    if (submitting.current || sent.current) return;
    const missing = [...missingAddress(address), ...(!address.contato.trim() ? ['Contato'] : [])];
    if (missing.length) { setError(`Antes de enviar, corrija os campos obrigatórios: ${missing.join(', ')}.`); return; }
    submitting.current = true; setBusy(true); setError('');
    try {
      // confirmOrder rechecks quantity/availability and persists everything in one transaction.
      await confirmOrder(db, address);
      sent.current = true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível enviar. Sua seleção foi preservada. Tente novamente.');
      submitting.current = false; setBusy(false); return;
    }
    // Profile refresh must never turn a committed order into an apparent submission failure.
    try { await refreshProfile(); } catch { /* The saved order and delivery snapshot remain valid. */ }
    router.replace('/(jovem)/inicio');
  };
  const validQuantity = qty >= 1 && qty <= config.maxItemsPerOrder;
  return <SafeAreaView edges={['top']} style={styles.safe}><View style={styles.page}>
    <LinearGradient colors={[colors.deep, colors.purpleDark, colors.purple]} style={styles.header}>
      <View style={styles.brand}><BrandMark size={47} /><Text style={styles.wordmark}>TRAJEtória</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Notificações" onPress={() => setNotifications(true)} style={styles.bell}><IconView name="notifications-outline" size={21} color={colors.lavender} /></Pressable>
      <Svg width="100%" height={40} viewBox="0 0 390 40" preserveAspectRatio="none" style={styles.wave} accessible={false}><Path d="M0 34 C111 -33 204 72 390 5 L390 40 L0 40Z" fill={colors.lavender} opacity=".35" /><Path d="M0 35 C111 -29 204 73 390 12 L390 40 L0 40Z" fill={colors.ivory} /><Path d="M0 35 C111 -29 204 73 390 12" fill="none" stroke={colors.gold} strokeWidth="1.8" /></Svg>
    </LinearGradient>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.titleRow}><Pressable accessibilityRole="button" accessibilityLabel="Voltar ao meu pedido" disabled={busy} onPress={review} style={styles.backIcon}><IconView name="arrow-back" size={22} /></Pressable><Heading size={29} style={styles.title}>Endereço e janela de entrega</Heading></View>
      <BodyText style={styles.subtitle}>Confirme onde e como receber seu pacote.</BodyText>
      <View style={styles.steps} accessibilityLabel="Meu pedido: etapa concluída. Confirmar entrega: etapa atual, confirmação dos dados de recebimento.">
        <View style={styles.step}><View style={styles.completed}><IconView name="checkmark" color={colors.white} size={24} /></View><BodyText style={styles.stepLabel}>Meu pedido</BodyText></View>
        <View style={styles.stepLine} />
        <View style={styles.step}><View style={styles.current}><IconView name="location-outline" size={26} /></View><BodyText style={styles.currentLabel}>Confirmar entrega</BodyText></View>
      </View>
      {loading ? <StateView mode="loading" message="Carregando dados de entrega..." /> : loadError ? <StateView mode="error" message="Não foi possível carregar seus dados." onRetry={() => setRetry(value => value + 1)} /> : !validQuantity ? <View><StateView mode="empty" message={`Selecione de 1 a ${config.maxItemsPerOrder} peças antes de confirmar os dados de entrega.`} /><Button title="Revisar meu pedido" onPress={review} /></View> : <>
        <View style={styles.card}><View style={styles.cardIcon}><IconView name="location-outline" size={26} /></View><View style={styles.cardCopy}><BodyText style={styles.cardTitle}>Endereço de entrega</BodyText><BodyText style={styles.cardText}>{address.logradouro || 'Rua não informada'}{address.numero ? `, ${address.numero}` : ' · número não informado'}</BodyText>{!!address.complemento && <BodyText style={styles.cardText}>{address.complemento}</BodyText>}<BodyText style={styles.cardText}>{address.bairro || 'Bairro não informado'} · {address.cidade || 'Cidade não informada'}{address.uf ? `, ${address.uf}` : ''}</BodyText><BodyText style={styles.cardText}>CEP: {address.cep || 'não informado'}</BodyText></View><Pressable accessibilityRole="button" accessibilityLabel="Editar endereço de entrega" disabled={busy} onPress={() => openEditor('address')} style={styles.edit}><IconView name="pencil-outline" size={16} /><Text style={styles.editLabel}>Editar</Text></Pressable></View>
        <View style={styles.card}><View style={styles.cardIcon}><IconView name="call-outline" size={25} /></View><View style={styles.cardCopy}><BodyText style={styles.cardTitle}>Contato</BodyText><BodyText style={styles.cardText}>{address.contato || 'Contato não informado'}</BodyText></View><Pressable accessibilityRole="button" accessibilityLabel="Editar contato" disabled={busy} onPress={() => openEditor('contact')} style={styles.edit}><IconView name="pencil-outline" size={16} /><Text style={styles.editLabel}>Editar</Text></Pressable></View>
        <View style={styles.dispatch}><View style={styles.dispatchIcon}><IconView name="information-circle-outline" size={28} /></View><View style={styles.flex}><BodyText style={styles.cardTitle}>Próximo dia de despacho</BodyText><BodyText style={styles.cardText}>Quinta-feira, {datePT(dispatch)}.</BodyText></View></View>
        <View style={styles.weekly}><IconView name="calendar-outline" size={25} /><BodyText style={styles.weeklyText}>Os despachos acontecem às quintas-feiras. A previsão de chegada será informada pela equipe quando disponível.</BodyText></View>
        {!!error && <View style={styles.errorBox}><BodyText accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</BodyText><Pressable accessibilityRole="button" onPress={review} style={styles.reviewLink}><BodyText style={styles.reviewText}>Revisar seleção no Meu pedido</BodyText></Pressable></View>}
        <View style={styles.actions}><Pressable accessibilityRole="button" disabled={busy} onPress={review} style={styles.backButton}><IconView name="arrow-back" size={23} /><Text style={styles.backLabel}>Voltar</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Enviar pedido" accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={() => void submit()} style={styles.sendButton}><LinearGradient colors={[colors.purple, colors.purpleDark]} style={[styles.sendInner, busy && styles.disabled]}>{busy ? <ActivityIndicator color={colors.white} /> : <><IconView name="cube-outline" size={25} color={colors.white} /><Text style={styles.sendLabel}>Enviar pedido</Text></>}</LinearGradient></Pressable></View>
      </>}
    </ScrollView>
    <BottomNav active="pedidos" />
  </View>
  <Modal visible={editor !== null} animationType="slide" onRequestClose={() => { if (!busy) setEditor(null); }}><SafeAreaView style={styles.editorSafe} edges={['top', 'bottom']}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.editorContent}>
    <Heading size={32}>{editor === 'contact' ? 'Editar contato' : 'Editar endereço'}</Heading><BodyText style={styles.editorNote}>As correções serão salvas com a confirmação do pedido. Campos obrigatórios, exceto complemento.</BodyText>
    {editor === 'contact' ? <FormInput label="Contato" value={draft.contato} onChangeText={value => setDraft(current => ({ ...current, contato: value }))} keyboardType="phone-pad" /> : addressFields.map(field => <FormInput key={field.key} label={field.label} value={draft[field.key]} onChangeText={value => setDraft(current => ({ ...current, [field.key]: field.key === 'uf' ? value.toUpperCase() : value }))} keyboardType={'keyboard' in field ? field.keyboard : 'default'} />)}
    {!!editError && <BodyText accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{editError}</BodyText>}
    <Button title="Confirmar dados" onPress={saveEditor} style={{ marginVertical: spacing.md }} /><Button title="Cancelar" outline onPress={() => setEditor(null)} />
  </ScrollView></KeyboardAvoidingView></SafeAreaView></Modal>
  <Modal visible={notifications} transparent animationType="fade" onRequestClose={() => setNotifications(false)}><View style={styles.overlay}><View accessibilityViewIsModal style={styles.dialog}><Heading size={29}>Notificações</Heading><BodyText style={styles.editorNote}>As notificações serão integradas ao módulo operacional em uma versão futura. Acompanhe seus pedidos pelo histórico.</BodyText><Button title="Fechar" onPress={() => setNotifications(false)} /></View></View></Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.deep }, page: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: colors.ivory }, flex: { flex: 1 }, scroll: { flex: 1 }, header: { height: 86 }, brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingTop: 8, paddingRight: 26 }, wordmark: { fontFamily: typography.headingRegular, fontSize: 29, color: colors.ivory }, bell: { position: 'absolute', right: 23, top: 13, width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.lavender + '22', alignItems: 'center', justifyContent: 'center' }, wave: { position: 'absolute', bottom: -1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl, flexGrow: 1 }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 }, title: { flex: 1 }, backIcon: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.lilac, alignItems: 'center', justifyContent: 'center' }, subtitle: { fontSize: 14, lineHeight: 20, marginTop: spacing.xs, marginLeft: 25 },
  steps: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginVertical: spacing.xl }, step: { width: 100, alignItems: 'center' }, completed: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center', marginTop: 5 }, current: { width: 46, height: 46, borderRadius: radius.pill, backgroundColor: colors.lilac, alignItems: 'center', justifyContent: 'center' }, stepLabel: { fontSize: 12, marginTop: 9, textAlign: 'center' }, currentLabel: { fontSize: 12, lineHeight: 16, fontFamily: typography.semibold, color: colors.purpleDark, marginTop: 5, textAlign: 'center' }, stepLine: { height: 2, backgroundColor: colors.purple, flex: 1, maxWidth: 90, marginHorizontal: -15, marginTop: 22 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing.md, backgroundColor: colors.lilacLight, borderRadius: radius.lg, marginBottom: spacing.sm, minHeight: 77 }, cardIcon: { width: 43, height: 45, borderRadius: radius.md, backgroundColor: colors.lilac, justifyContent: 'center', alignItems: 'center' }, cardCopy: { flex: 1 }, cardTitle: { fontFamily: typography.semibold, fontSize: 17, lineHeight: 21, color: colors.purpleDark, marginBottom: 3 }, cardText: { fontSize: 13, lineHeight: 18 }, edit: { minHeight: 44, flexDirection: 'row', gap: 5, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.lilac }, editLabel: { fontFamily: typography.medium, color: colors.purpleDark, fontSize: 12 },
  dispatch: { flexDirection: 'row', gap: 13, alignItems: 'center', padding: spacing.md, backgroundColor: colors.warningBg, borderRadius: radius.lg, marginTop: 3 }, dispatchIcon: { paddingRight: 12, borderRightWidth: 1, borderRightColor: colors.gold }, weekly: { flexDirection: 'row', gap: 13, marginVertical: spacing.lg, paddingHorizontal: 8 }, weeklyText: { flex: 1, fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 12, marginTop: spacing.sm }, backButton: { flex: 1, minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.purple, paddingHorizontal: 12, paddingVertical: 8 }, backLabel: { fontFamily: typography.semibold, color: colors.purpleDark, fontSize: 15 }, sendButton: { flex: 1.35, borderRadius: radius.pill, shadowColor: colors.purpleDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: .16, shadowRadius: 7, elevation: 3 }, sendInner: { flex: 1, minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 }, sendLabel: { flexShrink: 1, textAlign: 'center', fontFamily: typography.medium, color: colors.white, fontSize: 15 }, disabled: { opacity: .5 },
  editorSafe: { flex: 1, backgroundColor: colors.ivory }, editorContent: { width: '100%', maxWidth: 520, alignSelf: 'center', padding: spacing.xl }, editorNote: { fontSize: 14, lineHeight: 20, marginVertical: spacing.lg }, errorBox: { padding: spacing.sm, backgroundColor: colors.lilacLight, borderRadius: radius.md }, error: { color: colors.danger, fontSize: 13 }, reviewLink: { paddingVertical: spacing.sm }, reviewText: { color: colors.purpleDark, textDecorationLine: 'underline', fontSize: 13 }, overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, backgroundColor: colors.deep + '99' }, dialog: { width: '100%', maxWidth: 420, backgroundColor: colors.ivory, padding: spacing.xl, borderRadius: radius.lg },
});
