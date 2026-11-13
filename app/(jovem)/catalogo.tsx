import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthDatabase } from '../../src/context/AuthContext';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { BottomNav, BrandMark, Button, Heading, BodyText, IconView, HangerIcon, StateView } from '../../src/components/Design';
import { colors, radius, spacing, typography } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { fetchCatalog } from '../../src/services/catalogService';
import { addPieceToSelection } from '../../src/database/repositories';
import type { Piece } from '../../src/types/models';
import { pieceImage } from '../../src/constants/pictures';

type Filter = 'category' | 'gender' | 'size';
type Notice = { title: string; message: string; success?: boolean };

export default function Catalog() {
  const db = useAuthDatabase();
  const router = useRouter();
  const { young } = useAuth();
  const { width } = useWindowDimensions();
  const referenceSize = young?.tamanho_referencia || 'M';
  const [size, setSize] = useState(referenceSize);
  const [category, setCategory] = useState('Todas');
  const [gender, setGender] = useState('Todos');
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [adding, setAdding] = useState<number | null>(null);
  const addingRef = useRef(false);
  const request = useRef(0);
  useEffect(() => { setSize(referenceSize); }, [referenceSize]);
  const reload = useCallback(async (testFail = false) => {
    const id = ++request.current;
    setLoading(true);
    setError('');
    try {
      const result = await fetchCatalog(db, testFail);
      if (request.current === id) setPieces(result.filter(piece => piece.status === 'disponivel'));
    } catch (cause) {
      if (request.current === id) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o catálogo.');
    } finally {
      if (request.current === id) setLoading(false);
    }
  }, [db]);
  useFocusEffect(useCallback(() => {
    void reload();
    return () => { request.current++; };
  }, [reload]));

  let registeredSizes: string[] = [];
  try {
    const parsed: unknown = JSON.parse(young?.tamanhos_json || '[]');
    if (Array.isArray(parsed)) registeredSizes = parsed.filter((value): value is string => typeof value === 'string' && !!value.trim());
  } catch { /* The reference size is sufficient when the optional size list is invalid. */ }
  const sizes = Array.from(new Set([referenceSize, ...registeredSizes, ...pieces.map(piece => piece.tamanho)]));
  const categories = ['Todas', ...Array.from(new Set(pieces.map(piece => piece.categoria)))];
  const genders = ['Todos', ...Array.from(new Set(pieces.map(piece => piece.genero)))];
  const options = filter === 'category' ? categories : filter === 'gender' ? genders : sizes;
  const selected = filter === 'category' ? category : filter === 'gender' ? gender : size;
  const clear = () => { setSize(referenceSize); setCategory('Todas'); setGender('Todos'); };
  const filtered = pieces.filter(piece => piece.tamanho === size && (category === 'Todas' || piece.categoria === category) && (gender === 'Todos' || piece.genero === gender));
  const details = (piece: Piece) => router.push({ pathname: '/(jovem)/detalhe/[id]', params: { id: String(piece.id) } });
  const add = async (piece: Piece) => {
    if (addingRef.current) return;
    addingRef.current = true;
    setAdding(piece.id);
    try {
      await addPieceToSelection(db, piece.id);
      setNotice({ title: 'Peça adicionada', message: `${piece.nome} foi adicionada ao seu pedido. A reserva acontece apenas ao confirmar o pedido.`, success: true });
    } catch (cause) {
      setNotice({ title: 'Atenção', message: cause instanceof Error ? cause.message : 'Não foi possível adicionar a peça. Tente novamente.' });
    } finally { addingRef.current = false; setAdding(null); }
  };

  return <SafeAreaView edges={['top']} style={styles.safe}>
    <View style={styles.page}>
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
        <View style={styles.intro}>
          <View style={styles.introCopy}><Heading size={36} style={styles.title}>Catálogo</Heading><BodyText style={styles.subtitle}>Escolha peças do seu tamanho.</BodyText></View>
          <Svg width={96} height={76} viewBox="0 0 96 76" accessible={false}>
            <Ellipse cx="48" cy="47" rx="47" ry="25" fill={colors.lilac} />
            <Path d="M47 20 C40 16 46 9 51 13 C58 18 46 22 47 26 M47 26 L36 30 L23 41 L31 49 L37 44 L34 65 L65 68 L63 44 L70 49 L78 40 L63 29 L54 27 C53 34 47 35 43 29" fill={colors.lilacLight} stroke={colors.purpleDark} strokeWidth="1.8" strokeLinejoin="round" />
            <Path d="M75 18 L78 10 M81 24 L90 21 M68 14 L68 7" stroke={colors.gold} strokeWidth="1.4" />
          </Svg>
        </View>
        <View style={styles.curated}><IconView name="ribbon-outline" color={colors.gold} size={32} /><View style={styles.flex}><BodyText style={styles.curatedTitle}>Catálogo curado</BodyText><BodyText style={styles.curatedText}>Peças selecionadas, em bom estado e sem custo.</BodyText></View></View>
        <View style={styles.filters}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Categoria: ${category}`} onPress={() => setFilter('category')} style={styles.filter}><HangerIcon size={20} /><Text style={styles.filterText}>{category === 'Todas' ? 'Categoria' : category}</Text><IconView name="chevron-down" size={12} /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`Gênero: ${gender}`} onPress={() => setFilter('gender')} style={styles.filter}><IconView name="people-outline" size={17} /><Text style={styles.filterText}>{gender === 'Todos' ? 'Gênero' : gender}</Text><IconView name="chevron-down" size={12} /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`Tamanho: ${size}`} onPress={() => setFilter('size')} style={styles.filter}><IconView name="resize-outline" size={17} /><Text style={styles.filterText}>Tamanho: {size}</Text><IconView name="chevron-down" size={12} /></Pressable>
        </View>
        <View style={styles.activeFilters}><IconView name="filter-outline" size={16} /><BodyText style={styles.activeText}>Catálogo filtrado para {size === referenceSize ? 'o seu tamanho' : 'tamanho'}: {size}{category !== 'Todas' ? ` · ${category}` : ''}{gender !== 'Todos' ? ` · ${gender}` : ''}</BodyText><Pressable accessibilityRole="button" onPress={clear} hitSlop={8}><BodyText style={styles.clear}>Limpar filtros</BodyText></Pressable></View>
        {loading ? <StateView mode="loading" message="Carregando peças disponíveis..." /> : error ? <StateView mode="error" message={error} onRetry={() => void reload()} /> : filtered.length === 0 ? <StateView mode="empty" message="Nenhuma peça encontrada com estes filtros. Escolha outra combinação." onRetry={clear} /> :
          <View style={styles.grid}>{filtered.map(piece => <View key={piece.id} style={[styles.product, width < 330 && styles.singleColumn]}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Ver detalhes de ${piece.nome}`} onPress={() => details(piece)} style={styles.photoFrame}>
              <Image source={pieceImage(piece.id)} style={styles.photo} resizeMode="cover" accessibilityLabel={`Fotografia ilustrativa: ${piece.nome}`} />
              <View style={styles.available}><IconView name="checkmark" size={12} color={colors.success} /><Text style={styles.availableText}>Disponível</Text></View>
            </Pressable>
            <View style={styles.productBody}>
              <Heading size={20} style={styles.productName}>{piece.nome}</Heading>
              <View style={styles.metadata}><IconView name="person-outline" size={13} /><BodyText style={styles.metaText}>Gênero: {piece.genero}</BodyText></View>
              <View style={styles.metadata}><IconView name="resize-outline" size={13} /><BodyText style={styles.metaText}>Tamanho: {piece.tamanho}</BodyText></View>
              <View style={styles.metadata}><IconView name="sparkles-outline" size={13} /><BodyText style={styles.metaText}>Estado: {piece.conservacao}</BodyText></View>
              <View style={styles.productActions}>
                <Pressable accessibilityRole="button" accessibilityLabel={`Ver detalhes de ${piece.nome}`} onPress={() => details(piece)} style={styles.details}><Text style={styles.detailsLabel}>Ver detalhes</Text></Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={`Adicionar ${piece.nome} ao pedido`} accessibilityState={{ disabled: adding !== null, busy: adding === piece.id }} disabled={adding !== null} onPress={() => void add(piece)} style={styles.addButton}>
                  <LinearGradient colors={[colors.purple, colors.purpleDark]} style={[styles.addGradient, adding !== null && styles.disabled]}>
                    {adding === piece.id ? <ActivityIndicator color={colors.white} size="small" /> : <><IconView name="add" size={19} color={colors.champagne} /><Text style={styles.addLabel}>Adicionar ao pedido</Text></>}
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>)}</View>}
        {__DEV__ && <Pressable accessibilityRole="button" accessibilityLabel="Simular erro de carregamento" onPress={() => void reload(true)} style={styles.demo}><BodyText style={styles.demoText}>Modo demonstração: simular falha de carregamento</BodyText></Pressable>}
      </ScrollView>
      <BottomNav active="catalogo" />
    </View>
    <Modal visible={filter !== null} transparent animationType="fade" onRequestClose={() => setFilter(null)}>
      <View style={styles.overlay}><View accessibilityViewIsModal style={styles.dialog}>
        <Heading size={30}>{filter === 'category' ? 'Categoria' : filter === 'gender' ? 'Gênero' : 'Tamanho'}</Heading>
        <ScrollView style={styles.options}>{options.map(option => <Pressable key={option} accessibilityRole="radio" accessibilityState={{ checked: selected === option }} onPress={() => { if (filter === 'category') setCategory(option); else if (filter === 'gender') setGender(option); else setSize(option); setFilter(null); }} style={styles.option}><BodyText style={selected === option ? styles.selectedOption : undefined}>{option}</BodyText><IconView name={selected === option ? 'radio-button-on' : 'radio-button-off'} size={21} /></Pressable>)}</ScrollView>
        <Button title="Fechar" outline onPress={() => setFilter(null)} />
      </View></View>
    </Modal>
    <Modal visible={notice !== null} transparent animationType="fade" onRequestClose={() => setNotice(null)}>
      <View style={styles.overlay}><View accessibilityViewIsModal style={styles.dialog}><Heading size={30}>{notice?.title}</Heading><BodyText style={styles.notice}>{notice?.message}</BodyText>
        {notice?.success && <Button title="Ver meu pedido" onPress={() => { setNotice(null); router.push('/(jovem)/meu-pedido'); }} style={{ marginBottom: spacing.sm }} />}
        <Button title={notice?.success ? 'Continuar escolhendo' : 'Fechar'} outline onPress={() => setNotice(null)} />
      </View></View>
    </Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.deep },
  page: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: colors.ivory },
  flex: { flex: 1 }, scroll: { flex: 1 },
  header: { height: 86 },
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingTop: 8, paddingRight: 26 },
  wordmark: { fontFamily: typography.headingRegular, fontSize: 29, color: colors.ivory },
  bell: { position: 'absolute', right: 23, top: 13, width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.lavender + '22', alignItems: 'center', justifyContent: 'center' },
  wave: { position: 'absolute', bottom: -1 },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  intro: { flexDirection: 'row', alignItems: 'center', paddingLeft: spacing.sm, marginBottom: 5 },
  introCopy: { flex: 1 }, title: { fontFamily: typography.headingRegular },
  subtitle: { fontSize: 14, lineHeight: 19, marginTop: 3 },
  curated: { backgroundColor: colors.lilac, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  curatedTitle: { fontFamily: typography.semibold, fontSize: 15, lineHeight: 19, color: colors.purpleDark },
  curatedText: { fontSize: 12, lineHeight: 16 },
  filters: { flexDirection: 'row', gap: 6, marginVertical: spacing.sm },
  filter: { flex: 1, minWidth: 0, minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 5, paddingVertical: 5 },
  filterText: { flexShrink: 1, fontFamily: typography.regular, fontSize: 11, color: colors.purpleDark },
  activeFilters: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.lilac, borderRadius: radius.sm, paddingHorizontal: 9, paddingVertical: 5, marginBottom: spacing.md },
  activeText: { flex: 1, fontFamily: typography.medium, fontSize: 10, lineHeight: 14, color: colors.purpleDark },
  clear: { fontSize: 10, color: colors.purpleDark, textDecorationLine: 'underline' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'stretch', rowGap: 10 },
  product: { width: '48.6%', backgroundColor: colors.ivory, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, overflow: 'hidden' },
  singleColumn: { width: '100%' },
  // Size the frame independently of the source image (including React Native Web).
  photoFrame: { width: '100%', aspectRatio: 1.85, flexShrink: 0, overflow: 'hidden', borderRadius: radius.md, backgroundColor: colors.lilacLight },
  photo: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  available: { position: 'absolute', top: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: colors.successBg, borderRadius: radius.pill, paddingHorizontal: 5, paddingVertical: 2 },
  availableText: { fontFamily: typography.medium, fontSize: 9, color: colors.success },
  productBody: { paddingHorizontal: 7, paddingTop: 4, paddingBottom: 6, flex: 1 },
  productName: { fontFamily: typography.heading, lineHeight: 21, marginBottom: 2 },
  metadata: { flexDirection: 'row', alignItems: 'flex-start', gap: 5 },
  metaText: { flex: 1, fontSize: 10, lineHeight: 14 },
  productActions: { flexDirection: 'row', alignItems: 'stretch', gap: 4, marginTop: 'auto', paddingTop: 5 },
  details: { flex: 1, minHeight: 34, borderWidth: 1, borderColor: colors.purpleDark, borderRadius: radius.sm, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3, paddingVertical: 4 },
  detailsLabel: { fontFamily: typography.medium, fontSize: 10, color: colors.purpleDark, textAlign: 'center' },
  addButton: { flex: 1.1, borderRadius: radius.sm, overflow: 'hidden' },
  addGradient: { flex: 1, minHeight: 34, flexDirection: 'row', gap: 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, paddingVertical: 4 },
  addLabel: { flexShrink: 1, fontFamily: typography.regular, color: colors.white, textAlign: 'center', fontSize: 10, lineHeight: 11 },
  disabled: { opacity: .6 },
  demo: { padding: spacing.md, alignSelf: 'center' }, demoText: { fontSize: 10, color: colors.muted },
  overlay: { flex: 1, backgroundColor: colors.deep + '99', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  dialog: { width: '100%', maxWidth: 420, maxHeight: '85%', padding: spacing.xl, borderRadius: radius.lg, backgroundColor: colors.ivory },
  options: { marginVertical: spacing.lg }, option: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line },
  selectedOption: { fontFamily: typography.semibold, color: colors.purpleDark }, notice: { marginVertical: spacing.lg },
});

