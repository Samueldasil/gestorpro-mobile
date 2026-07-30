import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LogoBadge({ size = 40, isDarkMode = false, onPress }) {
  const badgeSize = size;
  const iconSize = size * 0.55;

  const badge = (
    <View
      style={[
        styles.badge,
        { width: badgeSize, height: badgeSize, borderRadius: badgeSize * 0.25 },
        isDarkMode && styles.badgeDark,
      ]}
    >
      <MaterialCommunityIcons name="finance" size={iconSize} color="#ffffff" />
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {badge}
      </TouchableOpacity>
    );
  }

  return badge;
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-6deg' }],
    shadowColor: '#2563eb',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  badgeDark: {
    backgroundColor: '#1d4ed8',
  },
});