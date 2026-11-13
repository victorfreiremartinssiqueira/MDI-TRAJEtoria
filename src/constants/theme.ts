export const colors = {
  deep: '#2E1B3D', purple: '#5B3B7E', purpleDark: '#43165F', lavender: '#CDB8E6',
  lilac: '#E9D9F6', lilacLight: '#F4F0FA', ivory: '#FBF8F4', white: '#FFFFFF',
  gold: '#C9A15A', champagne: '#E8D9AE', text: '#332342', muted: '#6F6178',
  successBg: '#E0F3DC', success: '#225D37', warningBg: '#FFF0D9',
  line: '#E4D5E9', danger: '#AA4157', transparent: 'transparent',
};
export const spacing = { xxs: 4, xs: 7, sm: 10, md: 14, lg: 18, xl: 24, xxl: 32, xxxl: 44 } as const;
export const radius = { sm: 10, md: 15, lg: 21, xl: 28, pill: 999 } as const;
export const typography = {
  heading: 'CormorantGaramond_600SemiBold', headingRegular: 'CormorantGaramond_500Medium',
  regular: 'Jost_400Regular', medium: 'Jost_500Medium', semibold: 'Jost_600SemiBold', bold: 'Jost_700Bold',
} as const;
export const config = { maxItemsPerOrder: 5, dispatchDay: 4, dispatchThursdayCutoffHour: null as number | null, consentVersion: '1.0', demoYoungId: 1, demoUser: 'lucas.demo', demoPassword: 'trajetoria123' } as const;
export const shadow = { shadowColor: colors.deep, shadowOpacity: .08, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 3 };
