// components/AudioButton.jsx
import React, { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

/**
 * Plays audio recitation for an ayah when audioUrl is present. Gracefully
 * hides itself (renders nothing) when there is no audio to play, so it
 * never crashes on missing data.
 */
export default function AudioButton({ audioUrl }) {
  const { colors } = useApp();
  const [status, setStatus] = useState('idle'); // idle | loading | playing | error
  const soundRef = useRef(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  if (!audioUrl) {
    return null;
  }

  const handlePress = async () => {
    try {
      if (status === 'playing') {
        if (soundRef.current) {
          await soundRef.current.pauseAsync();
        }
        setStatus('idle');
        return;
      }

      if (soundRef.current) {
        await soundRef.current.playAsync();
        setStatus('playing');
        return;
      }

      setStatus('loading');
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true },
        (playbackStatus) => {
          if (playbackStatus.didJustFinish) {
            setStatus('idle');
          }
        }
      );
      soundRef.current = sound;
      setStatus('playing');
    } catch (e) {
      console.warn('AudioButton: playback failed', e);
      setStatus('error');
    }
  };

  const iconName =
    status === 'playing' ? 'pause-circle-outline' : 'play-circle-outline';
  const label =
    status === 'error' ? 'Unavailable' : status === 'playing' ? 'Playing' : 'Listen';

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={status === 'loading' || status === 'error'}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {status === 'loading' ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Ionicons
          name={iconName}
          size={20}
          color={status === 'error' ? colors.muted : colors.primary}
        />
      )}
      <Text
        style={[
          styles.label,
          { color: status === 'error' ? colors.muted : colors.primary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
});
