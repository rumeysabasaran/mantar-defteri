/*
  TANIMA AKIŞI — Bir fotoğraf ve tanıma sonucu elimizdeyken:
  1. Adaylar  → kullanıcı türü seçer ya da "emin değilim" der
  2. Saha notu → isteğe bağlı bilgiler
  3. Kutlama  → yeni sayfa / tekrar / taslak

  Hem Tara ekranında hem Bekleyenler ekranında aynı bileşen kullanılır.
*/
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Polaroid from '../ui/Polaroid';
import Appear, { POLAROID_IN } from '../ui/Appear';
import Paper from '../ui/Paper';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import CandidateList from './CandidateList';
import FieldNotesForm from './FieldNotesForm';
import Celebration from './Celebration';
import { type } from '../ui/Typography';
import { usePhotoUri } from '../../data/hooks';
import { recordSighting } from '../../services/collection';
import { displayName } from '../../services/safety';
import { colors, fonts, radius } from '../../theme';

export default function IdentifyFlow({ photoId, result, onSaved, onCancel, onAgain, againLabel, onStepChange }) {
  const photoUri = usePhotoUri(photoId, 'full');
  const hasCandidates = result.isMushroom && result.candidates.length > 0;

  const [step, setStepState] = useState('choose'); // choose | notes | done
  const [selected, setSelected] = useState(hasCandidates ? 0 : null);
  const [asDraft, setAsDraft] = useState(!hasCandidates);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [outcome, setOutcome] = useState(null);

  const setStep = (s) => {
    setStepState(s);
    onStepChange?.(s); // ekran en üste kaydırılsın diye
  };

  async function save({ foundAt, notes }) {
    setBusy(true);
    setError('');
    try {
      const candidate = asDraft ? null : result.candidates[selected];
      const res = await recordSighting({ photoId, candidate, candidates: result.candidates, notes, foundAt });
      await onSaved?.(res);
      setOutcome(res);
      setStep('done');
    } catch (err) {
      console.error(err);
      setError('Kaydedilemedi. Lütfen tekrar dene.');
    } finally {
      setBusy(false);
    }
  }

  if (step === 'done') {
    return <Celebration outcome={outcome} onAgain={onAgain} againLabel={againLabel} />;
  }

  const chosen = !asDraft && selected !== null ? result.candidates[selected] : null;

  return (
    <View style={styles.wrap}>
      <Appear from={POLAROID_IN} style={styles.photo}>
        <Polaroid
          uri={photoUri}
          caption={step === 'notes' ? (chosen ? displayName(chosen) : 'Taslak') : undefined}
          width={step === 'notes' ? 170 : 240}
        />
      </Appear>

      {result.mock && (
        <View style={styles.mock}>
          <Icon name="info" size={16} color={colors.earth} style={{ marginTop: 2 }} />
          <Text style={styles.mockText}>Deneme modu: Bu sonuçlar sahte. Gerçek tanıma için API anahtarını ekle.</Text>
        </View>
      )}

      {step === 'choose' && (
        <Animated.View entering={FadeIn.duration(250)} style={styles.wrap}>
          {hasCandidates ? (
            <>
              <View style={{ gap: 4 }}>
                <Text style={type.h2}>Bu hangisi olabilir?</Text>
                <Text style={type.muted}>Fotoğraftan tür tespiti kesin değildir. En yakın görüneni seç.</Text>
              </View>
              <CandidateList
                candidates={result.candidates}
                selectedIndex={asDraft ? null : selected}
                onSelect={(i) => {
                  setSelected(i);
                  setAsDraft(false);
                }}
              />
            </>
          ) : (
            <Paper style={styles.empty}>
              <Icon name="mushroom" size={40} color={colors.moss} />
              <Text style={[type.muted, type.center]}>Bu fotoğrafta bir mantar seçemedim.</Text>
              {!!result.photoTip && <Text style={[type.small, type.center]}>{result.photoTip}</Text>}
            </Paper>
          )}

          {hasCandidates && !!result.photoTip && <Text style={type.small}>💡 {result.photoTip}</Text>}

          <View style={styles.actions}>
            {hasCandidates && (
              <Button block title="Bu tür, devam et" disabled={asDraft || selected === null} onPress={() => setStep('notes')} />
            )}
            <Button
              block
              variant="ghost"
              title="Emin değilim, taslak kaydet"
              onPress={() => {
                setAsDraft(true);
                setStep('notes');
              }}
            />
            <Button variant="text" title="Vazgeç" onPress={onCancel} />
          </View>
        </Animated.View>
      )}

      {step === 'notes' && (
        <Animated.View entering={FadeIn.duration(250)} style={{ gap: 10 }}>
          <FieldNotesForm
            onSubmit={save}
            onBack={() => setStep('choose')}
            busy={busy}
            submitLabel={asDraft ? 'Taslak olarak kaydet' : 'Deftere kaydet'}
          />
          {!!error && <Text style={styles.error}>{error}</Text>}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 18 },
  photo: { alignSelf: 'center', marginTop: 8 },
  mock: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.mustardSoft,
  },
  mockText: { flex: 1, fontFamily: fonts.sansBold, fontSize: 13.5, lineHeight: 19, color: colors.earth },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 26 },
  actions: { gap: 10 },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.earth, textAlign: 'center' },
});
