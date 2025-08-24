import { Link } from 'expo-router';
import { View, Text } from 'react-native';

export default function About() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>🏠 About Screen</Text>
      <Link href="screens/Home">Go to Home</Link>
      <Link href="screens/About">Go to About</Link>
    </View>
  );
}
