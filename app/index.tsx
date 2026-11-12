import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, G, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Heading, BodyText, IconView } from '../src/components/Design';
import { colors, typography, config, spacing, radius } from '../src/constants/theme';
import { useAuth } from '../src/context/AuthContext';
import { hasConsent } from '../src/database/repositories';

// The approved mark is drawn as vectors so it stays sharp at every screen size.
function AccessMark() {
  return <Svg width={174} height={126} viewBox="0 0 174 126" accessible={false}>
    <Defs>
      <SvgGradient id="orbit" x1="0" y1="1" x2="1" y2="0">
        <Stop offset="0" stopColor={colors.lavender} stopOpacity=".35" />
        <Stop offset="1" stopColor={colors.champagne} />
      </SvgGradient>
      <SvgGradient id="trail" x1="0" y1="1" x2="1" y2="0">
        <Stop offset="0" stopColor={colors.purple} stopOpacity="0" />
        <Stop offset=".5" stopColor={colors.lavender} />
        <Stop offset="1" stopColor={colors.gold} />
      </SvgGradient>
    </Defs>
    <G fill="none" stroke="url(#orbit)" strokeWidth=".65">
      <Circle cx="82" cy="64" r="32" />
      <Circle cx="82" cy="36" r="32" /><Circle cx="106" cy="50" r="32" />
      <Circle cx="106" cy="78" r="32" /><Circle cx="82" cy="92" r="32" />
      <Circle cx="58" cy="78" r="32" /><Circle cx="58" cy="50" r="32" />
    </G>
    <Path d="M 0 88 C 40 128 65 104 83 66 C 103 29 130 22 153 16 C 124 30 106 43 86 71 C 62 111 34 115 0 88" fill="url(#trail)" />
    <Circle cx="153" cy="16" r="14" fill={colors.gold} opacity=".08" />
    <Circle cx="153" cy="16" r="10" fill={colors.gold} opacity=".2" />
    <Circle cx="153" cy="16" r="6.5" fill={colors.champagne} />
    <Path d="M82 44L84 60L98 54L87 64L101 69L86 68L89 83L82 70L75 83L78 68L63 70L77 64L66 54L80 60Z" fill={colors.champagne} />
    <Circle cx="82" cy="64" r="3" fill={colors.white} />
    <Circle cx="55" cy="64" r="2" fill={colors.champagne} />
    <Circle cx="97" cy="91" r="2" fill={colors.gold} />
  </Svg>;
}

function AccessFooter() {
  return <View pointerEvents="none" style={styles.footer}>
    <Svg width="100%" height="100%" viewBox="0 0 390 100" preserveAspectRatio="none" accessible={false}>
      <Defs><SvgGradient id="footerWash" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={colors.lavender} stopOpacity=".65" />
        <Stop offset="1" stopColor={colors.purple} stopOpacity=".45" />
      </SvgGradient></Defs>
      <Path d="M0 18 C75 -4 140 66 239 65 C308 63 342 57 390 83 L390 100 L0 100Z" fill="url(#footerWash)" />
      <Path d="M0 91 C107 110 245 27 390 30 L390 100 L0 100Z" fill={colors.lavender} opacity=".3" />
      <Path d="M-12 105 C150 105 286 6 402 28" fill="none" stroke={colors.gold} strokeWidth="2" />
    </Svg>
  </View>;
}

export default function Login() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [username, setUsername] = useState<string>(config.demoUser);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  const passwordRef = React.useRef<TextInput>(null);

  const submit = async () => {
    if (busy) return;
    try {
      setBusy(true);
      setError('');
      const ok = await login(username, password);
      if (!ok) {
        setError('Identificação ou senha inválida. Confira e tente novamente.');
        return;
      }
      router.replace(await hasConsent(db) ? '/(jovem)/inicio' : '/consentimento');
    } catch {
      setError('Não foi possível acessar. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  return <View style={styles.screen}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.page, { minHeight: height }]}>
          <LinearGradient colors={[colors.deep, colors.purpleDark, colors.purple]} start={{ x: .3, y: 0 }} end={{ x: .9, y: 1 }}
            style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}>
            <AccessMark />
            <Text accessibilityLabel="TRAJEtória" style={styles.wordmark} maxFontSizeMultiplier={1.2}>TRAJEtória</Text>
            <Text style={styles.tagline} maxFontSizeMultiplier={1.2}>MODA · INCLUSÃO · OPORTUNIDADE</Text>
            <Svg width="100%" height={65} viewBox="0 0 390 65" preserveAspectRatio="none" style={styles.heroWave} accessible={false}>
              <Path d="M0 46 C103 -5 218 111 390 3 L390 65 L0 65Z" fill={colors.lavender} opacity=".45" />
              <Path d="M0 49 C103 -6 225 103 390 37 L390 65 L0 65Z" fill={colors.ivory} />
              <Path d="M0 49 C103 -6 225 103 390 37" fill="none" stroke={colors.gold} strokeWidth="1.8" />
            </Svg>
          </LinearGradient>

          <View style={styles.content}>
            <View style={styles.intro}>
              <Heading size={36} style={styles.title}>Bem-vindo(a)!</Heading>
              <BodyText style={styles.description}>Acesse sua conta para escolher roupas, acompanhar seu pedido e muito mais.</BodyText>
            </View>
            <View style={styles.fields}>
              <View style={styles.field}>
                <IconView name="person-outline" size={24} />
                <TextInput accessibilityLabel="Identificação do usuário" placeholder="Identificação do usuário"
                  placeholderTextColor={colors.muted} value={username} onChangeText={setUsername}
                  autoCapitalize="none" autoCorrect={false} autoComplete="username" textContentType="username"
                  returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()} style={styles.input} />
              </View>
              <View style={styles.field}>
                <IconView name="lock-closed-outline" size={23} />
                <TextInput ref={passwordRef} accessibilityLabel="Senha" placeholder="Senha" placeholderTextColor={colors.muted}
                  value={password} onChangeText={setPassword} secureTextEntry={!visible} autoCapitalize="none"
                  autoCorrect={false} autoComplete="current-password" textContentType="password" returnKeyType="go"
                  onSubmitEditing={() => void submit()} style={styles.input} />
                <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
                  onPress={() => setVisible(value => !value)} style={styles.visibility} hitSlop={4}>
                  <IconView name={visible ? 'eye-off-outline' : 'eye-outline'} color={colors.text} size={23} />
                </Pressable>
              </View>
            </View>
            {!!error && <BodyText accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</BodyText>}
            <Pressable accessibilityRole="button" accessibilityLabel="Entrar" accessibilityState={{ disabled: busy, busy }}
              disabled={busy} onPress={() => void submit()} style={({ pressed }) => [styles.submit, { opacity: pressed || busy ? .8 : 1 }]}>
              <LinearGradient colors={[colors.purple, colors.purpleDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitInner}>
                {busy ? <ActivityIndicator color={colors.white} /> : <>
                  <Text style={styles.submitLabel}>Entrar</Text>
                  <View style={styles.submitArrow}><IconView name="arrow-forward" color={colors.white} size={23} /></View>
                </>}
              </LinearGradient>
            </Pressable>
            <Pressable onPress={() => Alert.alert('Preciso de ajuda', 'Este é um ambiente de demonstração. Utilize as credenciais fictícias fornecidas no README. Na operação real, o suporte será prestado pela equipe responsável.')}
              style={styles.help} accessibilityRole="button">
              <IconView name="help-circle-outline" size={23} color={colors.purpleDark} />
              <BodyText style={styles.helpLabel}>Preciso de ajuda</BodyText>
            </Pressable>
          </View>
          <View style={[styles.bottom, { paddingBottom: insets.bottom }]}><AccessFooter /></View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.ivory },
  scroll: { flexGrow: 1 },
  page: { width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: colors.ivory },
  hero: { alignItems: 'center', paddingBottom: 59, overflow: 'hidden' },
  wordmark: { fontFamily: typography.headingRegular, fontSize: 50, lineHeight: 56, color: colors.ivory, marginTop: 0 },
  tagline: { fontFamily: typography.regular, color: colors.lavender, opacity: .8, fontSize: 9, letterSpacing: 2.2, marginTop: 1 },
  heroWave: { position: 'absolute', bottom: -1 },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  intro: { paddingHorizontal: spacing.xs, marginBottom: spacing.xl },
  title: { fontFamily: typography.headingRegular, color: colors.purpleDark },
  description: { marginTop: spacing.xs, fontSize: 16, lineHeight: 22, color: colors.text },
  fields: { gap: 12 },
  field: { flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingLeft: spacing.lg, paddingRight: 4, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg },
  input: { flex: 1, minWidth: 0, minHeight: 50, paddingVertical: 12, paddingHorizontal: spacing.md, fontFamily: typography.regular, fontSize: 15, color: colors.text },
  visibility: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  error: { color: colors.danger, marginTop: spacing.sm, fontSize: 14 },
  submit: { marginTop: spacing.xl, borderRadius: radius.lg, shadowColor: colors.purpleDark, shadowOpacity: .22, shadowOffset: { width: 0, height: 5 }, shadowRadius: 8, elevation: 5 },
  submitInner: { minHeight: 55, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, paddingHorizontal: 52 },
  submitLabel: { fontFamily: typography.medium, fontSize: 18, color: colors.white, textAlign: 'center' },
  submitArrow: { position: 'absolute', right: spacing.lg },
  help: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, minHeight: 44, marginTop: spacing.sm },
  helpLabel: { color: colors.purpleDark, fontFamily: typography.medium, textDecorationLine: 'underline', fontSize: 15 },
  bottom: { flexGrow: 1, minHeight: 105, justifyContent: 'flex-end', marginTop: spacing.sm },
  footer: { height: 100, width: '100%' },
});
