// components/home/ReservationHero.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
  Easing,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");
const ACCENT = "#fe9a00";

const VAN_IMAGES = [
  require("@/assets/images/van.png"),
  require("@/assets/images/van.png"),
  require("@/assets/images/van.png"),
]; // بعداً می‌تونی اینجا ون‌های مختلف بزاری

export default function ReservationHero() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const titleScale = useRef(new Animated.Value(0.8)).current;
  const descFade = useRef(new Animated.Value(0)).current;

  const vanX = useRef(new Animated.Value(width)).current; // شروع ون، خارج از سمت راست

  useEffect(() => {
    // انیمیشن ورود متن‌ها
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(titleScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(300),
      Animated.timing(descFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // انیمیشن لوپ حرکت ون: از راست میاد وسط، می‌ایسته، از چپ خارج میشه، دوباره از راست شروع می‌کنه
    Animated.loop(
      Animated.sequence([
        // شروع هر دور: ون از راست بیرون صفحه
        Animated.timing(vanX, {
          toValue: width,
          duration: 0,
          useNativeDriver: true,
        }),
        // حرکت از راست تا وسط
        Animated.timing(vanX, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // مکث وسط صفحه
        Animated.delay(800),
        // خروج به سمت چپ
        Animated.timing(vanX, {
          toValue: -width,
          duration: 800,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // برای سادگی، همیشه از تصویر اول استفاده می‌کنیم (بعداً می‌تونی ایندکس رو هم انیمیت کنی)
  const currentVan = VAN_IMAGES[0];

  return (
    <View style={styles.container}>
      {/* بک‌گراند گرادینت خیلی لطیف */}
      <LinearGradient
        colors={["#fe9a00", "#0f172b"]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.heroInner,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* لوگو */}
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/logo.png")}
            resizeMode="contain"
            style={styles.logo}
          />
        </View>

        {/* عنوان Success Van Hire */}
        <Animated.Text
          style={[
            styles.title,
            {
              transform: [{ scale: titleScale }],
            },
          ]}
        >
          Success Van Hire
        </Animated.Text>

        {/* توضیحات */}
        <Animated.Text
          style={[
            styles.description,
            {
              opacity: descFade,
            },
          ]}
        >
          Affordable, reliable & fast van rental services across London. Perfect
          for moving, deliveries and business needs.
        </Animated.Text>

        {/* ون وسط صفحه با انیمیشن حرکت افقی */}
        <View style={styles.vanOuter}>
          <Animated.View
            style={[
              styles.vanWrapper,
              {
                transform: [{ translateX: vanX }],
              },
            ]}
          >
            <Image
              source={currentVan}
              style={styles.vanImage}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* فیچرها */}
        <View style={styles.featureRow}>
          <Feature icon="checkmark-circle" label="24/7 Service" />
          <Feature icon="shield-checkmark" label="Fully Insured" />
          <Feature icon="flash" label="Instant Booking" />
          <Feature icon="car-sport" label="Modern Fleet" />
        </View>

        {/* تیزر زیر هرو */}
        <View style={styles.teaser}>
          <LinearGradient
            colors={[ACCENT + "18", ACCENT + "05"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.teaserGradient}
          >
            <Ionicons name="sparkles" size={16} color={ACCENT} />
            <Text style={styles.teaserText}>Here You Can book your van</Text>
            <Ionicons name="arrow-down" size={16} color={ACCENT} />
          </LinearGradient>
        </View>
      </Animated.View>
    </View>
  );
}

function Feature({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIconContainer}>
        <Ionicons name={icon} size={16} color={ACCENT} />
      </View>
      <Text style={styles.featureText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    minHeight: height * 0.6,
  },
  topGlow: {
    position: "absolute",
    top: -120,
    left: -80,
    right: -80,
    height: 220,
    opacity: 0.7,
  },
  bottomGlow: {
    position: "absolute",
    bottom: -140,
    left: -80,
    right: -80,
    height: 260,
    opacity: 0.7,
  },
  heroInner: {
    alignItems: "center",
    gap: 16,
    maxWidth: 600,
    zIndex: 10,
  },
  logoContainer: {
    marginBottom: 4,
  },
  logo: {
    width: 150,
    height: 90,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 1,
    color: "#fff",
    textShadowColor: "rgba(254, 154, 0, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  description: {
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 24,
    fontSize: 15,
    maxWidth: 520,
    paddingHorizontal: 8,
    marginTop: 6,
    marginBottom: 10,
  },

  // ون
  vanOuter: {
    height: 130,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginVertical: 4,
  },
  vanWrapper: {
    width: width, // چون انیمیشن تو کل عرض صفحه انجام میشه
    alignItems: "center",
    justifyContent: "center",
  },
  vanImage: {
    width: 220,
    height: 120,
  },

  featureRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 12,
    flexWrap: "wrap",
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(15,23,42,0.7)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  featureIconContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ACCENT + "25",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  teaser: {
    marginTop: 18,
    borderRadius: 999,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  teaserGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: ACCENT + "40",
    borderRadius: 999,
  },
  teaserText: {
    color: ACCENT,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
