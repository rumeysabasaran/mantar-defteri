/*
  KİTAP SAYFALARI — Kitabın içindeki her sayfa türü burada.
  Her sayfa aynı kâğıt çerçeveyi (Page) kullanır; içerik uzunsa sayfa içinde kayar.
*/
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import BookCover from './BookCover';
import Polaroid from '../ui/Polaroid';
import Icon from '../ui/Icon';
import Chip from '../ui/Chip';
import Disclaimer from '../ui/Disclaimer';
import { CornerFlourish, Divider, FernSprig, MushroomSketch } from '../ui/Ornaments';
import { Eyebrow, type } from '../ui/Typography';
import { usePhotoUri } from '../../data/hooks';
import { RARITY } from '../../data/gamification';
import { formatDate, weatherLabel } from '../../data/fieldNotes';
import { displayName } from '../../services/safety';
import { colors, fonts, shadows } from '../../theme';

/** Ortak sayfa çerçevesi: kenar boşluğu çizgisi, kayan içerik, altta sayfa numarası */
function Page({ number, center = false, corner = false, children }) {
  return (
    <View style={styles.page}>
      {/* sol kenarda ince kahverengi kenar boşluğu çizgisi: eski defter hissi */}
      <View style={styles.margin} pointerEvents="none" />
      {corner && <CornerFlourish size={40} rotate={90} color={colors.moss} style={styles.corner} />}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, center && styles.scrollCenter]}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {children}
      </ScrollView>
      {number != null && (
        <Text style={styles.number} accessibilityLabel={`Sayfa ${number}`}>
          ~ {number} ~
        </Text>
      )}
    </View>
  );
}

/** Kimliğe göre her seferinde aynı küçük eğimi verir (polaroidler hep aynı açıda dursun) */
function tiltFor(id = '') {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Number(((Math.abs(h) % 50) / 10 - 2.5).toFixed(1)); // -2.5° … +2.5°
}

/** İçindekiler'deki noktalı çizgi */
function Leader() {
  return (
    <View style={styles.leader}>
      <Svg width="100%" height={2}>
        <Line x1="0" y1="1" x2="100%" y2="1" stroke={colors.paperEdge} strokeWidth={1.5} strokeDasharray="1.5 3.5" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

// ---------------------------------------------------------------- KAPAK

export function CoverPage({ speciesCount, onOpen }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [pulse]);
  const hintStyle = useAnimatedStyle(() => ({ opacity: 0.45 + pulse.value * 0.4 }));

  return (
    <View style={styles.cover}>
      <Pressable style={{ flex: 1 }} onPress={onOpen} accessibilityRole="button" accessibilityLabel="Kitabı aç">
        <BookCover speciesCount={speciesCount} fill />
      </Pressable>
      <Animated.Text style={[styles.coverHint, hintStyle]} pointerEvents="none">
        Açmak için dokun ya da sola kaydır
      </Animated.Text>
    </View>
  );
}

// ---------------------------------------------------------------- İÇİNDEKİLER

function TocRow({ no, name, latin, page, onPress, extra = false }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tocRow, pressed && { opacity: 0.6 }]} accessibilityRole="button">
      {no != null && <Text style={styles.tocNo}>{no}.</Text>}
      <View style={styles.tocNameBox}>
        <Text style={[styles.tocName, extra && styles.tocNameExtra]}>{name}</Text>
        {!!latin && <Text style={styles.tocLatin}>{latin}</Text>}
      </View>
      <Leader />
      <Text style={styles.tocPage}>{page}</Text>
    </Pressable>
  );
}

export function TocPage({ number, entries, draftCount, draftsPage, mysteryCount, mysteryPage, showMystery, onToggleMystery, onJump }) {
  return (
    <Page number={number} corner>
      <Text style={styles.pageTitle}>İçindekiler</Text>
      <Divider />

      {entries.length === 0 ? (
        <View style={styles.tocEmpty}>
          <MushroomSketch size={64} color={colors.moss} />
          <Text style={[type.muted, type.center]}>Sayfalar henüz boş. İlk mantarını taradığında buraya yazılacak.</Text>
        </View>
      ) : (
        <View>
          {entries.map((e) => (
            <TocRow key={e.key} no={e.no} name={e.name} latin={e.latin} page={e.page} onPress={() => onJump(e.page)} />
          ))}
        </View>
      )}

      {(draftCount > 0 || (showMystery && mysteryCount > 0)) && <Divider />}
      <View>
        {draftCount > 0 && <TocRow extra name={`Taslaklar (${draftCount})`} page={draftsPage} onPress={() => onJump(draftsPage)} />}
        {showMystery && mysteryCount > 0 && (
          <TocRow extra name={`Keşfedilmeyi bekleyenler (${mysteryCount})`} page={mysteryPage} onPress={() => onJump(mysteryPage)} />
        )}
      </View>

      <Pressable
        onPress={() => onToggleMystery(!showMystery)}
        style={styles.toggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: showMystery }}
      >
        <View style={[styles.checkbox, showMystery && styles.checkboxOn]}>
          {showMystery && <Icon name="check" size={14} strokeWidth={2.4} color={colors.cream} />}
        </View>
        <Text style={[type.small, { flex: 1 }]}>Henüz bulunmamış türleri silik "?" sayfaları olarak göster</Text>
      </Pressable>
    </Page>
  );
}

// ---------------------------------------------------------------- TÜR SAYFASI

function DescriptionRow({ label, text }) {
  if (!text) return null;
  return (
    <View style={styles.descRow}>
      <Text style={styles.descLabel}>{label.toLocaleUpperCase('tr-TR')}</Text>
      <Text style={styles.descText}>{text}</Text>
    </View>
  );
}

function Thumb({ photoId, onPress, isCover }) {
  const uri = usePhotoUri(photoId, 'thumb');
  return (
    <Pressable onPress={onPress} style={[styles.thumb, isCover && styles.thumbCover]} accessibilityRole="imagebutton" accessibilityLabel="Fotoğrafı büyüt">
      {!!uri && <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />}
    </Pressable>
  );
}

function NoteEntry({ sighting, onEdit }) {
  const n = sighting.notes ?? {};
  const facts = [
    weatherLabel(n.weather),
    n.location?.placeName,
    n.location?.lat != null && !n.location?.placeName ? 'Konum kayıtlı' : '',
    n.companions && `Yanımda: ${n.companions}`,
  ].filter(Boolean);

  return (
    <View style={styles.note}>
      <View style={styles.noteHead}>
        <Text style={styles.noteDate}>{formatDate(sighting.foundAt)}</Text>
        <Pressable onPress={onEdit} hitSlop={10} accessibilityRole="button">
          <Text style={styles.noteEdit}>Düzenle</Text>
        </Pressable>
      </View>
      {facts.length > 0 && <Text style={type.small}>{facts.join(' · ')}</Text>}
      {n.note ? <Text style={styles.noteText}>“{n.note}”</Text> : facts.length === 0 && <Text style={styles.noteEmpty}>Not eklenmemiş.</Text>}
    </View>
  );
}

export function SpeciesPage({ number, no, species, sightings, onOpenPhoto, onEditSighting }) {
  const coverUri = usePhotoUri(species.coverPhotoId, 'full');
  const d = species.description ?? {};
  const newestFirst = [...sightings].reverse();

  return (
    <Page number={number} corner>
      <View style={styles.speciesHead}>
        <Eyebrow>{`No. ${no}`}</Eyebrow>
        <Text style={styles.speciesName}>{displayName(species)}</Text>
        {!!species.turkishName && <Text style={styles.speciesLatin}>{species.latinName}</Text>}
        <View style={styles.chipRow}>
          <Chip label={RARITY[species.rarity]?.label} />
          <Chip variant="quiet" icon="eye" label={`${species.seenCount} kez görüldü`} />
        </View>
      </View>

      <Pressable onPress={() => onOpenPhoto(species.coverPhotoId)} style={styles.polaroidBtn} accessibilityRole="imagebutton" accessibilityLabel="Fotoğrafı büyüt">
        <Polaroid uri={coverUri} caption={formatDate(species.firstFoundAt)} tilt={tiltFor(species.id)} width={230} />
      </Pressable>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tanım</Text>
        <View style={{ gap: 8 }}>
          <DescriptionRow label="Şapka" text={d.capShape} />
          <DescriptionRow label="Renk" text={d.color} />
          <DescriptionRow label="Sap" text={d.stem} />
          <DescriptionRow label="Ortam" text={d.habitat} />
          <DescriptionRow label="Mevsim" text={d.season} />
        </View>
      </View>

      {!!species.funFact && (
        <View style={styles.fact}>
          <View style={styles.factTitleRow}>
            <Icon name="sparkle" size={16} color={colors.mustard} />
            <Text style={styles.factTitle}>Biliyor muydun?</Text>
          </View>
          <Text style={styles.factText}>{species.funFact}</Text>
        </View>
      )}

      <Text style={styles.aiNote}>Tanım ve bilgi yapay zekâ tarafından yazıldı; hatalı olabilir.</Text>

      <Divider />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Saha notları</Text>
        <View style={{ gap: 12 }}>
          {newestFirst.map((s) => (
            <NoteEntry key={s.id} sighting={s} onEdit={() => onEditSighting(s)} />
          ))}
        </View>
      </View>

      {sightings.length > 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fotoğraflar ({sightings.length})</Text>
          <View style={styles.gallery}>
            {sightings.map((s) => (
              <Thumb key={s.id} photoId={s.photoId} isCover={s.photoId === species.coverPhotoId} onPress={() => onOpenPhoto(s.photoId)} />
            ))}
          </View>
        </View>
      )}
    </Page>
  );
}

// ---------------------------------------------------------------- "?" SAYFASI

export function MysteryPage({ number, entry, first }) {
  return (
    <Page number={number} center>
      {first && <Text style={styles.mysterySection}>Keşfedilmeyi bekleyenler</Text>}
      <View style={styles.mysteryBody}>
        <Text style={styles.mysteryMark}>?</Text>
        <MushroomSketch size={84} color={colors.inkFaint} style={styles.mysterySketch} />
        <Eyebrow>Henüz keşfedilmedi</Eyebrow>
        <Text style={styles.mysteryHint}>{entry.hint}</Text>
        <Chip variant="quiet" label={entry.season} style={{ alignSelf: 'center' }} />
      </View>
    </Page>
  );
}

// ---------------------------------------------------------------- TASLAKLAR

function DraftItem({ sighting, onOpen }) {
  const uri = usePhotoUri(sighting.photoId, 'thumb');
  const guess = sighting.candidates?.[0];
  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.draft, pressed && { opacity: 0.7 }]} accessibilityRole="button">
      <Polaroid uri={uri} width={92} tilt={tiltFor(sighting.id)} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.draftDate}>{formatDate(sighting.foundAt)}</Text>
        <Text style={type.small}>{guess ? `Belki: ${displayName(guess)}` : 'Tür önerisi yok'}</Text>
        <Text style={styles.draftCta}>Türünü seç →</Text>
      </View>
    </Pressable>
  );
}

export function DraftsPage({ number, drafts, onOpenDraft }) {
  return (
    <Page number={number}>
      <Text style={styles.pageTitle}>Taslaklar</Text>
      <Text style={[type.small, type.center]}>Emin olamadığın buluşlar. Türünü seçince kendi sayfasına taşınır.</Text>
      <Divider />
      <View style={{ gap: 14 }}>
        {drafts.map((s) => (
          <DraftItem key={s.id} sighting={s} onOpen={() => onOpenDraft(s)} />
        ))}
      </View>
    </Page>
  );
}

// ---------------------------------------------------------------- SON SAYFA

export function EndPage({ number, speciesCount }) {
  return (
    <Page number={number} center>
      <View style={styles.endBody}>
        <FernSprig size={110} color={colors.moss} style={{ opacity: 0.7 }} />
        <Text style={styles.pageTitle}>Defterin devam ediyor…</Text>
        <Text style={[type.muted, type.center]}>
          {speciesCount === 0
            ? 'İlk yürüyüşün bu sayfaları dolduracak.'
            : `${speciesCount} tür kaydettin. Her yeni keşif bu kitaba bir sayfa daha ekleyecek.`}
        </Text>
        <Disclaimer />
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  // ortak
  page: { flex: 1 },
  margin: { position: 'absolute', left: 18, top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(123, 86, 52, 0.18)' },
  corner: { position: 'absolute', top: 8, right: 8, opacity: 0.45, zIndex: 1 },
  scroll: { paddingTop: 26, paddingBottom: 12, paddingLeft: 30, paddingRight: 22, gap: 14, flexGrow: 1 },
  scrollCenter: { justifyContent: 'center' },
  number: { paddingTop: 6, paddingBottom: 10, textAlign: 'center', fontFamily: fonts.serifItalic, fontSize: 15, color: colors.inkFaint },
  pageTitle: { fontFamily: fonts.serif, fontSize: 29, lineHeight: 34, color: colors.forest, textAlign: 'center' },

  // kapak
  cover: { flex: 1, backgroundColor: colors.forest },
  coverHint: {
    position: 'absolute',
    bottom: '16%',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.serifItalic,
    fontSize: 17,
    color: colors.mustardSoft,
  },

  // içindekiler
  tocEmpty: { alignItems: 'center', gap: 10, paddingVertical: 20 },
  tocRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingVertical: 8 },
  tocNo: { fontFamily: fonts.serifMedium, fontSize: 16, color: colors.earth, minWidth: 22, paddingBottom: 2 },
  tocNameBox: { flexShrink: 1, maxWidth: '72%' },
  tocName: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 22, color: colors.forest },
  tocNameExtra: { fontFamily: fonts.serifItalic, fontSize: 16 },
  tocLatin: { fontFamily: fonts.serifItalic, fontSize: 14.5, color: colors.inkSoft },
  leader: { flex: 1, minWidth: 16, paddingBottom: 6 },
  tocPage: { fontFamily: fonts.serifMedium, fontSize: 17, color: colors.inkSoft, paddingBottom: 1 },
  toggle: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 'auto', paddingTop: 12 },
  checkbox: {
    width: 20,
    height: 20,
    marginTop: 1,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.forest },

  // tür sayfası
  speciesHead: { gap: 2, paddingRight: 34 },
  speciesName: { fontFamily: fonts.serif, fontSize: 32, lineHeight: 36, color: colors.forest },
  speciesLatin: { fontFamily: fonts.serifItalic, fontSize: 18.5, color: colors.inkSoft },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  polaroidBtn: { alignSelf: 'center', marginTop: 14, marginBottom: 6 },
  section: { gap: 8 },
  sectionTitle: { fontFamily: fonts.serifBoldItalic, fontSize: 18.5, color: colors.earth },
  descRow: { flexDirection: 'row', gap: 10 },
  descLabel: { width: 64, paddingTop: 3, fontFamily: fonts.sansHeavy, fontSize: 11.5, letterSpacing: 1.2, color: colors.moss },
  descText: { flex: 1, fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 21, color: colors.ink },
  fact: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(240, 223, 180, 0.55)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.mustard,
  },
  factTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  factTitle: { fontFamily: fonts.serif, fontSize: 18, color: colors.earth },
  factText: { fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 21, color: colors.ink },
  aiNote: { fontFamily: fonts.sansItalic, fontSize: 12, color: colors.inkFaint, marginTop: -6 },
  note: { paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: colors.paperEdge, gap: 2 },
  noteHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  noteDate: { fontFamily: fonts.serif, fontSize: 17.5, color: colors.forest },
  noteEdit: { fontFamily: fonts.sansHeavy, fontSize: 13, color: colors.earth },
  noteText: { fontFamily: fonts.serifItalic, fontSize: 17.5, lineHeight: 23, color: colors.ink, marginTop: 2 },
  noteEmpty: { fontFamily: fonts.sansItalic, fontSize: 13, color: colors.inkFaint },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumb: { width: 72, height: 72, padding: 4, backgroundColor: colors.paperWhite, overflow: 'hidden', ...shadows.paper },
  thumbCover: { borderWidth: 2, borderColor: colors.mustard },

  // "?" sayfası
  mysterySection: {
    position: 'absolute',
    top: 22,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.serifItalic,
    fontSize: 16,
    color: colors.inkFaint,
  },
  mysteryBody: { alignItems: 'center', gap: 10, opacity: 0.72 },
  mysteryMark: { fontFamily: fonts.serifMedium, fontSize: 128, lineHeight: 132, color: colors.paperEdge },
  mysterySketch: { opacity: 0.6, marginTop: -40 },
  mysteryHint: { fontFamily: fonts.serifItalic, fontSize: 19, lineHeight: 25, color: colors.inkSoft, textAlign: 'center', maxWidth: 280 },

  // taslaklar
  draft: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 6, paddingHorizontal: 4 },
  draftDate: { fontFamily: fonts.serif, fontSize: 18, color: colors.forest },
  draftCta: { fontFamily: fonts.sansHeavy, fontSize: 13.5, color: colors.earth, marginTop: 4 },

  // son sayfa
  endBody: { alignItems: 'center', gap: 14 },
});
