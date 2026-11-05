/*
  TARA EKRANI — Fotoğraf çek / yükle → tanı → seç → kaydet.

  Adımlar (step):
    pick       Fotoğraf seçme butonları
    analyzing  Fotoğraf hazırlanıyor ve tanınıyor
    result     Tanıma sonucu geldi → IdentifyFlow devralır
    offline    İnternet yok → fotoğraf bekleyenlere eklendi
    error      Bir sorun çıktı → tekrar dene / bekleyenlere ekle / vazgeç
*/
import { useRef, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn } from 'react-native-reanimated';
import Screen from '../../components/ui/Screen';
import PageHeader from '../../components/ui/PageHeader';
import Paper from '../../components/ui/Paper';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import Polaroid from '../../components/ui/Polaroid';
import Disclaimer from '../../components/ui/Disclaimer';
import IdentifyFlow from '../../components/scan/IdentifyFlow';
import Appear, { POLAROID_IN } from '../../components/ui/Appear';
import AnalyzingDots from '../../components/scan/AnalyzingDots';
import { type } from '../../components/ui/Typography';
import { usePhotoUri, useStats } from '../../data/hooks';
import { tables } from '../../data/db';
import { identify, OfflineError } from '../../services/recognizer';
import { savePhoto, deletePhoto } from '../../services/collection';
import { addPending } from '../../services/pendingQueue';
import { colors, fonts } from '../../theme';

const PICKER_OPTIONS = { mediaTypes: ['images'], quality: 0.9, exif: false };

export default function ScanScreen() {
  const [state, setState] = useState({ step: 'pick' });
  const { pendingCount } = useStats();
  const photoUri = usePhotoUri(state.photoId, 'full');
  const scrollRef = useRef(null);
  const toTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });

  async function runIdentify(photoId) {
    setState({ step: 'analyzing', photoId });
    try {
      const photo = await tables.photos.get(photoId);
      const result = await identify(photo);
      setState({ step: 'result', photoId, result });
    } catch (err) {
      if (err instanceof OfflineError) {
        await addPending(photoId, 'offline');
        setState({ step: 'offline', photoId });
      } else {
        setState({ step: 'error', photoId, message: err.message, code: err.code });
      }
    }
  }

  async function pick(source) {
    try {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setState({ step: 'error', code: 'permission', source, message: source === 'camera' ? 'Kamera izni verilmedi.' : 'Galeri izni verilmedi.' });
        return;
      }

      const res =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
          : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
      if (res.canceled || !res.assets?.length) return;

      setState({ step: 'analyzing' });
      const photoId = await savePhoto(res.assets[0]); // önce cihaza kaydet: internet giderse kaybolmasın
      await runIdentify(photoId);
    } catch (err) {
      console.warn('[tara]', err);
      setState({ step: 'error', message: err.message || 'Fotoğraf açılamadı.' });
    }
  }

  /** Kaydetmeden vazgeç: fotoğrafı da sil */
  async function cancel() {
    await deletePhoto(state.photoId);
    setState({ step: 'pick' });
  }

  async function moveToPending() {
    await addPending(state.photoId, 'error');
    setState({ step: 'offline', photoId: state.photoId });
  }

  const restart = () => {
    setState({ step: 'pick' });
    toTop();
  };

  return (
    <Screen ref={scrollRef} keyboard>
      <PageHeader
        eyebrow="Yeni keşif"
        title="Mantar tara"
        subtitle={state.step === 'pick' ? 'Mantarı yakından, şapkası ve sapı görünecek şekilde çek.' : undefined}
      />

      {state.step === 'pick' && (
        <Animated.View entering={FadeIn.duration(250)} style={styles.stack}>
          <Paper dashed style={styles.frame}>
            <Icon name="mushroom" size={54} strokeWidth={1.2} color={colors.moss} />
            <Text style={[type.muted, type.center]}>Şapkanın altı da görünürse tanıma daha isabetli olur.</Text>
          </Paper>

          <View style={styles.actions}>
            <Button block icon="camera" title="Fotoğraf çek" onPress={() => pick('camera')} />
            <Button block variant="ghost" icon="gallery" title="Galeriden yükle" onPress={() => pick('library')} />
          </View>

          {pendingCount > 0 && (
            <Paper style={styles.pendingLink} onPress={() => router.push('/bekleyenler')}>
              <Icon name="clock" color={colors.earth} />
              <Text style={[type.body, { flex: 1 }]}>
                <Text style={{ fontFamily: fonts.sansHeavy }}>{pendingCount} fotoğraf</Text> tanınmayı bekliyor
              </Text>
              <Text style={type.body}>→</Text>
            </Paper>
          )}

          <Disclaimer />
        </Animated.View>
      )}

      {state.step === 'analyzing' && (
        <View style={styles.analyzing}>
          <Appear from={POLAROID_IN}>
            <Polaroid uri={photoUri} width={240} />
          </Appear>
          <Text style={styles.analyzingText}>Defterin sayfaları karıştırılıyor…</Text>
          <AnalyzingDots />
        </View>
      )}

      {state.step === 'result' && (
        <IdentifyFlow photoId={state.photoId} result={state.result} onCancel={cancel} onAgain={restart} onStepChange={toTop} />
      )}

      {state.step === 'offline' && (
        <Paper style={styles.message}>
          <Polaroid uri={photoUri} width={150} tilt={2} />
          <Text style={[type.h3, type.center, { marginTop: 8 }]}>Fotoğraf bekleyenlere eklendi</Text>
          <Text style={[type.muted, type.center]}>
            Bağlantı gelince otomatik olarak tanınacak. Sonra Bekleyenler'den türü seçebilirsin.
          </Text>
          <View style={[styles.actions, styles.wide]}>
            <Button block icon="camera" title="Yeni tarama" onPress={restart} />
            <Button block variant="ghost" icon="clock" title="Bekleyenler" onPress={() => router.push('/bekleyenler')} />
          </View>
        </Paper>
      )}

      {state.step === 'error' && (
        <Paper style={styles.message}>
          <Icon name="info" size={36} color={colors.earth} />
          <Text style={[type.h3, type.center]}>{state.code === 'permission' ? 'İzin gerekiyor' : 'Tanıma yapılamadı'}</Text>
          <Text style={[type.muted, type.center]}>{state.message}</Text>
          {state.code === 'no-key' && <Text style={[type.small, type.center]}>README'deki "API anahtarı" bölümüne bak.</Text>}
          <View style={[styles.actions, styles.wide]}>
            {state.code === 'permission' && (
              <Button block title="Telefon ayarlarını aç" onPress={() => Linking.openSettings().catch(() => {})} />
            )}
            {!!state.photoId && <Button block title="Tekrar dene" onPress={() => runIdentify(state.photoId)} />}
            {!!state.photoId && <Button block variant="ghost" title="Bekleyenlere ekle, sonra dene" onPress={moveToPending} />}
            <Button variant="text" title={state.photoId ? 'Vazgeç' : 'Geri dön'} onPress={state.photoId ? cancel : restart} />
          </View>
        </Paper>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 18 },
  frame: { aspectRatio: 4 / 3, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  actions: { gap: 10 },
  wide: { alignSelf: 'stretch', marginTop: 6 },
  pendingLink: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  analyzing: { alignItems: 'center', gap: 16, marginTop: 8 },
  analyzingText: { fontFamily: fonts.serifItalic, fontSize: 20, color: colors.forest, textAlign: 'center' },
  message: { alignItems: 'center', gap: 10, paddingVertical: 26 },
});
