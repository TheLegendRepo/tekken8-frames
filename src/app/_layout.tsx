import { Link, Stack } from 'expo-router';
import { Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider } from '../store';
import { c } from '../theme';

export default function RootLayout() {
  return (
    <StoreProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#150a07' },
          headerTintColor: c.text,
          headerTitleStyle: { fontWeight: '900' },
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'T8 FRAMES',
            headerRight: () => (
              <Link href="/search" accessibilityLabel="Search all moves"><Text style={{ color: c.text, fontSize: 22 }}>🔍</Text></Link>
            ),
          }}
        />
        <Stack.Screen name="search" options={{ title: 'SEARCH' }} />
        <Stack.Screen name="character/[id]" options={{ title: '' }} />
        <Stack.Screen name="move/[id]" options={{ title: '' }} />
      </Stack>
    </StoreProvider>
  );
}
