# Correção de dependências - TRAJEtória Mobile v1.0.1

**Motivo:** O ZIP inicial tinha React 19.2.3, mas deixava pacotes opcionais sem versões fixas. O npm podia escolher `react-dom@19.3.1` (que exige React 19.3.1) e `react-native-worklets@0.13.1` (incompatível com o expo-modules-core do SDK 57).

**Correções no package.json:**
- React e react-dom: `19.2.3`
- React Native: `0.86.3`
- react-native-web: `~0.21.0`
- react-native-reanimated: `4.5.1`
- react-native-worklets: `0.10.1`
- TypeScript: `~6.0.3`

## Instruções para Windows + Git Bash

Substitua o `package.json` antigo pelo deste pacote (ou extraia este ZIP numa pasta nova). Abra o terminal **dentro da raiz do projeto**. Depois execute:

```bash
rm -rf node_modules .expo
rm -f package-lock.json
npm install
npx expo install --check
npx expo start --clear
```

Se persistir erro `ERESOLVE`, envie a **primeira mensagem completa do erro**, pois um pacote diferente poderá estar em conflito.

**Nota sobre os testes:** esta correção usa as versões compatíveis documentadas para Expo SDK 57. Não conseguimos executar `npm install` neste ambiente por indisponibilidade do registro npm; por isso, a instalação ainda precisa ser verificada no computador do usuário.
