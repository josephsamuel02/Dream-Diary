import { View, Text, StyleSheet, Image } from 'react-native';
import { useAppSelector } from '~/store/hooks';
import { selectThemeColors, selectBackgroundImage, selectBackgroundOpacity } from '~/store/slices/themeSlice';

export default function About() {
  const themeColors = useAppSelector(selectThemeColors);
  const backgroundImage = useAppSelector(selectBackgroundImage);
  const backgroundOpacity = useAppSelector(selectBackgroundOpacity);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Background Image */}
      {backgroundImage && (
        <Image
          source={{ uri: backgroundImage }}
          style={[styles.backgroundImage, { opacity: backgroundOpacity }]}
          resizeMode="cover"
        />
      )}

      <View style={styles.content}>
        <View style={[styles.avatarContainer, { backgroundColor: themeColors.accent + '20' }]}>
          <Text style={styles.avatarEmoji}>👤</Text>
        </View>
        <Text style={[styles.title, { color: themeColors.text }]}>Profile</Text>
        <Text style={[styles.subtitle, { color: themeColors.text, opacity: 0.6 }]}>
          Coming soon...
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  avatarEmoji: {
    fontSize: 48,
  },
  title: {
    fontFamily: 'PoppinsBold',
    fontSize: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'RobotoRegular',
    fontSize: 14,
  },
});
