/*
  KUTLAMA — Kayıttan sonra gösterilen küçük, zarif sonuç kartı.
  - Yeni tür: kitaba yeni bir sayfa eklenir (sayfa kayarak gelir, hardal pırıltı).
  - Tekrar: "eski bir tanıdık", görülme sayısı.
  - Taslak: sakin bir onay.
*/
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Appear from '../ui/Appear';
import * as Haptics from 'expo-haptics';
import Paper, { PaperTexture } from '../ui/Paper';
import Button from '../ui/Button';
import Chip from '../ui/Chip';
import Icon from '../ui/Icon';
import { MushroomSketch } from '../ui/Ornaments';
import { Eyebrow, type } from '../ui/Typography';
import { RARITY } from '../../data/gamification';
import { displayName } from '../../services/safety';
import { colors, fonts, shadows } from '../../theme';

// Küçük bir kâğıt sağdan kayarak kitaba girer; pırıltılar ardından belirir
const PAGE_IN = { opacity: 0, translateX: 40, rotate: 8 };
const SPARK_IN = { opacity: 0, scale: 0.4, rotate: -20 };
export default function Celebration({ outcome, onAgain, againLabel = 'Yeni tarama', againIcon = 'camera', hideBookLink = false }) {
  const { type: kind, species, pointsEarned } = outcome;

  useEffect(() => {
    if (kind === 'new') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [kind]);

  // "Sayfasını aç" doğrudan ilgili sayfayı açar
  function openBook() {
    router.navigate({ pathname: '/kitap', params: { sayfa: kind === 'draft' ? 'taslaklar' : species.id, t: Date.now() } });
  }

  return (
    <Animated.View entering={FadeInDown.duration(280)}>
      <Paper style={styles.card} accessibilityLiveRegion="polite">
        {kind === 'new' && (
          <>
            <Appear from={PAGE_IN} duration={700} overshoot style={styles.page}>
              <PaperTexture borderRadius={6} />
              <MushroomSketch size={54} color={colors.forest} />
              <Appear from={SPARK_IN} to={{ opacity: 0.9 }} delay={500} duration={700} overshoot style={[styles.spark, { top: -10, right: -12 }]}>
                <Icon name="sparkle" size={18} color={colors.mustard} />
              </Appear>
              <Appear from={SPARK_IN} to={{ opacity: 0.9 }} delay={750} duration={700} overshoot style={[styles.spark, { bottom: 8, left: -14 }]}>
                <Icon name="sparkle" size={13} color={colors.mustard} />
              </Appear>
            </Appear>
            <Eyebrow>Kitabına yeni bir sayfa eklendi</Eyebrow>
            <Text style={[styles.title]}>{displayName(species)}</Text>
            {!!species.turkishName && <Text style={styles.latin}>{species.latinName}</Text>}
            <View style={styles.chips}>
              <Chip label={RARITY[species.rarity]?.label} />
              <Chip variant="points" label={`+${pointsEarned} puan`} />
            </View>
          </>
        )}

        {kind === 'repeat' && (
          <>
            <Icon name="eye" size={40} color={colors.moss} style={{ marginBottom: 4 }} />
            <Eyebrow>Eski bir tanıdık</Eyebrow>
            <Text style={styles.title}>{displayName(species)}</Text>
            <Text style={[type.muted, type.center]}>Bu türü {species.seenCount}. kez gördün. Fotoğraf sayfasına eklendi.</Text>
            <View style={styles.chips}>
              <Chip variant="points" label={`+${pointsEarned} puan`} />
            </View>
          </>
        )}

        {kind === 'draft' && (
          <>
            <Icon name="book" size={40} color={colors.moss} style={{ marginBottom: 4 }} />
            <Eyebrow>Taslak olarak kaydedildi</Eyebrow>
            <Text style={styles.title}>Sonra karar verebilirsin</Text>
            <Text style={[type.muted, type.center]}>Fotoğraf ve notların defterin taslaklar bölümünde duruyor.</Text>
          </>
        )}

        <View style={styles.actions}>
          <Button block icon={againIcon} title={againLabel} onPress={onAgain} />
          {!hideBookLink && (
            <Button block variant="ghost" icon="book" title={kind === 'draft' ? 'Taslaklara git' : 'Sayfasını aç'} onPress={openBook} />
          )}
        </View>
      </Paper>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: 8, paddingTop: 26, paddingHorizontal: 20, paddingBottom: 20 },
  page: {
    width: 92,
    height: 116,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paperWhite,
    borderWidth: 1,
    borderColor: colors.paperEdge,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    ...shadows.paper,
  },
  spark: { position: 'absolute' },
  title: { fontFamily: fonts.serif, fontSize: 29, lineHeight: 34, color: colors.forest, textAlign: 'center' },
  latin: { fontFamily: fonts.serifItalic, fontSize: 18, color: colors.inkSoft },
  chips: { flexDirection: 'row', gap: 8, marginTop: 6, marginBottom: 10 },
  actions: { alignSelf: 'stretch', gap: 10, marginTop: 6 },
});
