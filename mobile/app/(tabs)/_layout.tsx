import { StyleSheet, View, Text } from 'react-native';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// ── Custom Tab Icon with active indicator dot ──────────────────────
function TabIcon({
  name,
  color,
  focused,
  label,
}: {
  name: any;
  color: string;
  focused: boolean;
  label: string;
}) {
  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        <IconSymbol size={22} name={name} color={focused ? '#0A0A0B' : color} />
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false, // نخفي اللابل الافتراضي ونعرضه داخل TabIcon
        tabBarStyle: {
          backgroundColor: '#111112',
          borderTopWidth: 1,
          borderTopColor: 'rgba(195, 216, 9, 0.1)',
          height: 72,
          paddingHorizontal: 12,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="house.fill" color={color} focused={focused} label="الرئيسية" />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="calendar.badge.clock" color={color} focused={focused} label="حجوزاتي" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person.fill" color={color} focused={focused} label="حسابي" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingTop: 8,
  },
  iconWrap: {
    width: 44,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconWrapActive: {
    backgroundColor: '#C3D809',
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: 'ElMessiri_600SemiBold',
    color: '#666',
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: '#C3D809',
  },
});
