import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.75;
const CARD_SPACING = 16;
const ACCENT = "#fe9a00";
const DARK = "#0f172a";

export type Van = {
  id: string;
  name: string;
  image: string | number;
  seats: number;
  fuel: string;
  doors: number;
  gear:
    | string
    | {
        availableTypes: ("manual" | "automatic")[];
        automaticExtraCost: number;
      };
  pricePerHour: number;
  cargo?: string;
};

type HorizontalVanListProps = {
  vans: Van[];
  onSelectVan?: (van: Van) => void;
  onViewAll?: () => void;
};

export default function HorizontalVanList({
  vans,
  onSelectVan,
  onViewAll,
}: HorizontalVanListProps) {
  if (!vans || vans.length === 0) return null;

  const scrollX = useRef(new Animated.Value(0)).current;

  const renderItem = ({ item, index }: { item: Van; index: number }) => {
    const inputRange = [
      (index - 1) * (CARD_WIDTH + CARD_SPACING),
      index * (CARD_WIDTH + CARD_SPACING),
      (index + 1) * (CARD_WIDTH + CARD_SPACING),
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: "clamp",
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: "clamp",
    });

    return (
      <VanCard
        van={item}
        index={index}
        scale={scale}
        opacity={opacity}
        onPress={() => {
          Haptics.selectionAsync();
          onSelectVan?.(item);
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Featured Vans</Text>
          <Text style={styles.subtitle}>Handpicked for you</Text>
        </View>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            onViewAll?.();
          }}
          style={styles.viewAllButton}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="arrow-forward" size={16} color={ACCENT} />
        </Pressable>
      </View>

      <Animated.FlatList
        data={vans}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        decelerationRate="fast"
        contentContainerStyle={{
          paddingHorizontal: 10,
          paddingVertical: 8,
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        nestedScrollEnabled
      />
    </View>
  );
}

type VanCardProps = {
  van: Van;
  index: number;
  scale: Animated.AnimatedInterpolation<number>;
  opacity: Animated.AnimatedInterpolation<number>;
  onPress?: () => void;
};

function VanCard({ van, index, scale, opacity, onPress }: VanCardProps) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const entranceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entranceAnim, {
      toValue: 1,
      delay: index * 100,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const imageSource =
    typeof van.image === "string" ? { uri: van.image } : van.image;

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          transform: [
            { scale: Animated.multiply(scale, pressScale) },
            { scale: entranceAnim },
          ],
          opacity: Animated.multiply(opacity, entranceAnim),
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
      >
        <View style={styles.imageWrapper}>
          <Image source={imageSource} style={styles.image} contentFit="cover" />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.95)"]}
            locations={[0, 0.4, 1]}
            style={styles.gradient}
          />
        </View>

        <View style={styles.content}>
          {/* <View style={styles.badge}>
            <Ionicons name="star" size={12} color={ACCENT} />
            <Text style={styles.badgeText}>Featured</Text>
          </View> */}

          <Text style={styles.vanName} numberOfLines={1}>
            {van.name}
          </Text>

          <View style={styles.specs}>
            <View style={styles.specItem}>
              <Ionicons name="people" size={14} color={ACCENT} />
              <Text style={styles.specText}>{van.seats}</Text>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specItem}>
              <Ionicons name="car-sport" size={14} color={ACCENT} />
              <Text style={styles.specText}>
                {typeof van.gear === "object"
                  ? van.gear.availableTypes.join("/")
                  : van.gear === "manual,automatic"
                  ? "Auto"
                  : van.gear}
              </Text>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specItem}>
              <Ionicons name="flash" size={14} color={ACCENT} />
              <Text style={styles.specText}>{van.fuel}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <View>
              <Text style={styles.priceLabel}>From</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>£{van.pricePerHour}</Text>
                <Text style={styles.priceUnit}>/hr</Text>
              </View>
            </View>
            <View style={styles.bookIcon}>
              <Ionicons name="arrow-forward" size={20} color={DARK} />
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    color: "#f9fafb",
    fontSize: 24,
    fontWeight: "900",
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 2,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ACCENT,
    backgroundColor: "rgba(254, 154, 0, 0.1)",
  },
  viewAllText: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: "700",
  },
  cardContainer: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_SPACING / 2,
  },
  card: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.3)",
  },
  imageWrapper: {
    width: "100%",
    height: 250,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    padding: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(254,154,0,0.15)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.3)",
    marginBottom: 12,
  },
  badgeText: {
    color: ACCENT,
    fontSize: 11,
    fontWeight: "700",
  },
  vanName: {
    color: "#f9fafb",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 12,
  },
  specs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  specItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  specText: {
    color: "#e5e7eb",
    fontSize: 12,
    fontWeight: "600",
  },
  specDivider: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(148,163,184,0.3)",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  priceLabel: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  price: {
    color: "#f9fafb",
    fontSize: 26,
    fontWeight: "900",
  },
  priceUnit: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 3,
  },
  bookIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ACCENT,
    justifyContent: "center",
    alignItems: "center",
  },
});
