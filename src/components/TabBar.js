import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const tabs = [
  { id: 'orcamento', label: 'Orçamento', icon: 'calculator-variant' },
  { id: 'historico', label: 'Histórico', icon: 'history' },
  { id: 'macro', label: 'Macro', icon: 'chart-bar' } // Ícone ajustado
];

export default function TabBar({ activeTab, onChangeTab, isDarkMode }) {
  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            activeOpacity={0.7}
            onPress={() => onChangeTab(tab.id)}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={26}
              color={isActive ? '#2563eb' : isDarkMode ? '#64748b' : '#94a3b8'}
            />
            <Text style={[
              styles.label,
              isActive && styles.activeLabel,
              isDarkMode && styles.labelDark,
              isActive && isDarkMode && styles.activeLabelDark
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 32 : 16,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  containerDark: { backgroundColor: '#0f172a', shadowOpacity: 0.3 },
  tab: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  label: { marginTop: 4, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, color: '#94a3b8' },
  activeLabel: { color: '#2563eb' },
  labelDark: { color: '#64748b' },
  activeLabelDark: { color: '#3b82f6' }
});