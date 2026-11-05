/*
  BEKLEYENLER EKRANI — İnternet yokken çekilen fotoğraflar.
  Hazır olanlara dokununca tanıma sonucu açılır ve deftere kaydedilebilir.
*/
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import Backdrop from '../components/layout/Backdrop';
import Screen from '../components/ui/Screen';
import PageHeader from '../components/ui/PageHeader';
import Paper from '../components/ui/Paper';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import IdentifyFlow from '../components/scan/IdentifyFlow';
import { type } from '../components/ui/Typography';
import { confirmAsync } from '../components/ui/confirm';
import { usePendingList, usePhotoUri } from '../data/hooks';
import { formatDate } from '../data/fieldNotes';
import { processPending, retryPending, removePending } from '../services/pendingQueue';
import { colors, fonts } from '../theme';

const STATUS_TEXT = {
  waiting: 'İnternet bekleniyor',
  processing: 'Tanınıyor…',
  ready: 'Hazır: türü seç',
  error: 'Tanınamadı',
};

function PendingItem({ item, onOpen }) {
  const thumb = usePhotoUri(item.photoId, 'thumb');

  async function handleDelete() {
    if (await confirmAsync('Fotoğraf silinsin mi?', 'Bu fotoğraf tanınmadan silinecek.')) await removePending(item.id);
  }

  return (
    <Paper padded={false} style={styles.item}>
      <Image source={thumb ? { uri: thumb } : null} style={styles.thumb} contentFit="cover" />
      <View style={styles.itemBody}>
        <Text style={[styles.status, item.status === 'error' && { color: colors.earth }]}>{STATUS_TEXT[item.status]}</Text>
        {item.status === 'error' && !!item.errorMessage && <Text style={type.small}>{item.errorMessage}</Text>}
        <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
      </View>
      <View style={styles.itemActions}>
        {item.status === 'ready' && <Button small title="Aç" onPress={() => onOpen(item)} />}
        {item.status === 'error' && <Button small variant="ghost" title="Tekrar" onPress={() => retryPending(item.id)} />}
        <Button small variant="text" title="Sil" onPress={handleDelete} />
      </View>
    </Paper>
  );
}

export default function PendingScreen() {
  const items = usePendingList();
  const [open, setOpen] = useState(null); // açık olan bekleyen kayıt

  const back = (
    <Pressable onPress={() => (open ? setOpen(null) : router.back())} style={styles.back} accessibilityRole="button" hitSlop={8}>
      <Icon name="chevronLeft" size={20} color={colors.forest} />
      <Text style={type.link}>{open ? 'Bekleyenler' : 'Geri'}</Text>
    </Pressable>
  );

  if (open) {
    return (
      <View style={{ flex: 1 }}>
        <Backdrop />
        <Screen withNav={false} keyboard>
          {back}
          <PageHeader eyebrow="Bekleyenler" title="Tanıma sonucu" />
          <IdentifyFlow
            photoId={open.photoId}
            result={open.result}
            // Kaydedilince bekleyenlerden çıkar ama fotoğrafı koru (artık defterde)
            onSaved={() => removePending(open.id, { keepPhoto: true })}
            onCancel={() => setOpen(null)}
            onAgain={() => setOpen(null)}
            againLabel="Bekleyenlere dön"
          />
        </Screen>
      </View>
    );
  }

  const waitingCount = items.filter((i) => i.status === 'waiting').length;

  return (
    <View style={{ flex: 1 }}>
      <Backdrop />
      <Screen withNav={false}>
        {back}
        <PageHeader eyebrow="Çevrimdışı çekilenler" title="Bekleyenler" subtitle="Bağlantı gelince bu fotoğraflar kendiliğinden tanınır." />

        {items.length === 0 ? (
          <Paper style={styles.empty}>
            <Icon name="clock" size={40} color={colors.moss} />
            <Text style={[type.muted, type.center]}>Bekleyen fotoğraf yok. Hepsi deftere işlenmiş.</Text>
          </Paper>
        ) : (
          <>
            <View style={{ gap: 10 }}>
              {items.map((item) => (
                <PendingItem key={item.id} item={item} onOpen={setOpen} />
              ))}
            </View>
            {waitingCount > 0 && <Button block variant="ghost" title="Şimdi dene" onPress={() => processPending()} />}
          </>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start', paddingVertical: 4, marginBottom: -6 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 26 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, paddingLeft: 10, paddingRight: 8 },
  thumb: { width: 64, height: 64, borderRadius: 6, backgroundColor: colors.paperEdge },
  itemBody: { flex: 1, gap: 2 },
  status: { fontFamily: fonts.sansHeavy, fontSize: 14.5, color: colors.forest },
  date: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.inkFaint },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
