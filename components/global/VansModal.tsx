import { calculatePrice } from "@/utils/priceCalculator";
import { Ionicons } from "@expo/vector-icons";
import GlassView from "@/components/global/GlassView";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import BookingModal from "./BookingModal";

const ACCENT = "#fe9a00";
const ACCENT_LIGHT = "#ffc04d";
const DARK = "#0f172a";
const SURFACE = "#07111c";
const SURFACE_LIGHT = "#0c1724";
const GREEN = "#10d63f";

type Van = {
  id: string;
  name: string;
  image: string | number;
  seats: number;
  fuel: string;
  expert: string;
  doors: number;
  gear?:
    | {
        availableTypes: ("manual" | "automatic")[];
        automaticExtraCost: number;
      }
    | string;
  showPrice?: number;
  pricingTiers?: { minDays: number; maxDays: number; pricePerDay: number }[];
  extraHoursRate?: number;
  cargo?: string;
  selloffer?: number;
  rules?: { key?: string; value?: string; _id?: string }[];
  requiredLicense?: string;
};

type PrefilledData = {
  office: string;
  category: string;
  pickupDate: string;
  returnDate: string;
  pickupTime: string;
  returnTime: string;
  driverAge: string;
  pickupExtensionFee: number;
  returnExtensionFee: number;
  startDateDisplay?: string;
  endDateDisplay?: string;
  calculatedPrice?: number;
};

type VansModalProps = {
  visible: boolean;
  vans: Van[];
  loading: boolean;
  onClose: () => void;
  onEditForm: () => void;
  prefilledData?: PrefilledData;
  onReservationComplete?: () => void;
};

export default function VansModal({
  visible,
  vans,
  loading,
  onClose,
  onEditForm,
  prefilledData,
  onReservationComplete,
}: VansModalProps) {
  const insets = useSafeAreaInsets();
  const [selectedVan, setSelectedVan] = React.useState<Van | null>(null);
  const [calculatedPrice, setCalculatedPrice] = React.useState<number>(0);
  const [bookingModalVisible, setBookingModalVisible] = React.useState(false);

  const handleBookVan = (van: Van, price: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    setSelectedVan(van);
    setCalculatedPrice(price);
    setTimeout(() => setBookingModalVisible(true), 300);
  };

  return (
    <>
      <Modal
        visible={visible && !bookingModalVisible}
        transparent
        animationType="slide"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <GlassView intensity={42} tint="dark" style={styles.blurContainer}>
            <LinearGradient
              colors={["#04080f", "#06101a", "#03070d"]}
              locations={[0, 0.48, 1]}
              style={StyleSheet.absoluteFill}
            />

            <View pointerEvents="none" style={styles.topAmbientGlow} />
            <View pointerEvents="none" style={styles.bottomAmbientGlow} />

            <View
              style={[
                styles.content,
                {
                  paddingTop: Math.max(insets.top, 18) + 10,
                  paddingBottom: Math.max(insets.bottom, 12),
                },
              ]}
            >
              <View style={styles.header}>
                <View style={styles.headerCopy}>
                  <Text style={styles.title}>Available Vans</Text>
                  <View style={styles.subtitleRow}>
                    <View style={styles.availabilityDot} />
                    <Text style={styles.subtitle}>
                      {vans.length} vans match your criteria
                    </Text>
                  </View>
                </View>

                <View style={styles.headerActions}>
                  <Pressable
                    onPress={onEditForm}
                    hitSlop={6}
                    style={({ pressed }) => [
                      styles.editButton,
                      pressed && styles.controlPressed,
                    ]}
                  >
                    <LinearGradient
                      colors={["rgba(254,154,0,0.18)", "rgba(254,154,0,0.05)"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <Ionicons name="create-outline" size={16} color={ACCENT} />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </Pressable>

                  <Pressable
                    onPress={onClose}
                    hitSlop={6}
                    style={({ pressed }) => [
                      styles.closeButton,
                      pressed && styles.controlPressed,
                    ]}
                  >
                    <Ionicons name="close" size={20} color="#d8e0ea" />
                  </Pressable>
                </View>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <View style={styles.loadingIconWrap}>
                    <ActivityIndicator size="large" color={ACCENT} />
                  </View>
                  <Text style={styles.loadingTitle}>
                    Finding available vans
                  </Text>
                  <Text style={styles.loadingText}>
                    Checking live availability and pricing...
                  </Text>
                </View>
              ) : vans.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconWrap}>
                    <Ionicons name="car-outline" size={42} color={ACCENT} />
                  </View>
                  <Text style={styles.emptyTitle}>No Vans Available</Text>
                  <Text style={styles.emptySubtitle}>
                    Try adjusting your search criteria
                  </Text>
                  <Pressable
                    onPress={onEditForm}
                    style={({ pressed }) => [
                      styles.emptyAction,
                      pressed && styles.controlPressed,
                    ]}
                  >
                    <Text style={styles.emptyActionText}>Edit search</Text>
                    <Ionicons name="arrow-forward" size={16} color={DARK} />
                  </Pressable>
                </View>
              ) : (
                <FlatList
                  data={vans}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item, index }) => (
                    <VanCard
                      van={item}
                      index={index}
                      onBook={(price) => handleBookVan(item, price)}
                      prefilledData={prefilledData}
                    />
                  )}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                  ItemSeparatorComponent={() => (
                    <View style={styles.cardSeparator} />
                  )}
                />
              )}
            </View>
          </GlassView>
        </View>
      </Modal>

      <BookingModal
        visible={bookingModalVisible}
        van={selectedVan || null}
        onClose={() => {
          setBookingModalVisible(false);
          setSelectedVan(null);
          setCalculatedPrice(0);
        }}
        prefilledData={
          prefilledData ? { ...prefilledData, calculatedPrice } : undefined
        }
        onReservationComplete={onReservationComplete}
      />
    </>
  );
}

type VanCardProps = {
  van: Van;
  index: number;
  onBook: (price: number) => void;
  prefilledData?: PrefilledData;
};

function VanCard({ van, index, onBook, prefilledData }: VanCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 400,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.985,
      tension: 280,
      friction: 18,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 240,
      friction: 16,
      useNativeDriver: true,
    }).start();
  };

  const imageSource =
    typeof van.image === "string" ? { uri: van.image } : van.image;

  const { calculatedPrice, originalPrice, hasDiscount } = React.useMemo(() => {
    if (!prefilledData?.pickupDate || !prefilledData?.returnDate) {
      return {
        calculatedPrice: van.showPrice || 0,
        originalPrice: 0,
        hasDiscount: false,
      };
    }
    const startDate = new Date(prefilledData.pickupDate);
    const endDate = new Date(prefilledData.returnDate);

    if (prefilledData.pickupTime) {
      const [h, m] = prefilledData.pickupTime.split(":").map(Number);
      startDate.setHours(h, m, 0, 0);
    }
    if (prefilledData.returnTime) {
      const [h, m] = prefilledData.returnTime.split(":").map(Number);
      endDate.setHours(h, m, 0, 0);
    }

    const sellOffer = van.selloffer;
    console.log(sellOffer, "sellOffer");
    const hasDiscount = sellOffer && sellOffer > 0;

    // Calculate original price without discount
    const originalPrice = hasDiscount
      ? calculatePrice(
          startDate,
          endDate,
          van.pricingTiers || [],
          van.extraHoursRate || 0,
        )
      : 0;

    // Calculate discounted price
    const basePrice = calculatePrice(
      startDate,
      endDate,
      van.pricingTiers || [],
      van.extraHoursRate || 0,
      sellOffer,
    );

    const pickupExtension = prefilledData.pickupExtensionFee || 0;
    const returnExtension = prefilledData.returnExtensionFee || 0;

    return {
      calculatedPrice: basePrice + pickupExtension + returnExtension,
      originalPrice: hasDiscount
        ? originalPrice + pickupExtension + returnExtension
        : 0,
      hasDiscount,
    };
  }, [prefilledData, van]);

  return (
    <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(14,27,42,0.98)", "rgba(5,13,23,0.98)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.cardTopHighlight} />
      <View pointerEvents="none" style={styles.cardOrangeGlow} />

      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.cardPressable}
      >
        <View style={styles.cardContent}>
          <View style={styles.imageWrapper}>
            <LinearGradient
              colors={["#0b1724", "#07111b", "#040a11"]}
              style={StyleSheet.absoluteFill}
            />
            <View pointerEvents="none" style={styles.imageHalo} />
            <View pointerEvents="none" style={styles.imageFloor} />
            <Image
              source={imageSource}
              style={styles.vanImage}
              contentFit="cover"
              contentPosition="center"
              transition={220}
            />
            <LinearGradient
              pointerEvents="none"
              colors={[
                "rgba(4,10,17,0)",
                "rgba(4,10,17,0.05)",
                "rgba(4,10,17,0.5)",
              ]}
              locations={[0, 0.58, 1]}
              style={StyleSheet.absoluteFill}
            />
          </View>

          <View style={styles.cardInfo}>
            <View>
              <Text style={styles.vanName} numberOfLines={1}>
                {van.name}
              </Text>
              <Text style={styles.vanCargo} numberOfLines={1}>
                {van.expert || "Modern van"}
              </Text>
            </View>

            <View style={styles.specs}>
              <View style={styles.spec}>
                <Ionicons name="people-outline" size={12} color={ACCENT} />
                <Text style={styles.specText}>{van.seats}</Text>
              </View>

              <View style={styles.spec}>
                <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12.29 3.29L20 11v4.13a1 1 0 01-.86 1l-2.06.3A6.11 6.11 0 0012 21H5a1 1 0 01-1-1V4a1 1 0 011-1h6.59a1 1 0 01.7.29zM20 11H4M8 15h2"
                    stroke={ACCENT}
                    strokeWidth={1.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.specText}>{van.doors}</Text>
              </View>

              <View style={styles.spec}>
                <Ionicons name="flame-outline" size={12} color={ACCENT} />
                <Text style={styles.specText} numberOfLines={1}>
                  {van.fuel}
                </Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.priceBlock}>
                <Text style={styles.priceLabel}>total</Text>

                {hasDiscount && (
                  <View style={styles.discountRow}>
                    <View style={styles.discountBadge}>
                      <Ionicons name="pricetag" size={8} color="#ffffff" />
                      <Text style={styles.discountText}>
                        {van.selloffer || 0}% OFF
                      </Text>
                    </View>
                    <Text style={styles.originalPrice}>
                      £{originalPrice.toFixed(0)}
                    </Text>
                  </View>
                )}

                <Text style={styles.price}>£{calculatedPrice.toFixed(0)}</Text>
              </View>

              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  Haptics.selectionAsync();
                  onBook(calculatedPrice);
                }}
                hitSlop={4}
                style={({ pressed }) => [
                  styles.bookBtn,
                  pressed && styles.bookBtnPressed,
                ]}
              >
                <LinearGradient
                  colors={[ACCENT_LIGHT, ACCENT, "#f47f00"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View pointerEvents="none" style={styles.bookBtnGloss} />
                <Text style={styles.bookBtnText}>Book Now</Text>
                <View style={styles.bookBtnIcon}>
                  <Ionicons name="arrow-forward" size={13} color="#ffffff" />
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.76)",
  },
  blurContainer: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "rgba(2,6,12,0.98)",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  topAmbientGlow: {
    position: "absolute",
    top: -100,
    left: 18,
    width: 240,
    height: 180,
    borderRadius: 120,
    backgroundColor: "rgba(254,154,0,0.075)",
  },
  bottomAmbientGlow: {
    position: "absolute",
    bottom: -80,
    right: -110,
    width: 260,
    height: 220,
    borderRadius: 130,
    backgroundColor: "rgba(33,94,150,0.08)",
  },
  header: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: "#ffffff",
    fontSize: 23,
    lineHeight: 27,
    fontWeight: "900",
    letterSpacing: -0.55,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
    ...Platform.select({
      ios: {
        shadowColor: GREEN,
        shadowOpacity: 0.72,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 0 },
      },
      android: { elevation: 2 },
    }),
  },
  subtitle: {
    flexShrink: 1,
    color: "rgba(220,229,239,0.62)",
    fontSize: 10.5,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editButton: {
    height: 38,
    minWidth: 68,
    paddingHorizontal: 12,
    borderRadius: 11,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.42)",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 2 },
    }),
  },
  editButtonText: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: "900",
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.065)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  controlPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.96 }],
  },
  listContent: {
    paddingBottom: 20,
  },
  cardSeparator: {
    height: 9,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  loadingIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.09)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.2)",
    marginBottom: 16,
  },
  loadingTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "900",
  },
  loadingText: {
    color: "rgba(203,213,225,0.58)",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  emptyIconWrap: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.09)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.22)",
    marginBottom: 16,
  },
  emptyTitle: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900",
  },
  emptySubtitle: {
    color: "rgba(203,213,225,0.58)",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 5,
  },
  emptyAction: {
    minHeight: 42,
    marginTop: 18,
    paddingHorizontal: 18,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: ACCENT,
  },
  emptyActionText: {
    color: DARK,
    fontSize: 13,
    fontWeight: "900",
  },
  card: {
    minHeight: 116,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.24)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.28,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 4 },
    }),
  },
  cardTopHighlight: {
    position: "absolute",
    top: 0,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.11)",
  },
  cardOrangeGlow: {
    position: "absolute",
    right: -34,
    bottom: -44,
    width: 118,
    height: 100,
    borderRadius: 60,
    backgroundColor: "rgba(254,154,0,0.045)",
  },
  cardPressable: {
    flex: 1,
  },
  cardContent: {
    minHeight: 116,
    flexDirection: "row",
    padding: 8,
    gap: 10,
  },
  imageWrapper: {
    width: 100,
    minHeight: 100,
    borderRadius: 13,
    overflow: "hidden",
    backgroundColor: SURFACE_LIGHT,
    borderWidth: 1,
    borderColor: "rgba(113,145,176,0.09)",
  },
  imageHalo: {
    position: "absolute",
    width: 92,
    height: 70,
    borderRadius: 46,
    right: 4,
    bottom: 15,
    backgroundColor: "rgba(76,128,177,0.12)",
  },
  imageFloor: {
    position: "absolute",
    left: 12,
    right: 10,
    bottom: 14,
    height: 10,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  vanImage: {
    width: "100%",
    height: "100%",
    transform: [{ scale: 1.03 }],
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
    paddingBottom: 1,
    justifyContent: "space-between",
  },
  vanName: {
    color: "#f8fafc",
    fontSize: 14,
    lineHeight: 17,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  vanCargo: {
    color: "rgba(212,222,232,0.6)",
    fontSize: 9.5,
    lineHeight: 12,
    fontWeight: "600",
    marginTop: 1,
  },
  specs: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 5,
  },
  spec: {
    minHeight: 22,
    maxWidth: 86,
    paddingHorizontal: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  specText: {
    flexShrink: 1,
    color: "rgba(226,232,240,0.76)",
    fontSize: 8.5,
    fontWeight: "800",
    textTransform: "lowercase",
  },
  cardFooter: {
    minHeight: 39,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 6,
    marginTop: 5,
  },
  priceBlock: {
    flex: 1,
    minWidth: 0,
    justifyContent: "flex-end",
  },
  priceLabel: {
    color: "rgba(203,213,225,0.54)",
    fontSize: 8,
    lineHeight: 9,
    fontWeight: "700",
    textTransform: "lowercase",
  },
  price: {
    color: GREEN,
    fontSize: 18,
    lineHeight: 20,
    fontWeight: "900",
    letterSpacing: -0.35,
    ...Platform.select({
      ios: {
        shadowColor: GREEN,
        shadowOpacity: 0.12,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 0 },
      },
    }),
  },
  discountRow: {
    minHeight: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
    marginBottom: 1,
  },
  originalPrice: {
    color: "rgba(203,213,225,0.52)",
    fontSize: 9,
    fontWeight: "700",
    textDecorationLine: "line-through",
  },
  discountBadge: {
    minHeight: 15,
    paddingHorizontal: 5,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#ef3340",
  },
  discountText: {
    color: "#ffffff",
    fontSize: 7.5,
    fontWeight: "900",
  },
  bookBtn: {
    minWidth: 96,
    height: 36,
    paddingLeft: 14,
    paddingRight: 5,
    borderRadius: 13,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 7,
    borderWidth: 1,
    borderColor: "rgba(255,225,166,0.44)",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOpacity: 0.22,
        shadowRadius: 7,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 3 },
    }),
  },
  bookBtnPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
  bookBtnGloss: {
    position: "absolute",
    top: 2,
    left: 10,
    right: 10,
    height: 9,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  bookBtnText: {
    color: DARK,
    fontSize: 10.5,
    fontWeight: "900",
  },
  bookBtnIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b1725",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
});
