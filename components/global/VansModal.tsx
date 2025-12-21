import React, { useRef } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  FlatList,
  Animated,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import BookingModal from "./BookingModal";
import { calculatePrice } from "@/utils/priceCalculator";

const ACCENT = "#fe9a00";
const DARK = "#0f172a";

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
  const [selectedVan, setSelectedVan] = React.useState<Van | null>(null);
  const [calculatedPrice, setCalculatedPrice] = React.useState<number>(0);
  const [bookingModalVisible, setBookingModalVisible] = React.useState(false);

  const handleBookVan = (van: Van, price: number) => {
    console.log("[VansModal] Opening BookingModal with:", {
      van,
      prefilledData,
      calculatedPrice: price,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    setSelectedVan(van);
    setCalculatedPrice(price);
    setTimeout(() => setBookingModalVisible(true), 300);
  };

  return (
    <>
      <Modal visible={visible && !bookingModalVisible} transparent animationType="slide">
        <View style={styles.container}>
          <BlurView intensity={90} tint="dark" style={styles.blurContainer}>
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Available Vans</Text>
                <Text style={styles.subtitle}>
                  {vans.length} vans match your criteria
                </Text>
              </View>
              <Pressable onPress={onEditForm} style={styles.editButton}>
                <Ionicons name="create-outline" size={20} color={ACCENT} />
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#e5e7eb" />
              </Pressable>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={ACCENT} />
                <Text style={styles.loadingText}>
                  Loading available vans...
                </Text>
              </View>
            ) : vans.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="car-outline" size={80} color={ACCENT} />
                <Text style={styles.emptyTitle}>No Vans Available</Text>
                <Text style={styles.emptySubtitle}>
                  Try adjusting your search criteria
                </Text>
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
                contentContainerStyle={{ paddingBottom: 20 }}
                ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
              />
            )}
          </BlurView>
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
        prefilledData={prefilledData ? { ...prefilledData, calculatedPrice } : undefined}
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
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  const imageSource =
    typeof van.image === "string" ? { uri: van.image } : van.image;

  const calculatedPrice = React.useMemo(() => {
    if (!prefilledData?.pickupDate || !prefilledData?.returnDate) {
      return van.showPrice || 0;
    }
    const startDate = new Date(prefilledData.pickupDate);
    const endDate = new Date(prefilledData.returnDate);
    
    if (prefilledData.pickupTime) {
      const [h, m] = prefilledData.pickupTime.split(':').map(Number);
      startDate.setHours(h, m, 0, 0);
    }
    if (prefilledData.returnTime) {
      const [h, m] = prefilledData.returnTime.split(':').map(Number);
      endDate.setHours(h, m, 0, 0);
    }
    
    const basePrice = calculatePrice(
      startDate,
      endDate,
      van.pricingTiers || [],
      van.extraHoursRate || 0
    );
    
    const pickupExtension = prefilledData.pickupExtensionFee || 0;
    const returnExtension = prefilledData.returnExtensionFee || 0;
    
    return basePrice + pickupExtension + returnExtension;
  }, [prefilledData, van]);

  return (
    <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ flex: 1 }}
      >
        <View style={styles.cardContent}>
          <View style={styles.imageWrapper}>
            <Image
              source={imageSource}
              style={styles.vanImage}
              contentFit="cover"
            />
            <LinearGradient
              colors={["rgba(0,0,0,0.6)", "transparent"]}
              style={styles.imageGradient}
            />
          </View>

          <View style={styles.cardInfo}>
            <Text style={styles.vanName} numberOfLines={1}>
              {van.name}
            </Text>
            <Text style={styles.vanCargo}>{van.cargo || "Modern van"}</Text>

            <View style={styles.specs}>
              <View style={styles.spec}>
                <Ionicons name="people-outline" size={14} color={ACCENT} />
                <Text style={styles.specText}>{van.seats}</Text>
              </View>
              <View style={styles.spec}>
                <Ionicons name="car-outline" size={14} color={ACCENT} />
                <Text style={styles.specText}>{van.doors}</Text>
              </View>
              <View style={styles.spec}>
                <Ionicons name="flame-outline" size={14} color={ACCENT} />
                <Text style={styles.specText}>{van.fuel}</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.price}>£{calculatedPrice}</Text>
                <Text style={styles.priceUnit}>total</Text>
              </View>

              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  Haptics.selectionAsync();
                  onBook(calculatedPrice);
                }}
                style={({ pressed }) => [
                  styles.bookBtn,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.bookBtnText}>Book Now</Text>
                <Ionicons name="arrow-forward" size={16} color={DARK} />
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
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  blurContainer: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#f9fafb",
  },
  subtitle: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 4,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(254,154,0,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.3)",
  },
  editButtonText: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: "700",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    color: "#9ca3af",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#f9fafb",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  card: {
    backgroundColor: "rgba(15,23,42,0.8)",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  cardContent: {
    flexDirection: "row",
    padding: 12,
    gap: 12,
  },
  imageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 16,
    overflow: "hidden",
  },
  vanImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cardInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  vanName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#f9fafb",
  },
  vanCargo: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  specs: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  spec: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  specText: {
    fontSize: 12,
    color: "#e5e7eb",
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: "900",
    color: "#f9fafb",
  },
  priceUnit: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "600",
  },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: ACCENT,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bookBtnText: {
    color: DARK,
    fontSize: 13,
    fontWeight: "700",
  },
});
