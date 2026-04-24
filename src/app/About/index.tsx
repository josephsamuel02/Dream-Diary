import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useAppSelector } from '~/store/hooks';
import { selectThemeColors, selectBackgroundImage, selectBackgroundOpacity } from '~/store/slices/themeSlice';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function About() {
  const themeColors = useAppSelector(selectThemeColors);
  const backgroundImage = useAppSelector(selectBackgroundImage);
  const backgroundOpacity = useAppSelector(selectBackgroundOpacity);

  const features = [
    { icon: 'book', title: 'Daily Journaling', desc: 'Securely log your thoughts, memories, and dreams.' },
    { icon: 'color-palette', title: 'Personalize', desc: 'Customize themes to fit your unique style.' },
    { icon: 'stats-chart', title: 'Reflect', desc: 'Look back at your personal journey anytime.' },
  ];

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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Logo / Header Area */}
        <View style={styles.headerSection}>
          <View style={[styles.iconContainer, { backgroundColor: themeColors.accent + '20' }]}>
            <Ionicons name="moon" size={54} color={themeColors.accent} />
          </View>
          <Text style={[styles.appName, { color: themeColors.text }]}>Dream Diary</Text>
          <Text style={[styles.versionText, { color: themeColors.text, opacity: 0.5 }]}>
            Version 1.0.0
          </Text>
        </View>

        {/* Description Card */}
        <View style={[styles.card, { backgroundColor: themeColors.surface }]}>
          <Text style={[styles.cardTitle, { color: themeColors.text }]}>Our Mission</Text>
          <Text style={[styles.description, { color: themeColors.text }]}>
            Dream Diary was created to be your personal digital sanctuary. Capture the fleeting moments of your day, document your deep reflections, and log your nightly dreams before they fade. 
            We believe that consistent journaling brings clarity, creativity, and mindfulness to your everyday life.
          </Text>
        </View>

        {/* Features Card */}
        <View style={[styles.card, { backgroundColor: themeColors.surface }]}>
           <Text style={[styles.cardTitle, { color: themeColors.text, marginBottom: 16 }]}>What we offer</Text>
           {features.map((item, index) => (
             <View key={index} style={styles.featureRow}>
               <View style={[styles.featureIconContainer, { backgroundColor: themeColors.accent + '15' }]}>
                 <Ionicons name={item.icon as any} size={20} color={themeColors.accent} />
               </View>
               <View style={styles.featureTextContainer}>
                 <Text style={[styles.featureTitle, { color: themeColors.text }]}>{item.title}</Text>
                 <Text style={[styles.featureDesc, { color: themeColors.text }]}>{item.desc}</Text>
               </View>
             </View>
           ))}
        </View>

        {/* Links Area */}
        <View style={styles.linksContainer}>
          <TouchableOpacity style={[styles.linkButton, { backgroundColor: themeColors.surface }]} activeOpacity={0.7}>
            <Ionicons name="mail-outline" size={20} color={themeColors.accent} style={styles.linkIcon} />
            <Text style={[styles.linkText, { color: themeColors.text }]}>Contact Support</Text>
            <Ionicons name="chevron-forward" size={16} color={themeColors.text} style={{ opacity: 0.3 }} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.linkButton, { backgroundColor: themeColors.surface }]} activeOpacity={0.7}>
            <Ionicons name="document-text-outline" size={20} color={themeColors.accent} style={styles.linkIcon} />
            <Text style={[styles.linkText, { color: themeColors.text }]}>Terms & Privacy</Text>
            <Ionicons name="chevron-forward" size={16} color={themeColors.text} style={{ opacity: 0.3 }} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.footerText, { color: themeColors.text, opacity: 0.4 }]}>
          Made with ♥ for Dreamers
        </Text>
      </ScrollView>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginVertical: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontFamily: 'GreatVibes',
    fontSize: 42,
    marginBottom: 4,
  },
  versionText: {
    fontFamily: 'RobotoRegular',
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontFamily: 'PoppinsBold',
    fontSize: 18,
    marginBottom: 12,
  },
  description: {
    fontFamily: 'RobotoRegular',
    fontSize: 15,
    lineHeight: 24,
    opacity: 0.8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: 'PoppinsBold',
    fontSize: 15,
    marginBottom: 2,
  },
  featureDesc: {
    fontFamily: 'RobotoRegular',
    fontSize: 13,
    opacity: 0.7,
  },
  linksContainer: {
    marginTop: 8,
    marginBottom: 32,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  linkIcon: {
    marginRight: 12,
  },
  linkText: {
    flex: 1,
    fontFamily: 'RobotoMedium',
    fontSize: 15,
  },
  footerText: {
    textAlign: 'center',
    fontFamily: 'RobotoRegular',
    fontSize: 12,
  },
});
