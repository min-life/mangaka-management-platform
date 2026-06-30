import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
// @ts-ignore
import './global.css';

import RootNavigator from '@/src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <GluestackUIProvider mode="dark">
        <StatusBar style="light" backgroundColor="#222831" />
        <RootNavigator />
      </GluestackUIProvider>
    </SafeAreaProvider>
  );
}
