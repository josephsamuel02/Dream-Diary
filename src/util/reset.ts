import AsyncStorage from '@react-native-async-storage/async-storage';

async function clearAllStorageDevOnly() {
  await AsyncStorage.clear();
  console.log('AsyncStorage cleared — restart the app.');
}
export { clearAllStorageDevOnly };
