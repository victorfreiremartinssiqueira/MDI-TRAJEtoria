import React, { useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { colors, config, radius, spacing, typography } from '../src/constants/theme';
import { Heading, BodyText, IconView, Button } from '../src/components/Design';
import { useAuth } from '../src/context/AuthContext';
import { saveConsent } from '../src/database/repositories';

// Keep the existing explanatory content; this is not a final legal document.
const summaries = [
  { title: 'Quais dados são coletados?', txt: 'Dados de identificação, tamanho das peças, contato e endereço de entrega.', icon: 'server-outline' },
  { title: 'Para que usamos?', txt: 'Para organizar os pedidos de roupas, realizar as entregas e acompanhar os resultados.', icon: 'locate-outline' },
  { title: 'Com quem compartilhamos?', txt: 'Com a equipe autorizada e parceiros da operação, como a ONG vinculada.', icon: 'shield-checkmark-outline' },
  { title: 'Por quanto tempo?', txt: 'Durante o período necessário às finalidades do projeto, segundo a política aplicável.', icon: 'time-outline' },
] as const;

function ConsentHeader({ top }: { top: number }) {
  return <LinearGradient colors={[colors.deep, colors.purpleDark, colors.purple]} style={[styles.header, { paddingTop: top + spacing.sm }]}>
    <View style={styles.brand}>
      <Svg width={70} height={62} viewBox="0 0 70 62" accessible={false}>
        <G stroke={colors.lavender} strokeWidth=".5" opacity=".65" fill="none">
          {[0, 60, 120].map(angle => <Ellipse key={angle} cx="35" cy="31" rx="28" ry="12" rotation={angle} origin="35,31" />)}
          <Circle cx="35" cy="31" r="19" />
        </G>
        <Ellipse cx="35" cy="31" rx="31" ry="9" rotation={-35} origin="35,31" fill="none" stroke={colors.champagne} strokeWidth="1.4" />
        <Circle cx="35" cy="31" r="10" fill={colors.gold} opacity=".12" />
        <Circle cx="35" cy="31" r="6" fill={colors.champagne} />
        <Circle cx="35" cy="31" r="3" fill={colors.ivory} />
      </Svg>
      <Text style={styles.wordmark} maxFontSizeMultiplier={1.2}>TRAJEtória</Text>
    </View>
    <Svg width="100%" height={56} viewBox="0 0 390 56" preserveAspectRatio="none" style={styles.wave} accessible={false}>
      <Path d="M0 40 C120 -7 218 100 390 0 L390 56 L0 56Z" fill={colors.lavender} opacity=".5" />
      <Path d="M0 42 C107 -13 223 93 390 27 L390 56 L0 56Z" fill={colors.ivory} />
      <Path d="M0 42 C107 -13 223 93 390 27" stroke={colors.gold} strokeWidth="1.8" fill="none" />
    </Svg>
  </LinearGradient>;
}

function ConsentFooter() {
  return <Svg width="100%" height={80} viewBox="0 0 390 80" preserveAspectRatio="none" accessible={false}>
    <Path d="M0 14 C92 -4 167 65 266 57 C319 53 350 45 390 56 L390 80 L0 80Z" fill={colors.lavender} opacity=".65" />
    <Path d="M0 76 C135 89 266 4 390 18 L390 80 L0 80Z" fill={colors.lavender} opacity=".3" />
    <Path d="M-8 82 C150 83 278 -3 398 20" fill="none" stroke={colors.gold} strokeWidth="2" />
  </Svg>;
}

export default function Consent() {
  const { authenticated, consentGranted, logout, grantConsent } = useAuth();
  const router = useRouter();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [error, setError] = useState('');
  const saving = useRef(false);

  if (!authenticated) return <Redirect href="/" />;
  if (consentGranted) return <Redirect href="/(jovem)/inicio" />;

  const accept = async () => {
    if (!checked || saving.current) return;
    saving.current = true;
    setBusy(true);
    setError('');
    try {
      await saveConsent(db);
      grantConsent();
      router.replace('/(jovem)/inicio');
    } catch {
      setError('Não foi possível salvar o consentimento. Tente novamente.');
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };

  return <View style={styles.screen}>
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={[styles.page, { minHeight: height }]}>
        <ConsentHeader top={insets.top} />
        <View style={styles.content}>
          <Heading size={32} style={styles.title}>Termo de consentimento</Heading>
          <BodyText style={styles.intro}>Para continuar, precisamos do seu consentimento para o uso dos seus dados na plataforma TRAJEtória.</BodyText>
          <View style={styles.summaries}>
            {summaries.map((summary, index) => <View key={summary.title} style={[styles.summary, index === 3 && styles.retention]}>
              <View style={styles.iconTile}><IconView name={summary.icon} color={colors.purpleDark} size={27} /></View>
              <View style={styles.summaryText}>
                <BodyText style={styles.summaryTitle}>{summary.title}</BodyText>
                <BodyText style={styles.summaryBody}>{summary.txt}</BodyText>
              </View>
            </View>)}
          </View>
          <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={styles.readTerm}>
            <IconView name="document-text-outline" size={23} color={colors.purpleDark} />
            <BodyText style={styles.readLabel}>Ler termo completo</BodyText>
            <IconView name="open-outline" size={22} color={colors.purpleDark} />
          </Pressable>
          <Pressable accessibilityRole="checkbox" accessibilityLabel="Li e concordo com o Termo de Consentimento para o uso dos meus dados"
            accessibilityState={{ checked, disabled: busy }} disabled={busy} onPress={() => setChecked(value => !value)} style={styles.consent}>
            <View style={[styles.checkbox, checked && styles.checkboxSelected]}>
              {checked && <IconView name="checkmark" color={colors.white} size={20} />}
            </View>
            <BodyText style={styles.consentText}>Li e concordo com o Termo de Consentimento para o uso dos meus dados. <Text style={styles.required}>*</Text></BodyText>
          </Pressable>
          {!!error && <BodyText accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</BodyText>}
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => setDeclining(true)} style={[styles.reject, busy && styles.disabled]}>
              <Text style={styles.rejectLabel}>Não aceitar</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Aceitar" accessibilityHint="Marque a caixa de consentimento para continuar"
              accessibilityState={{ disabled: !checked || busy, busy }} disabled={!checked || busy} onPress={() => void accept()} style={styles.acceptShadow}>
              <LinearGradient colors={[colors.purple, colors.purpleDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.accept, (!checked || busy) && styles.unavailable]}>
                {busy ? <ActivityIndicator color={colors.white} /> : <><Text style={styles.acceptLabel}>Aceitar</Text><View style={styles.arrow}><IconView name="arrow-forward" color={colors.white} size={22} /></View></>}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
        <View pointerEvents="none" style={[styles.footer, { paddingBottom: insets.bottom }]}><ConsentFooter /></View>
      </View>
    </ScrollView>

    <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.termContent}>
          <Heading size={34}>Consentimento e privacidade</Heading>
          <BodyText style={styles.termParagraph}>Versão {config.consentVersion} - Material demonstrativo. O TRAJEtória registra os dados necessários para identificar o jovem, organizar a solicitação de roupas e viabilizar a entrega. Esses dados são utilizados pela equipe responsável e parceiros envolvidos na operação, respeitando a finalidade e a necessidade do serviço.</BodyText>
          <BodyText style={styles.termParagraph}>O registro de aceite inclui a identificação do jovem, a versão do documento e a data e hora. Regras legais definitivas, prazo de conservação e consentimento de responsáveis por menores deverão ser validados antes de qualquer uso real.</BodyText>
          <BodyText style={styles.pending}>Texto demonstrativo sujeito à validação jurídica. O conteúdo definitivo do termo ainda está pendente.</BodyText>
          <Button title="Fechar" onPress={() => setOpen(false)} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
    <Modal visible={declining} transparent animationType="fade" onRequestClose={() => setDeclining(false)}>
      <View style={styles.overlay}><View accessibilityViewIsModal style={styles.dialog}>
        <Heading size={29}>Consentimento necessário</Heading>
        <BodyText style={styles.termParagraph}>O consentimento é necessário para continuar no TRAJEtória. Você retornará à tela de acesso.</BodyText>
        <Button title="Voltar ao acesso" onPress={() => { setDeclining(false); logout(); router.replace('/'); }} />
      </View></View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  scroll: { flexGrow: 1 },
  page: { width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: colors.ivory },
  header: { alignItems: 'center', paddingBottom: 35, overflow: 'hidden' },
  brand: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  wordmark: { fontFamily: typography.headingRegular, fontSize: 29, color: colors.ivory },
  wave: { position: 'absolute', bottom: -1 },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xs },
  title: { fontFamily: typography.headingRegular, letterSpacing: -.7 },
  intro: { fontSize: 14, lineHeight: 19, marginTop: spacing.sm, marginBottom: spacing.md },
  summaries: { gap: spacing.sm },
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 55 },
  retention: { backgroundColor: colors.lilacLight, borderRadius: radius.md, paddingVertical: spacing.xs, paddingRight: spacing.xs, marginTop: 3 },
  iconTile: { width: 53, minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.lilacLight },
  summaryText: { flex: 1, paddingVertical: 3 },
  summaryTitle: { fontFamily: typography.semibold, color: colors.purpleDark, fontSize: 13, lineHeight: 17 },
  summaryBody: { fontSize: 12, lineHeight: 16 },
  readTerm: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderColor: colors.lavender, borderRadius: radius.pill, minHeight: 44, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginTop: spacing.lg },
  readLabel: { flex: 1, fontFamily: typography.semibold, color: colors.purpleDark, fontSize: 13 },
  consent: { flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 70, paddingVertical: spacing.lg, paddingHorizontal: 4 },
  checkbox: { width: 24, height: 24, borderRadius: 5, borderWidth: 1.5, borderColor: colors.purpleDark, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: colors.purpleDark },
  consentText: { flex: 1, fontSize: 13, lineHeight: 18 },
  required: { color: colors.danger },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  reject: { flex: 1, minHeight: 46, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.purpleDark, alignItems: 'center', justifyContent: 'center', padding: spacing.sm },
  rejectLabel: { fontFamily: typography.semibold, color: colors.purpleDark, fontSize: 15, textAlign: 'center' },
  acceptShadow: { flex: 1.05, borderRadius: radius.pill, shadowColor: colors.purpleDark, shadowOpacity: .18, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 3 },
  accept: { minHeight: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, paddingHorizontal: 30 },
  acceptLabel: { fontFamily: typography.medium, color: colors.white, fontSize: 16, textAlign: 'center' },
  arrow: { position: 'absolute', right: 13 },
  unavailable: { opacity: .65 },
  disabled: { opacity: .5 },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing.sm },
  footer: { flexGrow: 1, justifyContent: 'flex-end', minHeight: 95, marginTop: spacing.sm },
  termContent: { padding: spacing.xl, gap: spacing.lg, width: '100%', maxWidth: 600, alignSelf: 'center' },
  termParagraph: { marginVertical: spacing.md },
  pending: { color: colors.muted, fontSize: 13 },
  overlay: { flex: 1, backgroundColor: colors.deep + '99', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  dialog: { width: '100%', maxWidth: 420, padding: spacing.xl, borderRadius: radius.lg, backgroundColor: colors.ivory },
});
