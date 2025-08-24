import '../../global.css';

import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <StatusBar style="auto" backgroundColor="#1e293b" /> 
      <Text className="text-green-300">Welcome Page</Text>
      <Link href="screens/Home" className="py-6">
        Go to Home
      </Link>
      <Link href="screens/About" className="py-6">
        Go to About
      </Link>
    </View>
  );
}
