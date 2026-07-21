import React from 'react';
import { View, Text } from 'react-native';

export default function AdBanner({ height = 50, style }) {
  return (
    <View
      style={[
        {
          height,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.18)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.18)',
        },
        style,
      ]}
    >
      <Text
        style={{
          color: 'rgba(255,255,255,0.78)',
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.2,
        }}
      >
        Ad Placeholder (web preview)
      </Text>
    </View>
  );
}
