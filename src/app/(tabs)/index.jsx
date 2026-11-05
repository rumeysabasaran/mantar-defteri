/*
  ANA SAYFA — Selam, seviye özeti, kitaba kısa yol, gezi başlatma ve son buluşlar.
*/
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import Screen from '../../components/ui/Screen';
import PageHeader from '../../components/ui/PageHeader';
import Paper from '../../components/ui/Paper';
import Button from '../../components/ui/Button';
import Chip from '../../components/ui/Chip';
import Icon from '../../components/ui/Icon';
import Disclaimer from '../../components/ui/Disclaimer';
import BookCover from '../../components/book/BookCover';
import { Divider, MushroomSketch } from '../../components/ui/Ornaments';
import { Eyebrow, type } from '../../components/ui/Typography';
import { useStats, useRecentSightings, usePhotoUri } from '../../data/hooks';
import { levelFor } from '../../data/gamification';
import { formatDate, weatherLabel } from '../../data/fieldNotes';
import { displayName } from '../../services/safety';
import { colors, fonts } from '../../theme';

/** Son buluşlar listesindeki tek satır: küçük fotoğraf, tür adı, tarih */
function RecentItem({ sighting }) {
  const thumb = usePhotoUri(sighting.photoId, 'thumb');
  const isDraft = sighting.status === 'draft';
  const meta = [formatDate(sighting.foundAt, false), weatherLabel(sighting.notes?.weather), sighting.notes?.location?.placeName]
    .filter(Boolean)
    .join(' · ');
  const name = isDraft ? 'Taslak buluş' : displayName(sighting.species);

  return (
    <Paper
      padded={false}
      style={styles.recentItem}
      onPress={() => router.navigate({ pathname: '/kitap', params: { sayfa: isDraft ? 'taslaklar' : sighting.speciesId, t: Date.now() } })}
      accessibilityLabel={`${name}, ${meta}`}
    >
      <Image source={thumb ? { uri: thumb } : null} style={styles.recentThumb} contentFit="cover" transition={200} />
      <View style={{ flex: 1 }}>
        <Text style={styles.recentName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.recentMeta} numberOfLines={1}>
          {meta}
        </Text>
      </View>
    </Paper>
  );
}

/** Günün saatine göre selamlama */
function greeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

export default function HomeScreen() {
  const stats = useStats();
  const recent = useRecentSightings(5);
  const { current } = levelFor(stats.points);

  return (
    <Screen>
      <PageHeader eyebrow={greeting()} title="Bugün ormanda ne var?">
        <Chip icon="leaf" label={`${current.title} · ${stats.points} puan`} style={{ marginTop: 8 }} />
      </PageHeader>

      {/* Kitaba kısa yol */}
      <Paper style={styles.book} onPress={() => router.navigate('/kitap')} accessibilityLabel="Koleksiyon kitabını aç">
        <BookCover speciesCount={stats.speciesCount} small />
        <View style={styles.bookText}>
          <Text style={type.h3}>Koleksiyon Kitabın</Text>
          <Text style={type.muted}>
            {stats.speciesCount === 0
              ? 'İlk sayfa seni bekliyor. Yürüyüşte gördüğün ilk mantarı tara.'
              : `${stats.speciesCount} tür kaydettin. Kitabın kalınlaşıyor.`}
          </Text>
          <Text style={type.link}>Kitabı aç →</Text>
        </View>
      </Paper>

      {/* Gezi başlat */}
      <Paper style={styles.trip}>
        <View>
          <Eyebrow>Yürüyüşe mi çıkıyorsun?</Eyebrow>
          <Text style={[type.h3, { marginTop: 2, marginBottom: 4 }]}>Bir gezi başlat</Text>
          <Text style={type.muted}>Gezi boyunca bulduğun türler tek bir hatırada toplanır.</Text>
        </View>
        <Button variant="ghost" icon="trail" title="Gezilere git" onPress={() => router.navigate('/geziler')} />
      </Paper>

      <Divider />

      {/* Son buluşlar */}
      <View style={styles.recent}>
        <Text style={type.h2}>Son buluşlar</Text>
        {recent.length === 0 ? (
          <Paper style={styles.empty}>
            <MushroomSketch size={64} color={colors.moss} />
            <Text style={[type.muted, type.center]}>Henüz bir buluş yok. Alttaki kamera butonuyla başlayabilirsin.</Text>
          </Paper>
        ) : (
          recent.map((s) => <RecentItem key={s.id} sighting={s} />)
        )}
      </View>

      {stats.pendingCount > 0 && (
        <Paper style={styles.pending} onPress={() => router.push('/bekleyenler')}>
          <Icon name="clock" color={colors.earth} />
          <Text style={styles.pendingText}>{stats.pendingCount} fotoğraf tanınmayı bekliyor →</Text>
        </Paper>
      )}

      <Disclaimer compact />
    </Screen>
  );
}

const styles = StyleSheet.create({
  book: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  bookText: { flex: 1, gap: 6 },
  trip: { gap: 14 },
  recent: { gap: 12 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 26 },
  recentItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, paddingLeft: 10, paddingRight: 14 },
  recentThumb: { width: 56, height: 56, borderRadius: 6, backgroundColor: colors.paperEdge },
  recentName: { fontFamily: fonts.serif, fontSize: 19, lineHeight: 23, color: colors.forest },
  recentMeta: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkFaint },
  pending: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  pendingText: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.earth, flex: 1 },
});
