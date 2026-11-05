/*
  KİTAP PENCERELERİ
  - PhotoSheet:   fotoğrafı büyütür, istenirse kapak fotoğrafı yapar
  - EditSheet:    bir buluşun saha notlarını düzenler ya da buluşu siler
  - DraftSheet:   taslağın türünü sonradan seçer (puan ve kutlama ile)
*/
import { useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Sheet from '../ui/Sheet';
import Polaroid from '../ui/Polaroid';
import Button from '../ui/Button';
import FieldNotesForm from '../scan/FieldNotesForm';
import CandidateList from '../scan/CandidateList';
import Celebration from '../scan/Celebration';
import { confirmAsync } from '../ui/confirm';
import { type } from '../ui/Typography';
import { usePhotoUri } from '../../data/hooks';
import { deleteSighting, resolveDraft, setCoverPhoto, updateSighting } from '../../services/collection';
import { colors } from '../../theme';

const { height: SCREEN_H } = Dimensions.get('window');

// ---------------------------------------------------------------- FOTOĞRAF

export function PhotoSheet({ photoId, species, onClose }) {
  const uri = usePhotoUri(photoId, 'full');
  const isCover = species?.coverPhotoId === photoId;
  const [ratio, setRatio] = useState(1); // genişlik / yükseklik: çerçeve fotoğrafa göre şekillenir

  return (
    <Sheet title="Fotoğraf" onClose={onClose} variant="photo">
      {({ close }) => (
        <>
          <View style={[styles.photoFrame, { aspectRatio: ratio, maxHeight: SCREEN_H * 0.7 }]}>
            {!!uri && (
              <Image
                source={{ uri }}
                style={styles.photo}
                contentFit="contain"
                transition={200}
                onLoad={(e) => e.source?.width && setRatio(e.source.width / e.source.height)}
              />
            )}
          </View>
          {species && !isCover && (
            <Button
              variant="ghost"
              icon="book"
              title="Sayfanın fotoğrafı yap"
              style={styles.photoBtn}
              onPress={async () => {
                await setCoverPhoto(species.id, photoId);
                close();
              }}
            />
          )}
        </>
      )}
    </Sheet>
  );
}

// ---------------------------------------------------------------- NOT DÜZENLEME

export function EditSheet({ sighting, onClose }) {
  const [busy, setBusy] = useState(false);

  return (
    <Sheet title="Saha notunu düzenle" onClose={onClose}>
      {({ close }) => (
        <>
          <FieldNotesForm
            bare
            initial={sighting}
            submitLabel="Kaydet"
            busy={busy}
            onSubmit={async ({ foundAt, notes }) => {
              setBusy(true);
              await updateSighting(sighting.id, { foundAt, notes });
              close();
            }}
          />
          <Button
            variant="text"
            color={colors.earth}
            title="Bu buluşu sil"
            disabled={busy}
            onPress={async () => {
              const ok = await confirmAsync('Buluş silinsin mi?', 'Bu buluş, fotoğrafı ve puanıyla birlikte silinecek. Bu geri alınamaz.');
              if (!ok) return;
              setBusy(true);
              await deleteSighting(sighting.id);
              close();
            }}
          />
        </>
      )}
    </Sheet>
  );
}

// ---------------------------------------------------------------- TASLAK

export function DraftSheet({ sighting, onClose }) {
  const uri = usePhotoUri(sighting.photoId, 'full');
  const candidates = sighting.candidates ?? [];
  const [selected, setSelected] = useState(candidates.length ? 0 : null);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState(null);

  async function confirm() {
    setBusy(true);
    try {
      setOutcome(await resolveDraft(sighting.id, candidates[selected]));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet title={outcome ? '' : 'Taslağın türünü seç'} onClose={onClose}>
      {({ close }) =>
        outcome ? (
          <Celebration outcome={outcome} onAgain={close} againLabel="Kitaba dön" againIcon="book" hideBookLink />
        ) : (
          <>
            <Polaroid uri={uri} width={180} tilt={-1.5} style={{ alignSelf: 'center', marginTop: 8 }} />
            {candidates.length > 0 ? (
              <>
                <Text style={type.muted}>Kayıt sırasında önerilen türler. Hangisi olduğuna karar verdin mi?</Text>
                <CandidateList candidates={candidates} selectedIndex={selected} onSelect={setSelected} />
                <Button block title="Bu tür, kitaba ekle" onPress={confirm} disabled={busy || selected === null} />
              </>
            ) : (
              <Text style={type.muted}>Bu fotoğraf için tür önerisi yok. Yeniden çekip taratmayı deneyebilirsin.</Text>
            )}
            <Button
              variant="text"
              color={colors.earth}
              title="Taslağı sil"
              disabled={busy}
              onPress={async () => {
                if (!(await confirmAsync('Taslak silinsin mi?', 'Bu taslak ve fotoğrafı silinecek.'))) return;
                await deleteSighting(sighting.id);
                close();
              }}
            />
          </>
        )
      }
    </Sheet>
  );
}

const styles = StyleSheet.create({
  photoFrame: {
    width: '100%',
    borderWidth: 8,
    borderColor: colors.paperWhite,
    backgroundColor: colors.paperWhite,
  },
  photo: { flex: 1 },
  photoBtn: { backgroundColor: colors.cream, alignSelf: 'center', marginTop: 8 },
});
