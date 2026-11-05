/*
  NAZİK NOT — Uygulamanın her yerinde aynı metin kullanılsın diye tek yerde tutulur.
  Bu metni değiştirme; projenin kesin kuralının bir parçası.
*/
import { StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import { colors, fonts, radius } from '../../theme';

export const DISCLAIMER_TEXT =
  'Mantar Defteri bir keşif defteridir, tüketim rehberi değildir. Fotoğrafla tür tespiti kesin değildir.';

export default function Disclaimer({ compact = false, style }) {
  return (
    <View style={[styles.box, compact && styles.compact, style]} accessibilityRole="text">
      <Icon name="info" size={compact ? 16 : 18} color={colors.earth} style={styles.icon} />
      <Text style={[styles.text, compact && styles.textCompact]}>{DISCLAIMER_TEXT}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.paperEdge,
    borderRadius: radius.sm,
  },
  compact: { borderWidth: 0, paddingVertical: 4, paddingHorizontal: 2 },
  icon: { marginTop: 2 },
  text: { flex: 1, fontFamily: fonts.sansItalic, fontSize: 13.5, lineHeight: 20, color: colors.inkSoft },
  textCompact: { fontSize: 12.5, lineHeight: 18 },
});
