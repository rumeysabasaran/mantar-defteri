/*
  GEZİLER EKRANI — Gezi başlatma/bitirme ve geçmiş gezilerin özeti.
  Kayıt mantığı 5. aşamada eklenecek; şimdilik görünüm hazır.
*/
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../../components/ui/Screen';
import PageHeader from '../../components/ui/PageHeader';
import Paper from '../../components/ui/Paper';
import Button from '../../components/ui/Button';
import { FernSprig } from '../../components/ui/Ornaments';
import { type } from '../../components/ui/Typography';
import { colors } from '../../theme';

export default function TripsScreen() {
  return (
    <Screen>
      <PageHeader eyebrow="Saha günlüğü" title="Geziler" subtitle="Her yürüyüş; tarihi, yeri ve bulduğun türlerle bir hatıraya dönüşür." />

      <Paper style={styles.start}>
        <Text style={type.h3}>Yeni gezi</Text>
        <Text style={type.muted}>Başlattığında, bitirene kadar taradığın her mantar bu geziye yazılır.</Text>
        <Button block icon="trail" title="Gezi başlat" disabled />
        <Text style={[type.small, type.center, { color: colors.inkFaint }]}>5. aşamada etkinleşecek</Text>
      </Paper>

      <View style={styles.list}>
        <Text style={type.h2}>Geçmiş geziler</Text>
        <Paper style={styles.empty}>
          <FernSprig size={70} color={colors.moss} />
          <Text style={[type.muted, type.center]}>Henüz bir gezi yok. İlk yürüyüşünden sonra burada görünecek.</Text>
        </Paper>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  start: { gap: 10 },
  list: { gap: 12 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 26 },
});
