import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

export class DatabaseBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <View style={styles.screen}><View style={styles.panel}>
      <Text accessibilityRole="header" style={styles.title}>Não foi possível iniciar o aplicativo</Text>
      <Text style={styles.text}>Ocorreu uma falha ao carregar os dados locais. Tente novamente. Seus dados não serão apagados.</Text>
      <Pressable accessibilityRole="button" onPress={() => this.setState({ failed: false })} style={styles.button}><Text style={styles.label}>Tentar novamente</Text></Pressable>
    </View></View>;
  }
}
const styles = StyleSheet.create({
 screen: { flex: 1, backgroundColor: colors.deep, alignItems: 'center', justifyContent: 'center', padding: 24 },
 panel: { width: '100%', maxWidth: 480, backgroundColor: colors.ivory, padding: 24, borderRadius: 21 },
 title: { fontSize: 22, fontWeight: '600', color: colors.purpleDark },
 text: { fontSize: 15, lineHeight: 22, color: colors.text, marginVertical: 16 },
 button: { minHeight: 48, padding: 12, backgroundColor: colors.purple, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
 label: { color: colors.white, fontSize: 15 },
});
