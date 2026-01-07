import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Linking,
  Platform,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

// Premium color palette
const COLORS = {
  accent: "#FF9500",
  accentLight: "rgba(255, 149, 0, 0.15)",
  accentGlow: "rgba(255, 149, 0, 0.3)",
  accentDark: "#E68900",
  dark: "#0a0a0a",
  card: "rgba(30, 30, 35, 0.6)",
  cardBorder: "rgba(255, 255, 255, 0.08)",
  glass: "rgba(255, 255, 255, 0.05)",
  glassBorder: "rgba(255, 255, 255, 0.12)",
  text: "#FFFFFF",
  textSecondary: "rgba(255, 255, 255, 0.7)",
  textTertiary: "rgba(255, 255, 255, 0.4)",
  success: "#34C759",
  divider: "rgba(255, 255, 255, 0.08)",
};

const SOCIAL_LINKS = [
  {
    icon: "logo-instagram",
    url: "https://www.instagram.com/success.van.hire/#",
    color: "#E4405F",
  },
  {
    icon: "logo-facebook",
    url: "https://www.facebook.com/topvanhire",
    color: "#1877F2",
  },
  {
    icon: "logo-twitter",
    url: "https://twitter.com/MatinDiba?t=GKR1BWNSQK6yB2Rj4W5Jhg&s=09",
    color: "#1DA1F2",
  },
  {
    icon: "logo-whatsapp",
    url: "https://wa.me/447915193000?text=Hello%2C%20I%20need%20help!",
    color: "#25D366",
  },
  {
    icon: "logo-youtube",
    url: "https://youtube.com/channel/UCTSPTUFbkBJSHu5oLiXTJAQ",
    color: "#FF0000",
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Shimmer animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleCall = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL("tel:+442012345678");
  };

  const handleEmail = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL("mailto:support@successvanhire.com");
  };

  const handleSocialLink = async (url: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      {/* Background Glow Effects */}
      <View style={styles.backgroundDecor}>
        <Animated.View
          style={[
            styles.glowOrb,
            styles.glowOrb2,
            {
              opacity: shimmerAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.15, 0.3, 0.15],
              }),
            },
          ]}
        />
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Main Footer Card */}
        <BlurView intensity={30} tint="dark" style={styles.mainCard}>
          <LinearGradient
            colors={[
              "rgba(255,149,0,0.1)",
              "rgba(255,149,0,0.02)",
              "transparent",
            ]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.mainGradient}
          >
            {/* Logo Section */}
            <Animated.View
              style={[
                styles.logoSection,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <View style={styles.logoWrapper}>
                <View style={styles.logoGlow} />
                <Image
                  source={{
                    uri: "https://svh-bucket-s3.s3.eu-west-2.amazonaws.com/images/newww.png",
                  }}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.tagline}>Your trusted van hire partner</Text>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color="#FFD60A" />
                <Text style={styles.ratingText}>4.9</Text>
                <Text style={styles.ratingCount}>(2.5k reviews)</Text>
              </View>
            </Animated.View>

            {/* Contact Actions */}
            <View style={styles.contactSection}>
              <Text style={styles.sectionTitle}>Get in Touch</Text>
              <View style={styles.actionsRow}>
                <ActionButton
                  icon="call"
                  title="Call Us"
                  subtitle="+44 20 1234 5678"
                  onPress={handleCall}
                  isPrimary
                />
                <ActionButton
                  icon="mail"
                  title="Email Us"
                  subtitle="24/7 Support"
                  onPress={handleEmail}
                />
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerIcon}>
                <Ionicons name="car-sport" size={16} color={COLORS.accent} />
              </View>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Links */}
            <View style={styles.socialSection}>
              <Text style={styles.socialTitle}>Follow Us</Text>
              <View style={styles.socialRow}>
                {SOCIAL_LINKS.map((social, index) => (
                  <SocialButton
                    key={index}
                    social={social}
                    index={index}
                    onPress={() => handleSocialLink(social.url)}
                  />
                ))}
              </View>
            </View>
          </LinearGradient>
        </BlurView>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <BlurView intensity={20} tint="dark" style={styles.bottomBlur}>
            <View style={styles.bottomContent}>
              <View style={styles.copyrightRow}>
                <Ionicons name="heart" size={12} color={COLORS.accent} />
                <Text style={styles.copyright}>
                  © {currentYear} Success Van Hire
                </Text>
              </View>

              <Text style={styles.madeWith}>Made with ❤️ in London</Text>
            </View>
          </BlurView>
        </View>
      </Animated.View>
    </View>
  );
}

// Action Button Component
type ActionButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  isPrimary?: boolean;
};

function ActionButton({
  icon,
  title,
  subtitle,
  onPress,
  isPrimary,
}: ActionButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  return (
    <Animated.View
      style={[styles.actionWrapper, { transform: [{ scale: scaleAnim }] }]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.actionPressable}
      >
        {isPrimary ? (
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionGradient}
          >
            <View style={styles.actionIconPrimary}>
              <Ionicons name={icon} size={22} color={COLORS.dark} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitlePrimary}>{title}</Text>
              <Text style={styles.actionSubtitlePrimary}>{subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.dark} />
          </LinearGradient>
        ) : (
          <View style={styles.actionOutline}>
            <View style={styles.actionIcon}>
              <Ionicons name={icon} size={22} color={COLORS.accent} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{title}</Text>
              <Text style={styles.actionSubtitle}>{subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.accent} />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// Social Button Component
type SocialButtonProps = {
  social: { icon: string; url: string; color: string };
  index: number;
  onPress: () => void;
};

function SocialButton({ social, index, onPress }: SocialButtonProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: index * 80,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.socialWrapper,
        {
          opacity: scaleAnim,
          transform: [
            { scale: Animated.multiply(scaleAnim, pressAnim) },
            {
              translateY: scaleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.socialButton,
          {
            backgroundColor: `${social.color}15`,
            borderColor: `${social.color}30`,
          },
        ]}
      >
        <Ionicons
          name={social.icon as keyof typeof Ionicons.glyphMap}
          size={22}
          color={social.color}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 40,
    position: "relative",
  },
  backgroundDecor: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  glowOrb: {
    position: "absolute",
    borderRadius: 999,
  },
  glowOrb1: {
    width: 300,
    height: 300,
    top: -100,
    left: -100,
    backgroundColor: COLORS.accentGlow,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 100,
      },
    }),
  },
  glowOrb2: {
    width: 250,
    height: 250,
    bottom: 0,
    right: -80,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    ...Platform.select({
      ios: {
        shadowColor: "#6366f1",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 80,
      },
    }),
  },
  content: {
    gap: 16,
  },
  mainCard: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  mainGradient: {
    padding: 24,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  logoGlow: {
    position: "absolute",
    top: -10,
    left: -20,
    right: -20,
    bottom: -10,
    backgroundColor: COLORS.accentGlow,
    borderRadius: 100,
    opacity: 0.3,
  },
  logo: {
    width: 140,
    height: 100,
  },
  tagline: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  ratingText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },
  ratingCount: {
    color: COLORS.textTertiary,
    fontSize: 12,
    fontWeight: "500",
  },
  contactSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  actionsRow: {
    gap: 12,
  },
  actionWrapper: {
    borderRadius: 18,
    overflow: "hidden",
  },
  actionPressable: {
    borderRadius: 18,
    overflow: "hidden",
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  actionOutline: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 18,
  },
  actionIconPrimary: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.accentLight,
    justifyContent: "center",
    alignItems: "center",
  },
  actionContent: {
    flex: 1,
  },
  actionTitlePrimary: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: "800",
  },
  actionSubtitlePrimary: {
    color: "rgba(0,0,0,0.6)",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  actionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  actionSubtitle: {
    color: COLORS.textTertiary,
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  linksSection: {
    marginBottom: 28,
  },
  linksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickLinkWrapper: {
    width: "48%",
  },
  quickLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  quickLinkPressed: {
    backgroundColor: COLORS.accentLight,
    borderColor: COLORS.accent,
  },
  quickLinkText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.divider,
  },
  dividerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 16,
  },
  socialSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  socialTitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 16,
  },
  socialRow: {
    flexDirection: "row",
    gap: 14,
  },
  socialWrapper: {},
  socialButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  infoPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginBottom: 24,
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  infoPillText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  paymentSection: {
    alignItems: "center",
  },
  paymentTitle: {
    color: COLORS.textTertiary,
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 12,
  },
  paymentRow: {
    flexDirection: "row",
    gap: 12,
  },
  paymentMethod: {
    width: 44,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomBar: {
    borderRadius: 20,
    overflow: "hidden",
  },
  bottomBlur: {
    borderRadius: 20,
    overflow: "hidden",
  },
  bottomContent: {
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 12,
  },
  legalLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  legalLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  legalLinkPressed: {
    opacity: 0.6,
  },
  legalLinkText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  legalDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textTertiary,
  },
  copyrightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  copyright: {
    color: COLORS.textTertiary,
    fontSize: 13,
    fontWeight: "600",
  },
  madeWith: {
    color: COLORS.textTertiary,
    fontSize: 11,
    fontWeight: "500",
  },
});
