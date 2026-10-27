import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

export default function ActionButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  secondary = false,
}) {
  const locked = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={locked}
      style={({ pressed }) => [
        styles.base,
        secondary ? styles.secondary : styles.primary,
        locked && styles.disabled,
        pressed && !locked && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? colors.green : '#FFFFFF'} />
      ) : (
        <Text style={[styles.text, secondary && styles.secondaryText]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  primary: { backgroundColor: colors.green },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: { opacity: 0.48 },
  pressed: { opacity: 0.8 },
  text: { color: '#FFFFFF', fontWeight: '700', fontSize: 16, textAlign: 'center' },
  secondaryText: { color: colors.green },
});
