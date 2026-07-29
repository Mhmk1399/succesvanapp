// app/index.tsx
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import ReservationHero from "@/components/global/ReservationHero";
import HorizontalVanList from "@/components/home/HorizontalVanList";
import WhyUs from "@/components/home/WhyUs";
import FAQ from "@/components/home/FAQ";
import Footer from "@/components/global/Footer";
import ReservationForm from "@/components/global/ReservationForm";
import { useState, useEffect } from "react";
import { categoryService } from "@/services/categoryService";
import { Van } from "@/components/home/HorizontalVanList";
import { Category } from "@/types/type";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import GlassView from "@/components/global/GlassView";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = Dimensions.get("window");
  const [vans, setVans] = useState<Van[]>([]);
  const [fleetLoading, setFleetLoading] = useState(true);
  const [fleetError, setFleetError] = useState<string | null>(null);
  const [translateY] = useState(new Animated.Value(screenHeight));

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setFleetLoading(true);
    setFleetError(null);
    try {
      const result = await categoryService.getAll();
      if (result.success) {
        const mappedVans: Van[] = result.data
          .slice(0, 5)
          .map((cat: Category) => ({
            id: cat._id,
            name: cat.name,
            image: cat.image || require("@/assets/images/van.png"),
            seats: cat.seats || 2,
            fuel: cat.fuel || "Diesel",
            doors: cat.doors || 2,
            gear: cat.gear || "manual",
            pricePerHour: cat.showPrice,
            expert: cat.expert,
          }));
        setVans(mappedVans);
      } else {
        setFleetError("Fleet data is temporarily unavailable.");
      }
    } catch (error) {
      console.log("Load categories error:", error);
      setFleetError("Network issue while loading vans.");
    } finally {
      setFleetLoading(false);
    }
  };

  const closeModal = () => {
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      translateY.setValue(screenHeight); // Reset
    });
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#10182b", "#111827", "#080b12", "#0d111c"]}
        locations={[0, 0.34, 0.68, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.backgroundGrid} pointerEvents="none" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top, 14) + 10 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* <HomeTopBar
          onFleetPress={() => router.push("/vans")}
          onProfilePress={() => router.push("/register")}
        /> */}

        <View style={styles.heroFrame}>
          <ReservationHero />
        </View>

        <View style={styles.formLift}>
          <ReservationForm onCompleted={closeModal} />
        </View>

        <HomeActionStrip
          onBookPress={() => router.push("/vans")}
          onAccountPress={() => router.push("/dashboard")}
        />

        <SectionDivider label="Choose your van" icon="car-sport" />
        <HorizontalVanList
          vans={vans}
          loading={fleetLoading}
          error={fleetError}
          onSelectVan={(van) =>
            router.push({
              pathname: "/vans",
              params: { selectedVanId: van.id },
            })
          }
          onViewAll={() => router.push("/vans")}
        />

        <SectionDivider label="Why riders trust us" icon="shield-checkmark" />
        <WhyUs />

        <SectionDivider label="Need a quick answer?" icon="chatbubble-ellipses" />
        <FAQ />
        <Footer />
      </ScrollView>
    </View>
  );
}

type HomeTopBarProps = {
  onFleetPress: () => void;
  onProfilePress: () => void;
};

function HomeTopBar({ onFleetPress, onProfilePress }: HomeTopBarProps) {
  return (
    <View style={styles.topBarWrap}>
      <GlassView intensity={26} tint="dark" style={styles.topBarGlass}>
        <View style={styles.topBar}>
          <View style={styles.brandBlock}>
            <View style={styles.brandMark}>
              <Ionicons name="flash" size={17} color="#111827" />
            </View>
            <View>
              <Text style={styles.brandText}>Success Van Hire</Text>
              <Text style={styles.brandMeta}>London van booking</Text>
            </View>
          </View>

          <View style={styles.topBarActions}>
            <Pressable
              onPress={onFleetPress}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Ionicons name="car-sport-outline" size={19} color="#f8fafc" />
            </Pressable>
            <Pressable
              onPress={onProfilePress}
              style={({ pressed }) => [
                styles.iconButton,
                styles.profileButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Ionicons name="person-outline" size={18} color="#111827" />
            </Pressable>
          </View>
        </View>
      </GlassView>
    </View>
  );
}

type HomeActionStripProps = {
  onBookPress: () => void;
  onAccountPress: () => void;
};

function HomeActionStrip({
  onBookPress,
  onAccountPress,
}: HomeActionStripProps) {
  return (
    <View style={styles.actionStrip}>
      <QuickAction
        featured
        icon="car-sport-outline"
        label="Browse fleet"
        value="Compare vans"
        onPress={onBookPress}
      />
      <QuickAction
        icon="time-outline"
        label="Flexible hire"
        value="Daily, weekly, monthly"
        onPress={onBookPress}
      />
      <QuickAction
        icon="person-outline"
        label="My account"
        value="Login or register"
        onPress={onAccountPress}
      />
    </View>
  );
}

type QuickActionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
  featured?: boolean;
};

function QuickAction({
  icon,
  label,
  value,
  onPress,
  featured,
}: QuickActionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        featured && styles.quickActionFeatured,
        pressed && styles.quickActionPressed,
      ]}
    >
      <View
        style={[
          styles.quickIcon,
          featured ? styles.quickIconFeatured : styles.quickIconMuted,
        ]}
      >
        <Ionicons name={icon} size={18} color={featured ? "#111827" : "#ffb84d"} />
      </View>
      <Text style={styles.quickLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.quickValue} numberOfLines={1}>
        {value}
      </Text>
    </Pressable>
  );
}

type SectionDividerProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

function SectionDivider({ label, icon }: SectionDividerProps) {
  return (
    <View style={styles.sectionDivider}>
      <View style={styles.sectionLine} />
      <View style={styles.sectionPill}>
        <Ionicons name={icon} size={14} color="#ffb84d" />
        <Text style={styles.sectionText}>{label}</Text>
      </View>
      <View style={styles.sectionLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#080b12",
  },
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 120,
  },
  backgroundGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
    backgroundColor: "transparent",
    borderColor: "rgba(255,255,255,0.08)",
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  topBarWrap: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  topBarGlass: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  topBar: {
    minHeight: 64,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandBlock: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffb84d",
  },
  brandText: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "800",
  },
  brandMeta: {
    color: "rgba(248,250,252,0.58)",
    fontSize: 12,
    marginTop: 2,
  },
  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  profileButton: {
    backgroundColor: "#ffb84d",
    borderColor: "rgba(255,184,77,0.6)",
  },
  buttonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.84,
  },
  heroFrame: {
    marginHorizontal: 10,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.28,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 16 },
      },
      android: {
        elevation: 8,
      },
    }),
  },
  actionStrip: {
    marginTop: 14,
    marginHorizontal: 16,
    flexDirection: "row",
    gap: 10,
  },
  quickAction: {
    flex: 1,
    minHeight: 98,
    padding: 12,
    borderRadius: 18,
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.065)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  quickActionFeatured: {
    backgroundColor: "rgba(255,184,77,0.16)",
    borderColor: "rgba(255,184,77,0.28)",
  },
  quickActionPressed: {
    transform: [{ translateY: 1 }, { scale: 0.985 }],
    opacity: 0.88,
  },
  quickIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  quickIconFeatured: {
    backgroundColor: "#ffb84d",
  },
  quickIconMuted: {
    backgroundColor: "rgba(255,184,77,0.12)",
  },
  quickLabel: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 10,
  },
  quickValue: {
    color: "rgba(248,250,252,0.56)",
    fontSize: 11,
    fontWeight: "600",
  },
  formLift: {
    marginTop: 2,
  },
  sectionDivider: {
    marginTop: 24,
    marginBottom: 4,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  sectionPill: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  sectionText: {
    color: "rgba(248,250,252,0.72)",
    fontSize: 12,
    fontWeight: "700",
  },
});
