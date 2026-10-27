import { Ionicons } from "@expo/vector-icons";
import GlassView from "@/components/global/GlassView";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";

import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ACCENT, DARK } from "./BookingModal/constants";
import { styles } from "./BookingModal/styles";
import { BookingModalProps } from "./BookingModal/types";
import { useBookingModal } from "./BookingModal/useBookingModal";
import {
  getAvailableTimeSlots,
  getSelectedOffice,
  isDateDisabled as checkDateDisabled,
} from "./BookingModal/utils";
import { WorkingTime } from "@/types/type";
import { discountService } from "@/services/discountService";
import { useAuth } from "@/contexts/AuthContext";
import VanRulesModal, { hasVanRules } from "@/components/global/VanRulesModal";
import BookingCalendarChrome, {
  BOOKING_CALENDAR_THEME,
} from "@/components/global/BookingCalendarChrome";
import TermsConditionsModal from "@/components/global/TermsConditionsModal";
import {
  getAddonPriceForDays,
  getMatchingAddonTierIndex,
  isAddonAvailableForCategory,
  isAddonAvailableForDays,
} from "@/utils/bookingPrice";
import {
  addDaysToDateInput,
  formatDateInputInLondon,
  getMinimumPickupDateInput,
  syncServerClock,
} from "@/utils/londonTime";
import { getAddonImageUri } from "@/utils/addonImage";

const formatStoredDateShort = (displayDate?: string, isoDate?: string) => {
  const source = displayDate || isoDate;
  if (!source) return "";
  const datePart = source.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  const date =
    year && month && day ? new Date(year, month - 1, day) : new Date(source);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
};

const formatCalendarLabel = (date: Date | null) =>
  date
    ? date.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "No date selected yet";

const RETURN_ACCENT = "#38bdf8";

export default function BookingModal({
  visible,
  van,
  onClose,
  prefilledData,
  onReservationComplete,
  onAuthRedirect,
  resumeDraft,
}: BookingModalProps) {
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();
  const [detailsExpanded, setDetailsExpanded] = React.useState(false);
  const [discountExpanded, setDiscountExpanded] = React.useState(false);
  const [discountCode, setDiscountCode] = React.useState("");
  const [discountData, setDiscountData] = React.useState<any>(null);
  const [discountLoading, setDiscountLoading] = React.useState(false);
  const [discountError, setDiscountError] = React.useState("");
  const [rulesModalVisible, setRulesModalVisible] = React.useState(false);
  const [termsModalVisible, setTermsModalVisible] = React.useState(false);
  const previousRulesVanId = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (visible && resumeDraft) {
      setDiscountCode(resumeDraft.discountCode || "");
      setDiscountExpanded(Boolean(resumeDraft.discountCode));
      previousRulesVanId.current = resumeDraft.van.id;
    }
  }, [resumeDraft, visible]);

  React.useEffect(() => {
    const code = resumeDraft?.discountCode.trim();
    if (!visible || !code || !user?._id || !van?.id) return;

    let cancelled = false;
    setDiscountLoading(true);
    setDiscountError("");
    discountService.validateCode(code, user._id, van.id)
      .then((result) => {
        if (cancelled) return;
        setDiscountData(result.success ? result.data : null);
        setDiscountError(result.success ? "" : result.message || "Invalid code");
        setDiscountLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setDiscountError("Could not validate the discount code. Please try again.");
        setDiscountLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [resumeDraft, user?._id, van?.id, visible]);

  React.useEffect(() => {
    if (visible) {
      syncServerClock().catch(() => {});
    }
  }, [visible]);

  React.useEffect(() => {
    if (!visible || !van?.id) return;

    const shouldShowRules =
      previousRulesVanId.current !== van.id &&
      hasVanRules(van.rules, van.requiredLicense);

    previousRulesVanId.current = van.id;

    if (shouldShowRules) {
      const timer = setTimeout(() => setRulesModalVisible(true), 240);
      return () => clearTimeout(timer);
    }
  }, [van?.id, van?.requiredLicense, van?.rules, visible]);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    if (!user?._id) {
      setDiscountError("Please login to use discount codes");
      return;
    }
    if (!van?.id) return;

    setDiscountLoading(true);
    setDiscountError("");

    const result = await discountService.validateCode(
      discountCode.trim(),
      user._id,
      van.id,
    );

    setDiscountLoading(false);

    if (result.success) {
      setDiscountData(result.data);
      setDiscountError("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setDiscountError(result.message || "Invalid code");
      setDiscountData(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const {
    translateY,
    opacity,
    panResponder,
    name,
    setName,
    email,
    setEmail,
    focusedInput,
    setFocusedInput,
    errors,
    setErrors,
    pickupDate,
    pickupTime,
    returnDate,
    returnTime,
    isSubmitting,
    addons,
    addonSelections,
    setAddonSelections,
    offices,
    selectedOffice,
    setSelectedOffice,
    officeModalVisible,
    setOfficeModalVisible,
    driverAge,
    setDriverAge,
    message,
    setMessage,
    hasPrefilledData,
    handleClose,
    openDatePicker,
    openTimePicker,
    handleDateSelect,
    selectTime,
    handleSubmit,
    isLoadingData,
    dateRangeModalVisible,
    setDateRangeModalVisible,
    selectingDate,
    setSelectingDate,
    tempPickupDate,
    timeModalVisible,
    setTimeModalVisible,
    timeModalField,
    setTimeModalField,
    reservedSlots,
    bookingPrice,
    addonLineItems,
    minDriverAge,
    selectedGear,
    setSelectedGear,
    termsAccepted,
    setTermsAccepted,
  } = useBookingModal(
    visible,
    van,
    onClose,
    prefilledData,
    onReservationComplete,
    discountData,
    discountCode,
    resumeDraft,
    onAuthRedirect,
  );

  React.useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      setDetailsExpanded(true);
    }
  }, [errors]);

  const isReturnTimePicker = timeModalField === "returnTime";
  const timePhaseAccent = isReturnTimePicker ? RETURN_ACCENT : ACCENT;
  const timePhaseSlide = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!timeModalVisible) return;
    timePhaseSlide.setValue(isReturnTimePicker ? 26 : -26);
    Animated.spring(timePhaseSlide, {
      toValue: 0,
      tension: 74,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [isReturnTimePicker, timeModalVisible, timePhaseSlide]);

  if (!van) return null;

  const priceSummary = bookingPrice
    ? {
        actualDays: bookingPrice.actualDays,
        actualExtraHours: bookingPrice.actualExtraHours,
        totalDays: bookingPrice.totalDays,
        extraHours: bookingPrice.extraHours,
        extraHoursPrice: bookingPrice.extraHoursPrice,
        pickupExtFee: bookingPrice.pickupExtensionPrice,
        returnExtFee: bookingPrice.returnExtensionPrice,
        automaticGearCost: bookingPrice.gearExtraPrice,
        automaticGearDailyCost: bookingPrice.gearExtraCostPerDay,
        pricePerDay: bookingPrice.originalPricePerDay,
        hasSellOffer: Boolean(van.selloffer && van.selloffer > 0),
        discountedPricePerDay: bookingPrice.pricePerDay,
        totalSavings: bookingPrice.totalSavings,
        addonItems: addonLineItems.map((item) => ({
          id: item.id,
          label: item.name,
          price: item.price,
        })),
        discountAmount: bookingPrice.discountAmount,
        serviceCharge: bookingPrice.serviceCharge,
        total: bookingPrice.totalPrice,
        isSubmitDisabled:
          isSubmitting ||
          isLoadingData ||
          discountLoading ||
          !termsAccepted ||
          !pickupDate ||
          !returnDate ||
          !pickupTime ||
          !returnTime ||
          !van,
      }
    : null;

  const selectedOfficeData = getSelectedOffice(offices, selectedOffice);
  const dailyPrice = bookingPrice?.pricePerDay ?? Number(van.showPrice || 0);
  const totalPrice = priceSummary?.total ?? 0;
  const rentalDaysForAddons = bookingPrice?.totalDays || 1;
  const normalizedAddons = (
    (Array.isArray(addons) ? addons : []) as any[]
  ).filter(
    (addon) =>
      isAddonAvailableForCategory(addon, van?.id) &&
      isAddonAvailableForDays(addon, rentalDaysForAddons),
  );
  const purposeText =
    typeof van.purpose === "string" && van.purpose.trim()
      ? van.purpose
      : "Ford Transit Custom or similar";

  const toggleAddon = (addonId: string) => {
    setAddonSelections((current: any) => {
      const next = { ...(current || {}) };
      const addon = normalizedAddons.find(
        (item) => String(item._id ?? item.id ?? item.name) === addonId,
      );

      const selectedQuantity =
        typeof next[addonId] === "number"
          ? Number(next[addonId] || 0)
          : Number(next[addonId]?.quantity || 0);

      if (selectedQuantity > 0) {
        delete next[addonId];
        return next;
      }

      const addonType = addon?.type;
      if (addonType) {
        Object.keys(next).forEach((selectedId) => {
          if (selectedId === addonId) return;
          const selectedAddon = normalizedAddons.find(
            (item) => String(item._id ?? item.id ?? item.name) === selectedId,
          );
          if (selectedAddon?.type === addonType) {
            delete next[selectedId];
          }
        });
      }

      next[addonId] = {
        quantity: 1,
        selectedTierIndex: addon
          ? getMatchingAddonTierIndex(addon, rentalDaysForAddons)
          : undefined,
      };

      return next;
    });
  };

  const clearFieldError = (field: string) => {
    setErrors((current: any) => ({ ...(current || {}), [field]: "" }));
  };

  const handleDriverAgeChange = (value: string) => {
    setDriverAge(value.replace(/\D/g, "").slice(0, 2));
    clearFieldError("driverAge");
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={handleClose}
      >
        <Animated.View
          pointerEvents="none"
          style={[localStyles.backdrop, { opacity }]}
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <Animated.View
          style={[
            localStyles.modalContainer,
            {
              paddingTop: Math.max(insets.top, 10),
              transform: [{ translateY }],
            },
          ]}
        >
          <GlassView intensity={88} tint="dark" style={localStyles.sheet}>
            {Platform.OS === "android" && (
              <LinearGradient
                colors={["rgba(5,11,18,0.99)", "rgba(7,14,23,0.99)"]}
                style={StyleSheet.absoluteFill}
              />
            )}
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(35,51,68,0.24)", "rgba(5,10,17,0.04)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 0.45 }}
              style={StyleSheet.absoluteFill}
            />

            <View {...panResponder.panHandlers} style={localStyles.topHeader}>
              <Pressable
                onPress={handleClose}
                hitSlop={8}
                style={({ pressed }) => [
                  localStyles.circleButton,
                  pressed && localStyles.pressed,
                ]}
              >
                <Ionicons name="chevron-back" size={20} color="#dbe5ef" />
              </Pressable>

              <View style={localStyles.headerCopy}>
                <Text style={localStyles.headerTitle}>Complete Booking</Text>
                <Text style={localStyles.headerSubtitle}>
                  Almost there. Fill in the details below.
                </Text>
              </View>

              <Pressable
                onPress={handleClose}
                hitSlop={8}
                style={({ pressed }) => [
                  localStyles.circleButton,
                  pressed && localStyles.pressed,
                ]}
              >
                <Ionicons name="close" size={19} color="#dbe5ef" />
              </Pressable>
            </View>

            <KeyboardAvoidingView
              style={localStyles.keyboardArea}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={[
                  localStyles.scrollContent,
                  { paddingBottom: 142 + Math.max(insets.bottom, 8) },
                ]}
              >
                <View style={localStyles.vanSummaryCard}>
                  <View style={localStyles.vanImageBox}>
                    <Image
                      source={van.image}
                      contentFit="cover"
                      transition={220}
                      style={localStyles.vanImage}
                    />
                  </View>

                  <View style={localStyles.vanSummaryBody}>
                    <Text style={localStyles.vanName} numberOfLines={1}>
                      {van.name}
                    </Text>
                    <Text style={localStyles.vanPurpose} numberOfLines={1}>
                      {purposeText}
                    </Text>

                    <View style={localStyles.specRow}>
                      <SpecChip
                        icon="people-outline"
                        text={`${van.seats || 2} Seats`}
                      />
                      <SpecChip
                        icon="water-outline"
                        text={van.fuel || "Diesel"}
                      />
                      <SpecChip
                        icon="car-outline"
                        text={`${van.doors || 2} Doors`}
                      />
                    </View>

                    <View style={localStyles.priceMetaRow}>
                      <View style={localStyles.dayPriceRow}>
                        <Text style={localStyles.dayPrice}>
                          £{dailyPrice.toFixed(2)}
                        </Text>
                        <Text style={localStyles.dayPriceSuffix}>/ day</Text>
                        <Text style={localStyles.gearMeta}>
                          {" "}
                          • {selectedGear || "Manual"}
                        </Text>
                      </View>

                      {hasVanRules(van.rules, van.requiredLicense) && (
                        <Pressable
                          onPress={() => {
                            Haptics.selectionAsync();
                            setRulesModalVisible(true);
                          }}
                          style={({ pressed }) => [
                            localStyles.viewDetailsButton,
                            pressed && localStyles.pressed,
                          ]}
                        >
                          <Text style={localStyles.viewDetailsText}>
                            View details
                          </Text>
                          <Ionicons
                            name="chevron-forward"
                            size={13}
                            color={ACCENT}
                          />
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>

                <SectionTitle icon="location-outline" title="Pickup Location" />
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setOfficeModalVisible(true);
                  }}
                  style={({ pressed }) => [
                    localStyles.locationCard,
                    pressed && localStyles.pressed,
                    (errors as any)?.office && localStyles.fieldError,
                  ]}
                >
                  <View style={localStyles.locationIcon}>
                    <Ionicons
                      name="location-outline"
                      size={17}
                      color="#cbd5e1"
                    />
                  </View>
                  <View style={localStyles.locationCopy}>
                    <Text style={localStyles.locationName} numberOfLines={1}>
                      {selectedOfficeData?.name || "Choose pickup office"}
                    </Text>
                    <Text style={localStyles.locationAddress} numberOfLines={1}>
                      {(selectedOfficeData as any)?.address ||
                        "Select the most convenient London location"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={17} color="#8090a1" />
                </Pressable>

                <SectionTitle icon="calendar-outline" title="Pickup & Return" />
                <View style={localStyles.dateGrid}>
                  <DateTimeColumn
                    title="Pickup"
                    date={pickupDate}
                    time={pickupTime}
                    dateError={Boolean((errors as any)?.pickupDate)}
                    timeError={Boolean((errors as any)?.pickupTime)}
                    onDatePress={() => openDatePicker("pickup" as any)}
                    onTimePress={() => openTimePicker("pickupTime" as any)}
                  />
                  <DateTimeColumn
                    title="Return"
                    date={returnDate}
                    time={returnTime}
                    dateError={Boolean((errors as any)?.returnDate)}
                    timeError={Boolean((errors as any)?.returnTime)}
                    onDatePress={() => openDatePicker("return" as any)}
                    onTimePress={() => openTimePicker("returnTime" as any)}
                  />
                </View>

                <SectionTitle icon="person-outline" title="Driver Age" />
                <View
                  style={[
                    localStyles.textInputShell,
                    focusedInput === "driverAge" &&
                      localStyles.textInputFocused,
                    (errors as any)?.driverAge && localStyles.fieldError,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={17}
                    color={focusedInput === "driverAge" ? ACCENT : "#7f8d9c"}
                  />
                  <TextInput
                    value={driverAge}
                    onChangeText={handleDriverAgeChange}
                    onFocus={() => {
                      Haptics.selectionAsync();
                      setFocusedInput("driverAge" as any);
                    }}
                    onBlur={() => setFocusedInput(null)}
                    placeholder={`${minDriverAge}-80`}
                    placeholderTextColor="#647282"
                    keyboardType="number-pad"
                    inputMode="numeric"
                    maxLength={2}
                    style={localStyles.textInput}
                  />
                </View>
                {(errors as any)?.driverAge ? (
                  <Text style={localStyles.errorText}>
                    {(errors as any).driverAge}
                  </Text>
                ) : null}
                {false && (
                  <View style={localStyles.segmentRow}>
                    {["23-29", "30-69", "70+"].map((age) => {
                      const active = driverAge === age;
                      return (
                        <Pressable
                          key={age}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setDriverAge(age as any);
                          }}
                          style={({ pressed }) => [
                            localStyles.segmentButton,
                            active && localStyles.segmentButtonActive,
                            pressed && localStyles.pressed,
                          ]}
                        >
                          <Text
                            style={[
                              localStyles.segmentText,
                              active && localStyles.segmentTextActive,
                            ]}
                          >
                            {age === "70+" ? "70+" : age.replace("-", " – ")}
                          </Text>
                          {active && (
                            <View style={localStyles.segmentCheck}>
                              <Ionicons
                                name="checkmark"
                                size={10}
                                color={DARK}
                              />
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
                <View style={localStyles.ageHelperRow}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={13}
                    color="#22c55e"
                  />
                  <Text style={localStyles.ageHelperText}>
                    Driver must be {minDriverAge}-80 years old
                  </Text>
                </View>

                <SectionTitle icon="settings-outline" title="Gearbox" />
                <View style={localStyles.gearRow}>
                  {[
                    {
                      key: "manual",
                      title: "Manual",
                      meta: "Standard",
                      icon: "apps-outline",
                    },
                    {
                      key: "automatic",
                      title: "Automatic",
                      meta: van.gear && typeof van.gear === "object" && van.gear.availableTypes?.includes("automatic") && van.gear.availableTypes?.includes("manual") && Number(van.gear.automaticExtraCost) > 0
                        ? `+ £${Number(van.gear.automaticExtraCost).toFixed(2)} / day`
                        : "Included",
                      icon: "settings-outline",
                    },
                  ].map((gear) => {
                    const active = selectedGear === gear.key;
                    return (
                      <Pressable
                        key={gear.key}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSelectedGear(gear.key as any);
                        }}
                        style={({ pressed }) => [
                          localStyles.gearCard,
                          active && localStyles.gearCardActive,
                          pressed && localStyles.pressed,
                        ]}
                      >
                        <View
                          style={[
                            localStyles.gearIcon,
                            active && localStyles.gearIconActive,
                          ]}
                        >
                          <Ionicons
                            name={gear.icon as any}
                            size={17}
                            color={active ? ACCENT : "#8695a5"}
                          />
                        </View>
                        <View>
                          <Text
                            style={[
                              localStyles.gearTitle,
                              active && localStyles.gearTitleActive,
                            ]}
                          >
                            {gear.title}
                          </Text>
                          <Text style={localStyles.gearMetaText}>
                            {gear.meta}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {hasVanRules(van.rules, van.requiredLicense) && (
                  <Pressable
                    onPress={() => setRulesModalVisible(true)}
                    style={({ pressed }) => [
                      localStyles.rulesBanner,
                      pressed && localStyles.pressed,
                    ]}
                  >
                    <View style={localStyles.rulesShield}>
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={19}
                        color={ACCENT}
                      />
                    </View>
                    <View style={localStyles.rulesCopy}>
                      <Text style={localStyles.rulesTitle}>
                        Free cancellation until 24h before pickup
                      </Text>
                      <Text style={localStyles.rulesLink}>
                        View booking rules
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={17}
                      color="#8090a1"
                    />
                  </Pressable>
                )}

                <Pressable
                  onPress={() => setDetailsExpanded((current) => !current)}
                  style={({ pressed }) => [
                    localStyles.expandButton,
                    pressed && localStyles.pressed,
                  ]}
                >
                  <View style={localStyles.expandIcon}>
                    <Ionicons name="options-outline" size={17} color={ACCENT} />
                  </View>
                  <View style={localStyles.expandCopy}>
                    <Text style={localStyles.expandTitle}>
                      Contact details & extras
                    </Text>
                    <Text style={localStyles.expandMeta}>
                      Passenger details, add-ons, notes and discount code
                    </Text>
                  </View>
                  <Ionicons
                    name={detailsExpanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#94a3b8"
                  />
                </Pressable>

                {detailsExpanded && (
                  <View style={localStyles.detailsPanel}>
                    <View style={localStyles.inputGroup}>
                      <Text style={localStyles.inputLabel}>Full Name</Text>
                      <View
                        style={[
                          localStyles.textInputShell,
                          focusedInput === "name" &&
                            localStyles.textInputFocused,
                          (errors as any)?.name && localStyles.fieldError,
                        ]}
                      >
                        <Ionicons
                          name="person-outline"
                          size={17}
                          color="#7f8d9c"
                        />
                        <TextInput
                          value={name}
                          onChangeText={(value) => {
                            setName(value);
                            clearFieldError("name");
                          }}
                          onFocus={() => setFocusedInput("name" as any)}
                          onBlur={() => setFocusedInput(null)}
                          placeholder="Your full name"
                          placeholderTextColor="#647282"
                          style={localStyles.textInput}
                          autoCapitalize="words"
                        />
                      </View>
                      {(errors as any)?.name ? (
                        <Text style={localStyles.errorText}>
                          {(errors as any).name}
                        </Text>
                      ) : null}
                    </View>

                    <View style={localStyles.inputGroup}>
                      <Text style={localStyles.inputLabel}>Email Address</Text>
                      <View
                        style={[
                          localStyles.textInputShell,
                          focusedInput === "email" &&
                            localStyles.textInputFocused,
                          (errors as any)?.email && localStyles.fieldError,
                        ]}
                      >
                        <Ionicons
                          name="mail-outline"
                          size={17}
                          color="#7f8d9c"
                        />
                        <TextInput
                          value={email}
                          onChangeText={(value) => {
                            setEmail(value);
                            clearFieldError("email");
                          }}
                          onFocus={() => setFocusedInput("email" as any)}
                          onBlur={() => setFocusedInput(null)}
                          placeholder="you@example.com"
                          placeholderTextColor="#647282"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          style={localStyles.textInput}
                        />
                      </View>
                      {(errors as any)?.email ? (
                        <Text style={localStyles.errorText}>
                          {(errors as any).email}
                        </Text>
                      ) : null}
                    </View>

                    {isLoadingData ? (
                      <View style={localStyles.loadingRow}>
                        <ActivityIndicator size="small" color={ACCENT} />
                        <Text style={localStyles.loadingText}>
                          Loading available extras...
                        </Text>
                      </View>
                    ) : normalizedAddons.length > 0 ? (
                      <View style={localStyles.addonSection}>
                        <Text style={localStyles.inputLabel}>
                          Optional Extras
                        </Text>
                        {normalizedAddons.map((addon) => {
                          const addonId = String(
                            addon._id ?? addon.id ?? addon.name,
                          );
                          const selection = (addonSelections as any)?.[addonId];
                          const quantity =
                            typeof selection === "number"
                              ? Math.max(0, selection)
                              : Math.max(0, Number(selection?.quantity || 0));
                          const isSelected = quantity > 0;
                          const selectedTierIndex = getMatchingAddonTierIndex(
                            addon,
                            rentalDaysForAddons,
                          );
                          const addonPrice = getAddonPriceForDays(
                            addon,
                            rentalDaysForAddons,
                            1,
                            selectedTierIndex,
                          );
                          const addonImageUri = getAddonImageUri(addon);
                          const addonType = addon.type;
                          const isTypeDisabled =
                            !isSelected &&
                            Boolean(
                              addonType &&
                              Object.entries(addonSelections || {}).some(
                                ([selectedId, selectedValue]) => {
                                  const selectedQuantity =
                                    typeof selectedValue === "number"
                                      ? selectedValue
                                      : Number(
                                          (selectedValue as any)?.quantity || 0,
                                        );
                                  if (
                                    selectedId === addonId ||
                                    selectedQuantity <= 0
                                  ) {
                                    return false;
                                  }
                                  const selectedAddon = normalizedAddons.find(
                                    (item) =>
                                      String(
                                        item._id ?? item.id ?? item.name,
                                      ) === selectedId,
                                  );
                                  return selectedAddon?.type === addonType;
                                },
                              ),
                            );
                          return (
                            <View
                              key={addonId}
                              style={[
                                localStyles.addonRow,
                                isSelected && localStyles.addonRowSelected,
                                isTypeDisabled && localStyles.disabled,
                              ]}
                            >
                              <View style={localStyles.addonMedia}>
                                {addonImageUri ? (
                                  <Image
                                    source={{ uri: addonImageUri }}
                                    style={localStyles.addonImage}
                                    contentFit="cover"
                                    transition={180}
                                  />
                                ) : (
                                  <View style={localStyles.addonImageFallback}>
                                    <Ionicons
                                      name="add-circle-outline"
                                      size={19}
                                      color={ACCENT}
                                    />
                                  </View>
                                )}
                                {isSelected ? (
                                  <View style={localStyles.addonSelectedBadge}>
                                    <Ionicons
                                      name="checkmark"
                                      size={10}
                                      color={DARK}
                                    />
                                  </View>
                                ) : null}
                              </View>
                              <View style={localStyles.addonCopy}>
                                <Text
                                  style={localStyles.addonName}
                                  numberOfLines={1}
                                >
                                  {addon.name || "Optional extra"}
                                </Text>
                                {isTypeDisabled ? (
                                  <Text style={localStyles.addonLockedText}>
                                    Another option of this type is selected
                                  </Text>
                                ) : null}
                                <Text style={localStyles.addonPrice}>
                                  £{addonPrice.toFixed(2)}
                                </Text>
                              </View>
                              <Pressable
                                disabled={isTypeDisabled}
                                onPress={() => {
                                  Haptics.selectionAsync();
                                  toggleAddon(addonId);
                                }}
                                style={[
                                  localStyles.addonToggle,
                                  isSelected && localStyles.addonToggleActive,
                                  isTypeDisabled && localStyles.disabled,
                                ]}
                              >
                                <Ionicons
                                  name={
                                    isSelected
                                      ? "checkmark-circle"
                                      : "add-circle-outline"
                                  }
                                  size={15}
                                  color={isSelected ? DARK : ACCENT}
                                />
                                <Text
                                  style={[
                                    localStyles.addonToggleText,
                                    isSelected &&
                                      localStyles.addonToggleTextActive,
                                  ]}
                                >
                                  {isSelected ? "Selected" : "Select"}
                                </Text>
                              </Pressable>
                            </View>
                          );
                        })}
                      </View>
                    ) : null}

                    <View style={localStyles.inputGroup}>
                      <Text style={localStyles.inputLabel}>
                        Message (Optional)
                      </Text>
                      <TextInput
                        value={message}
                        onChangeText={setMessage}
                        placeholder="Anything we should know?"
                        placeholderTextColor="#647282"
                        multiline
                        textAlignVertical="top"
                        style={localStyles.messageInput}
                      />
                    </View>

                    <Pressable
                      onPress={() => setDiscountExpanded((current) => !current)}
                      style={localStyles.discountToggle}
                    >
                      <View style={localStyles.discountToggleLeft}>
                        <Ionicons
                          name="pricetag-outline"
                          size={17}
                          color={ACCENT}
                        />
                        <Text style={localStyles.discountToggleText}>
                          Discount code
                        </Text>
                      </View>
                      <Ionicons
                        name={discountExpanded ? "chevron-up" : "chevron-down"}
                        size={16}
                        color="#8a99a8"
                      />
                    </Pressable>

                    {discountExpanded && (
                      <View style={localStyles.discountArea}>
                        <View
                          style={[
                            localStyles.discountInputShell,
                            discountData && localStyles.discountSuccess,
                            discountError && localStyles.discountFailure,
                          ]}
                        >
                          <TextInput
                            value={discountCode}
                            onChangeText={(value) => {
                              setDiscountCode(value.toUpperCase());
                              setDiscountError("");
                            }}
                            placeholder="Enter code"
                            placeholderTextColor="#647282"
                            editable={!discountData && !discountLoading}
                            autoCapitalize="characters"
                            style={localStyles.discountInput}
                          />
                          {discountData && (
                            <Ionicons
                              name="checkmark-circle"
                              size={19}
                              color="#22c55e"
                            />
                          )}
                        </View>

                        {!discountData ? (
                          <Pressable
                            onPress={handleApplyDiscount}
                            disabled={discountLoading || !discountCode.trim()}
                            style={({ pressed }) => [
                              localStyles.applyButton,
                              (discountLoading || !discountCode.trim()) &&
                                localStyles.disabled,
                              pressed && localStyles.pressed,
                            ]}
                          >
                            {discountLoading ? (
                              <ActivityIndicator size="small" color={DARK} />
                            ) : (
                              <Text style={localStyles.applyText}>Apply</Text>
                            )}
                          </Pressable>
                        ) : (
                          <Pressable
                            onPress={() => {
                              setDiscountCode("");
                              setDiscountData(null);
                              setDiscountError("");
                            }}
                            style={localStyles.removeDiscountButton}
                          >
                            <Ionicons name="close" size={17} color="#ef4444" />
                          </Pressable>
                        )}
                      </View>
                    )}
                    {discountError ? (
                      <Text style={localStyles.errorText}>{discountError}</Text>
                    ) : null}
                    {discountData ? (
                      <Text style={localStyles.successText}>
                        {discountData.percentage}% discount applied
                      </Text>
                    ) : null}

                    {priceSummary && (
                      <View style={localStyles.breakdownCard}>
                        <View style={localStyles.breakdownHeader}>
                          <Text style={localStyles.breakdownTitle}>
                            Price breakdown
                          </Text>
                          <Text style={localStyles.breakdownTotal}>
                            £{priceSummary.total.toFixed(2)}
                          </Text>
                        </View>
                        <BreakdownRow
                          label={`Van hire • ${priceSummary.totalDays} day${
                            priceSummary.totalDays > 1 ? "s" : ""
                          }`}
                          value={`£${(
                            priceSummary.totalDays *
                            (priceSummary.hasSellOffer
                              ? priceSummary.discountedPricePerDay
                              : priceSummary.pricePerDay)
                          ).toFixed(2)}`}
                        />
                        {priceSummary.extraHoursPrice > 0 && (
                          <BreakdownRow
                            label={`Extra hours • ${priceSummary.extraHours}h`}
                            value={`£${priceSummary.extraHoursPrice.toFixed(2)}`}
                          />
                        )}
                        {priceSummary.automaticGearCost > 0 && (
                          <BreakdownRow
                            label="Automatic gearbox"
                            value={`£${priceSummary.automaticGearCost.toFixed(2)}`}
                          />
                        )}
                        {priceSummary.pickupExtFee > 0 && <BreakdownRow label="Pickup extension" value={`£${priceSummary.pickupExtFee.toFixed(2)}`} />}
                        {priceSummary.returnExtFee > 0 && <BreakdownRow label="Return extension" value={`£${priceSummary.returnExtFee.toFixed(2)}`} />}
                        {priceSummary.addonItems.map((item) => (
                          <BreakdownRow
                            key={item.id}
                            label={item.label}
                            value={`£${item.price.toFixed(2)}`}
                          />
                        ))}
                        <BreakdownRow label="Service charge" value={`£${priceSummary.serviceCharge.toFixed(2)}`} />
                        {discountData && (
                          <BreakdownRow
                            label={`Discount • ${discountData.percentage}%`}
                            value={`-£${priceSummary.discountAmount.toFixed(2)}`}
                            positive
                          />
                        )}
                      </View>
                    )}
                  </View>
                )}

                <Pressable
                  onPress={() => setTermsAccepted(!termsAccepted)}
                  style={localStyles.termsRow}
                >
                  <View
                    style={[
                      localStyles.checkbox,
                      termsAccepted && localStyles.checkboxActive,
                    ]}
                  >
                    {termsAccepted && (
                      <Ionicons name="checkmark" size={14} color={DARK} />
                    )}
                  </View>
                  <Text style={localStyles.termsText}>
                    I accept the{" "}
                    <Text
                      style={localStyles.termsLink}
                      onPress={() => setTermsModalVisible(true)}
                    >
                      Terms and Conditions
                    </Text>{" "}
                    and Privacy Policy
                  </Text>
                </Pressable>
              </ScrollView>
            </KeyboardAvoidingView>

            <GlassView
              intensity={28}
              tint="dark"
              style={[
                localStyles.fixedBottom,
                { paddingBottom: Math.max(insets.bottom, 10) },
              ]}
            >
              {Platform.OS === "android" && (
                <LinearGradient
                  colors={["rgba(6,12,20,0.98)", "rgba(8,15,24,0.99)"]}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <View style={localStyles.totalBlock}>
                <Text style={localStyles.totalLabel}>Total Price</Text>
                <Text style={localStyles.totalValue}>
                  {priceSummary ? `£${totalPrice.toFixed(2)}` : "—"}
                </Text>
                <Text style={localStyles.totalMeta}>Includes taxes & fees</Text>
              </View>

              <Pressable
                onPress={handleSubmit}
                disabled={
                  priceSummary ? priceSummary.isSubmitDisabled : isSubmitting
                }
                style={({ pressed }) => [
                  localStyles.confirmButton,
                  (priceSummary
                    ? priceSummary.isSubmitDisabled
                    : isSubmitting) && localStyles.disabled,
                  pressed && localStyles.confirmPressed,
                ]}
              >
                <LinearGradient
                  colors={["#ffb72f", ACCENT, "#ff8a00"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                {isSubmitting ? (
                  <ActivityIndicator color={DARK} size="small" />
                ) : (
                  <>
                    <Text style={localStyles.confirmText}>
                      {user && token ? "Confirm Booking" : "Sign in to book"}
                    </Text>
                    <View style={localStyles.confirmArrow}>
                      <Ionicons name="chevron-forward" size={16} color={DARK} />
                    </View>
                  </>
                )}
              </Pressable>
            </GlassView>
          </GlassView>
        </Animated.View>

        <Modal visible={dateRangeModalVisible} transparent animationType="fade">
          <Pressable
            style={styles.modalOverlay}
            onPress={() => {
              setDateRangeModalVisible(false);
              setSelectingDate("pickup");
            }}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={styles.calendarModalBox}
            >
              <BookingCalendarChrome
                phase={selectingDate}
                selectedLabel={formatCalendarLabel(
                  selectingDate === "pickup" ? pickupDate : returnDate,
                )}
                onClose={() => {
                  setDateRangeModalVisible(false);
                  setSelectingDate("pickup");
                }}
              >
                <Calendar
                  onDayPress={(day) => handleDateSelect(day.dateString)}
                  hideExtraDays
                  enableSwipeMonths
                  minDate={
                    selectingDate === "pickup"
                      ? getMinimumPickupDateInput()
                      : tempPickupDate?.toISOString().split("T")[0]
                  }
                  maxDate={
                    selectingDate === "return" && tempPickupDate
                      ? new Date(
                          tempPickupDate.getTime() + 30 * 24 * 60 * 60 * 1000,
                        )
                          .toISOString()
                          .split("T")[0]
                      : undefined
                  }
                  markedDates={(() => {
                    const marked: Record<string, any> = {};
                    const currentPickup = tempPickupDate || pickupDate;
                    if (
                      currentPickup &&
                      returnDate &&
                      selectingDate === "pickup"
                    ) {
                      const start = new Date(currentPickup);
                      const end = new Date(returnDate);
                      const current = new Date(start);
                      while (current <= end) {
                        const dateStr = current.toISOString().split("T")[0];
                        const isStart = current.getTime() === start.getTime();
                        const isEnd = current.getTime() === end.getTime();
                        marked[dateStr] = {
                          color:
                            isStart || isEnd ? ACCENT : "rgba(254,154,0,0.3)",
                          textColor: isStart || isEnd ? "#fff" : "#f9fafb",
                          startingDay: isStart,
                          endingDay: isEnd,
                        };
                        current.setDate(current.getDate() + 1);
                      }
                    } else if (currentPickup) {
                      marked[currentPickup.toISOString().split("T")[0]] = {
                        color: ACCENT,
                        textColor: "#ffffff",
                        startingDay: true,
                        endingDay: true,
                      };
                    }

                    // Mark disabled dates (London time-based restriction + office closed days)
                    const todayInput = formatDateInputInLondon();
                    const minAllowedDateInput = getMinimumPickupDateInput();

                    for (let i = 0; i < 60; i++) {
                      const dateStr = addDaysToDateInput(todayInput, i);
                      const checkDate = new Date(`${dateStr}T12:00:00Z`);

                      if (dateStr < minAllowedDateInput) {
                        marked[dateStr] = {
                          disabled: true,
                          disableTouchEvent: true,
                        };
                      } else if (selectingDate === "pickup") {
                        const office = getSelectedOffice(
                          offices,
                          selectedOffice,
                        );
                        if (office && checkDateDisabled(checkDate, office)) {
                          marked[dateStr] = {
                            disabled: true,
                            disableTouchEvent: true,
                          };
                        }
                      }
                    }

                    return marked;
                  })()}
                  markingType="period"
                  theme={BOOKING_CALENDAR_THEME}
                />
              </BookingCalendarChrome>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={timeModalVisible}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => {
            setTimeModalVisible(false);
            setTimeModalField(null);
          }}
        >
          <Pressable
            style={styles.timePickerOverlay}
            onPress={() => {
              setTimeModalVisible(false);
              setTimeModalField(null);
            }}
          >
            <Pressable
              onPress={(event) => event.stopPropagation()}
              style={[
                styles.timePickerSheet,
                isReturnTimePicker && styles.timePickerSheetReturn,
              ]}
            >
              <LinearGradient
                colors={
                  isReturnTimePicker
                    ? ["#102536", "#0b1826", "#07101c"]
                    : ["#131c2a", "#0c1522", "#07101c"]
                }
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
              />

              <View
                pointerEvents="none"
                style={[
                  styles.timePickerGlow,
                  isReturnTimePicker && styles.timePickerGlowReturn,
                ]}
              />
              <View style={styles.timePickerHandle} />

              <View style={styles.timePickerHeader}>
                <View style={styles.timePickerHeaderCopy}>
                  <Text
                    style={[
                      styles.timePickerTitle,
                      { color: timePhaseAccent },
                    ]}
                  >
                    {isReturnTimePicker ? "Return Time" : "Pickup Time"}
                  </Text>
                  <Text style={styles.timePickerSubtitle}>
                    {isReturnTimePicker
                      ? "Step 2 of 2 - choose when you'll bring it back"
                      : "Step 1 of 2 - choose when you'll collect the van"}
                  </Text>
                </View>

                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    setTimeModalVisible(false);
                    setTimeModalField(null);
                  }}
                  style={({ pressed }) => [
                    styles.timePickerClose,
                    isReturnTimePicker && styles.timePickerCloseReturn,
                    pressed && styles.timePickerPressed,
                  ]}
                >
                  <Ionicons name="close" size={18} color="#e8edf5" />
                </Pressable>
              </View>

              <View style={styles.timePickerPhaseRow}>
                <View
                  style={[
                    styles.timePickerPhasePill,
                    !isReturnTimePicker && styles.timePickerPhasePillActive,
                  ]}
                >
                  <Ionicons
                    name={
                      isReturnTimePicker
                        ? "checkmark-circle"
                        : "radio-button-on"
                    }
                    size={14}
                    color={!isReturnTimePicker ? ACCENT : "#22d37f"}
                  />
                  <Text
                    style={[
                      styles.timePickerPhaseText,
                      !isReturnTimePicker && styles.timePickerPhaseTextActive,
                    ]}
                  >
                    Pickup
                  </Text>
                </View>

                <View style={styles.timePickerPhaseConnector}>
                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color={isReturnTimePicker ? RETURN_ACCENT : "#64748b"}
                  />
                </View>

                <View
                  style={[
                    styles.timePickerPhasePill,
                    isReturnTimePicker &&
                      styles.timePickerPhasePillReturnActive,
                  ]}
                >
                  <Ionicons
                    name={
                      isReturnTimePicker ? "radio-button-on" : "ellipse-outline"
                    }
                    size={14}
                    color={isReturnTimePicker ? RETURN_ACCENT : "#94a3b8"}
                  />
                  <Text
                    style={[
                      styles.timePickerPhaseText,
                      isReturnTimePicker && styles.timePickerPhaseTextReturn,
                    ]}
                  >
                    Return
                  </Text>
                </View>
              </View>

              <Animated.View
                style={[
                  styles.timePickerAnimatedPane,
                  {
                    opacity: timePhaseSlide.interpolate({
                      inputRange: [-26, 0, 26],
                      outputRange: [0.76, 1, 0.76],
                    }),
                    transform: [{ translateX: timePhaseSlide }],
                  },
                ]}
              >
                {(() => {
                const office = getSelectedOffice(offices, selectedOffice);
                const dateToCheck =
                  timeModalField === "pickupTime" ? pickupDate : returnDate;
                const isPickup = timeModalField === "pickupTime";

                const slots =
                  office && dateToCheck
                    ? getAvailableTimeSlots(dateToCheck, office, isPickup)
                    : null;

                if (!slots?.slots?.length) {
                  return (
                    <View style={styles.timePickerEmpty}>
                      <View style={styles.timePickerEmptyIcon}>
                        <Ionicons
                          name="time-outline"
                          size={25}
                          color={timePhaseAccent}
                        />
                      </View>
                      <Text style={styles.timePickerEmptyTitle}>
                        No available time slots
                      </Text>
                      <Text style={styles.timePickerEmptyText}>
                        Please select another date or office.
                      </Text>
                    </View>
                  );
                }

                let times: string[] = slots.slots;

                // Existing logic: minimum six-hour return on same-day rentals.
                if (!isPickup && pickupDate && returnDate && pickupTime) {
                  const isSameDay =
                    pickupDate.toDateString() === returnDate.toDateString();

                  if (isSameDay) {
                    const [pH, pM] = pickupTime.split(":").map(Number);
                    const minReturnMinutes = pH * 60 + pM + 360;

                    times = times.filter((time) => {
                      const [rH, rM] = time.split(":").map(Number);
                      const returnMinutes = rH * 60 + rM;
                      return returnMinutes >= minReturnMinutes;
                    });
                  }
                }

                const dayName = [
                  "sunday",
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                ][dateToCheck?.getDay() || 0];

                const workingDay = office?.workingTime?.find(
                  (workingTime: WorkingTime) => workingTime.day === dayName,
                );

                const extension = isPickup
                  ? workingDay?.pickupExtension
                  : workingDay?.returnExtension;

                const isAllExtension = slots.normalStart === slots.normalEnd;

                const currentTime =
                  timeModalField === "pickupTime" ? pickupTime : returnTime;

                const readableDate = dateToCheck
                  ? dateToCheck.toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "Select date";

                const officeSecondaryText =
                  (office as any)?.address ||
                  (office as any)?.location ||
                  "Selected rental office";

                return (
                  <>
                    <View style={styles.timePickerContextRow}>
                      <View style={styles.timePickerContextCard}>
                        <View
                          style={[
                            styles.timePickerContextIcon,
                            isReturnTimePicker &&
                              styles.timePickerContextIconReturn,
                          ]}
                        >
                          <Ionicons
                            name="calendar-outline"
                            size={16}
                            color={timePhaseAccent}
                          />
                        </View>

                        <View style={styles.timePickerContextCopy}>
                          <Text
                            style={styles.timePickerContextValue}
                            numberOfLines={1}
                          >
                            {readableDate}
                          </Text>
                          <Text
                            style={styles.timePickerContextLabel}
                            numberOfLines={1}
                          >
                            {dateToCheck
                              ? dateToCheck.toLocaleDateString("en-GB", {
                                  weekday: "long",
                                })
                              : "Rental date"}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.timePickerContextCard}>
                        <View
                          style={[
                            styles.timePickerContextIcon,
                            isReturnTimePicker &&
                              styles.timePickerContextIconReturn,
                          ]}
                        >
                          <Ionicons
                            name="location-outline"
                            size={16}
                            color={timePhaseAccent}
                          />
                        </View>

                        <View style={styles.timePickerContextCopy}>
                          <Text
                            style={styles.timePickerContextValue}
                            numberOfLines={1}
                          >
                            {office?.name || "London Office"}
                          </Text>
                          <Text
                            style={styles.timePickerContextLabel}
                            numberOfLines={1}
                          >
                            {officeSecondaryText}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.timePickerLegend}>
                      <View style={styles.timePickerLegendDot} />
                      <Text style={styles.timePickerLegendText}>
                        {isReturnTimePicker
                          ? "Return slots available"
                          : "Pickup slots available"}
                      </Text>
                    </View>

                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      style={styles.timePickerScroll}
                      contentContainerStyle={styles.timePickerScrollContent}
                    >
                      <View style={styles.timePickerGrid}>
                        {times.map((time) => {
                          const isReserved = reservedSlots.some((slot) => {
                            if (isPickup) {
                              return time === slot.startTime;
                            }

                            return time === slot.endTime;
                          });

                          const isAvailable = !isReserved;
                          const isSelected = currentTime === time;

                          const isExtension =
                            Boolean(slots.specialDay?.extraPrice) ||
                            isAllExtension ||
                            Boolean(
                              slots.normalStart &&
                              slots.normalEnd &&
                              (time < slots.normalStart ||
                                time > slots.normalEnd),
                            );

                          const extensionPrice =
                            slots.specialDay?.extraPrice ||
                            slots.extensionRanges.find(
                              (range) =>
                                time >= range.startTime &&
                                time <= range.endTime,
                            )?.flatPrice ||
                            (isExtension && extension
                              ? extension.flatPrice
                              : 0);

                          return (
                            <View key={time} style={styles.timePickerCell}>
                              <Pressable
                                disabled={!isAvailable}
                                onPress={() => isAvailable && selectTime(time)}
                                style={({ pressed }) => [
                                  styles.timePickerSlot,
                                  isSelected && styles.timePickerSlotSelected,
                                  isSelected &&
                                    isReturnTimePicker &&
                                    styles.timePickerSlotReturnSelected,
                                  !isAvailable && styles.timePickerSlotDisabled,
                                  pressed &&
                                    isAvailable &&
                                    styles.timePickerSlotPressed,
                                ]}
                              >
                                {isSelected && (
                                  <LinearGradient
                                    pointerEvents="none"
                                    colors={
                                      isReturnTimePicker
                                        ? ["#67e8f9", RETURN_ACCENT, "#0ea5e9"]
                                        : ["#ffb000", ACCENT, "#ff8900"]
                                    }
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={StyleSheet.absoluteFill}
                                  />
                                )}

                                <View
                                  style={[
                                    styles.timePickerSlotDot,
                                    {
                                      backgroundColor: isAvailable
                                        ? isExtension
                                          ? "#fbbf24"
                                          : "#22d37f"
                                        : "#ef4444",
                                    },
                                  ]}
                                />

                                <Text
                                  style={[
                                    styles.timePickerSlotText,
                                    isSelected &&
                                      styles.timePickerSlotTextSelected,
                                  ]}
                                >
                                  {time}
                                </Text>
                              </Pressable>

                              {isExtension && extensionPrice > 0 && (
                                <Text
                                  style={[
                                    styles.timePickerExtensionPrice,
                                    isSelected &&
                                      styles.timePickerExtensionPriceSelected,
                                  ]}
                                >
                                  +£{extensionPrice.toFixed(2)}
                                </Text>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    </ScrollView>

                    <Pressable
                      onPress={() => {
                        setTimeModalVisible(false);
                        setTimeModalField(null);
                      }}
                      style={({ pressed }) => [
                        styles.timePickerConfirm,
                        isReturnTimePicker && styles.timePickerConfirmReturn,
                        pressed && styles.timePickerConfirmPressed,
                      ]}
                    >
                      <LinearGradient
                        colors={
                          isReturnTimePicker
                            ? ["#67e8f9", RETURN_ACCENT, "#0ea5e9"]
                            : ["#ffb000", ACCENT, "#ff8900"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.timePickerConfirmGradient}
                      >
                        <Text style={styles.timePickerConfirmText}>
                          {isReturnTimePicker
                            ? "Confirm Return Time"
                            : "Confirm Pickup Time"}
                        </Text>

                        <View style={styles.timePickerConfirmArrow}>
                          <Ionicons
                            name="arrow-forward"
                            size={16}
                            color="#f8fafc"
                          />
                        </View>
                      </LinearGradient>
                    </Pressable>

                    <View style={styles.timePickerSecureRow}>
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={13}
                        color="rgba(226,232,240,0.48)"
                      />
                      <Text style={styles.timePickerSecureText}>
                        Secure booking · No payment required
                      </Text>
                    </View>
                  </>
                );
              })()}
              </Animated.View>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={officeModalVisible} transparent animationType="fade">
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setOfficeModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Office</Text>
              <ScrollView>
                {offices.map((office) => (
                  <Pressable
                    key={office._id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedOffice(office._id);
                      setOfficeModalVisible(false);
                    }}
                    style={[
                      styles.modalItem,
                      selectedOffice === office._id && styles.modalItemSelected,
                    ]}
                  >
                    <Text style={styles.modalItemText}>{office.name}</Text>
                    {selectedOffice === office._id && (
                      <Ionicons name="checkmark" size={20} color={ACCENT} />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>
      </Modal>


      <VanRulesModal
        visible={rulesModalVisible}
        vanName={van.name}
        rules={van.rules}
        requiredLicense={van.requiredLicense}
        onClose={() => setRulesModalVisible(false)}
      />

      <TermsConditionsModal
        visible={termsModalVisible}
        onClose={() => setTermsModalVisible(false)}
      />
    </>
  );
}

const SpecChip = ({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) => (
  <View style={localStyles.specChip}>
    <Ionicons name={icon} size={11} color={ACCENT} />
    <Text style={localStyles.specChipText}>{text}</Text>
  </View>
);

const SectionTitle = ({
  icon,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) => (
  <View style={localStyles.sectionTitleRow}>
    <Ionicons name={icon} size={14} color="#d5dde6" />
    <Text style={localStyles.sectionTitle}>{title}</Text>
  </View>
);

const DateTimeColumn = ({
  title,
  date,
  time,
  dateError,
  timeError,
  onDatePress,
  onTimePress,
}: {
  title: string;
  date: Date | null;
  time: string;
  dateError: boolean;
  timeError: boolean;
  onDatePress: () => void;
  onTimePress: () => void;
}) => (
  <View style={localStyles.dateColumn}>
    <Text style={localStyles.dateColumnTitle}>{title}</Text>
    <Pressable
      onPress={onDatePress}
      style={({ pressed }) => [
        localStyles.dateButton,
        dateError && localStyles.fieldError,
        pressed && localStyles.pressed,
      ]}
    >
      <Text
        style={[localStyles.dateValue, !date && localStyles.placeholderText]}
      >
        {date
          ? date.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "Select date"}
      </Text>
      <Ionicons name="calendar-outline" size={15} color="#8090a0" />
    </Pressable>
    <Pressable
      onPress={onTimePress}
      style={({ pressed }) => [
        localStyles.dateButton,
        timeError && localStyles.fieldError,
        pressed && localStyles.pressed,
      ]}
    >
      <Text
        style={[localStyles.dateValue, !time && localStyles.placeholderText]}
      >
        {time || "Select time"}
      </Text>
      <Ionicons name="time-outline" size={15} color="#8090a0" />
    </Pressable>
  </View>
);

const BreakdownRow = ({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) => (
  <View style={localStyles.breakdownRow}>
    <Text style={localStyles.breakdownLabel}>{label}</Text>
    <Text
      style={[
        localStyles.breakdownValue,
        positive && localStyles.breakdownPositive,
      ]}
    >
      {value}
    </Text>
  </View>
);

const localStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.84)",
  },
  modalContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingBottom: 8,
    justifyContent: "flex-end",
  },
  sheet: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(118,151,182,0.2)",
    backgroundColor: "rgba(5,11,18,0.98)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.7,
        shadowRadius: 34,
        shadowOffset: { width: 0, height: 20 },
      },
      android: { elevation: 22 },
    }),
  },
  keyboardArea: { flex: 1 },
  topHeader: {
    minHeight: 76,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.045)",
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.065)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  headerCopy: { flex: 1, alignItems: "center" },
  headerTitle: {
    color: "#f8fafc",
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "900",
    letterSpacing: -0.25,
  },
  headerSubtitle: {
    color: "rgba(211,220,231,0.54)",
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  scrollContent: { paddingHorizontal: 14, paddingTop: 6 },
  vanSummaryCard: {
    minHeight: 112,
    borderRadius: 17,
    overflow: "hidden",
    flexDirection: "row",
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,169,35,0.12)",
    backgroundColor: "rgba(19,27,37,0.9)",
  },
  vanImageBox: {
    width: 102,
    height: 88,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,157,0,0.09)",
  },
  vanImageGlow: {
    position: "absolute",
    width: 86,
    height: 68,
    borderRadius: 40,
    backgroundColor: "rgba(254,154,0,0.15)",
  },
  vanImage: { width: "98%", height: "94%" },
  vanSummaryBody: { flex: 1, paddingLeft: 10, minWidth: 0 },
  vanName: {
    color: "#f8fafc",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "900",
    letterSpacing: -0.25,
  },
  vanPurpose: {
    color: "rgba(214,222,231,0.58)",
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  specRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 9,
  },
  specChip: {
    minHeight: 20,
    paddingHorizontal: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(5,11,18,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },
  specChipText: {
    color: "rgba(225,231,238,0.68)",
    fontSize: 7.5,
    fontWeight: "700",
  },
  priceMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 7,
    gap: 5,
  },
  dayPriceRow: { flexDirection: "row", alignItems: "baseline", flexShrink: 1 },
  dayPrice: { color: ACCENT, fontSize: 15, fontWeight: "900" },
  dayPriceSuffix: {
    color: "#b7c2cd",
    fontSize: 8,
    fontWeight: "700",
    marginLeft: 2,
  },
  gearMeta: { color: "#a8b5c1", fontSize: 8, fontWeight: "700" },
  viewDetailsButton: { flexDirection: "row", alignItems: "center", gap: 2 },
  viewDetailsText: { color: ACCENT, fontSize: 8, fontWeight: "900" },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 14,
    marginBottom: 7,
    paddingHorizontal: 1,
  },
  sectionTitle: { color: "#eef3f8", fontSize: 11, fontWeight: "900" },
  locationCard: {
    minHeight: 55,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(24,33,44,0.76)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },
  locationIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  locationCopy: { flex: 1, minWidth: 0 },
  locationName: { color: "#f2f5f8", fontSize: 10, fontWeight: "800" },
  locationAddress: {
    color: "#7f8c99",
    fontSize: 8.5,
    fontWeight: "600",
    marginTop: 2,
  },
  dateGrid: { flexDirection: "row", gap: 8 },
  dateColumn: { flex: 1, gap: 6 },
  dateColumnTitle: {
    color: "#aeb9c5",
    fontSize: 8.5,
    fontWeight: "800",
    marginLeft: 2,
  },
  dateButton: {
    minHeight: 42,
    borderRadius: 9,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    backgroundColor: "rgba(22,31,41,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },
  dateValue: {
    color: "#eef2f6",
    fontSize: 9,
    fontWeight: "700",
    flexShrink: 1,
  },
  placeholderText: { color: "#697786" },
  fieldError: { borderColor: "rgba(239,68,68,0.82)" },
  segmentRow: { flexDirection: "row", gap: 7 },
  segmentButton: {
    flex: 1,
    minHeight: 37,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(20,29,39,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  segmentButtonActive: {
    backgroundColor: ACCENT,
    borderColor: "rgba(255,207,125,0.8)",
  },
  segmentText: { color: "#b9c3cd", fontSize: 9.5, fontWeight: "800" },
  segmentTextActive: { color: DARK },
  segmentCheck: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.58)",
  },
  ageHelperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  ageHelperText: { color: "#738294", fontSize: 8.5, fontWeight: "600" },
  gearRow: { flexDirection: "row", gap: 8 },
  gearCard: {
    flex: 1,
    minHeight: 55,
    borderRadius: 11,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(24,33,44,0.76)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },
  gearCardActive: {
    backgroundColor: "rgba(254,154,0,0.18)",
    borderColor: ACCENT,
  },
  gearIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  gearIconActive: { backgroundColor: "rgba(254,154,0,0.12)" },
  gearTitle: { color: "#d7e0e8", fontSize: 10, fontWeight: "900" },
  gearTitleActive: { color: ACCENT },
  gearMetaText: {
    color: "#7e8b99",
    fontSize: 7.5,
    fontWeight: "600",
    marginTop: 1,
  },
  rulesBanner: {
    minHeight: 54,
    marginTop: 12,
    paddingHorizontal: 9,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(25,34,44,0.75)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },
  rulesShield: {
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.1)",
  },
  rulesCopy: { flex: 1 },
  rulesTitle: { color: "#dfe5eb", fontSize: 9, fontWeight: "700" },
  rulesLink: { color: ACCENT, fontSize: 8, fontWeight: "900", marginTop: 2 },
  expandButton: {
    minHeight: 56,
    marginTop: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(15,23,32,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },
  expandIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.08)",
  },
  expandCopy: { flex: 1 },
  expandTitle: { color: "#ecf1f5", fontSize: 10, fontWeight: "900" },
  expandMeta: {
    color: "#72808e",
    fontSize: 8,
    fontWeight: "600",
    marginTop: 2,
  },
  detailsPanel: {
    marginTop: 8,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "rgba(10,17,25,0.62)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.045)",
    gap: 10,
  },
  inputGroup: { gap: 5 },
  inputLabel: { color: "#aeb9c4", fontSize: 9, fontWeight: "800" },
  textInputShell: {
    minHeight: 43,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(22,31,41,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  textInputFocused: { borderColor: "rgba(254,154,0,0.72)" },
  textInput: { flex: 1, color: "#f8fafc", fontSize: 11, paddingVertical: 10 },
  messageInput: {
    minHeight: 72,
    borderRadius: 10,
    padding: 10,
    color: "#f8fafc",
    fontSize: 11,
    backgroundColor: "rgba(22,31,41,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  errorText: { color: "#ef6666", fontSize: 8.5, fontWeight: "700" },
  successText: { color: "#22c55e", fontSize: 8.5, fontWeight: "800" },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 7,
  },
  loadingText: { color: "#8795a4", fontSize: 9, fontWeight: "700" },
  addonSection: { gap: 7 },
  addonRow: {
    minHeight: 72,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(22,31,41,0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.045)",
  },
  addonRowSelected: {
    backgroundColor: "rgba(254,154,0,0.08)",
    borderColor: "rgba(254,154,0,0.28)",
  },
  addonMedia: {
    width: 58,
    height: 54,
    borderRadius: 11,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  addonImage: {
    width: "100%",
    height: "100%",
  },
  addonImageFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.08)",
  },
  addonSelectedBadge: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.88)",
  },
  addonIcon: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254,154,0,0.08)",
  },
  addonCopy: { flex: 1, minWidth: 0 },
  addonName: { color: "#e8edf2", fontSize: 9.5, fontWeight: "800" },
  addonLockedText: {
    color: "#fb7185",
    fontSize: 7.5,
    fontWeight: "700",
    marginTop: 1,
  },
  addonPrice: { color: ACCENT, fontSize: 8.5, fontWeight: "800", marginTop: 1 },
  addonToggle: {
    minHeight: 29,
    minWidth: 82,
    paddingHorizontal: 9,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "rgba(254,154,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.24)",
  },
  addonToggleActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  addonToggleText: {
    color: ACCENT,
    fontSize: 9,
    fontWeight: "900",
  },
  addonToggleTextActive: { color: DARK },
  discountToggle: {
    minHeight: 42,
    paddingHorizontal: 9,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(22,31,41,0.68)",
  },
  discountToggleLeft: { flexDirection: "row", alignItems: "center", gap: 7 },
  discountToggleText: { color: "#dfe6ed", fontSize: 9.5, fontWeight: "800" },
  discountArea: { flexDirection: "row", gap: 7 },
  discountInputShell: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 9,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(22,31,41,0.82)",
  },
  discountSuccess: { borderColor: "#22c55e" },
  discountFailure: { borderColor: "#ef4444" },
  discountInput: { flex: 1, color: "#f8fafc", fontSize: 10, fontWeight: "800" },
  applyButton: {
    minWidth: 68,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT,
  },
  applyText: { color: DARK, fontSize: 10, fontWeight: "900" },
  removeDiscountButton: {
    width: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.12)",
  },
  breakdownCard: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(22,31,41,0.7)",
    gap: 7,
  },
  breakdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  breakdownTitle: { color: "#ecf1f5", fontSize: 10, fontWeight: "900" },
  breakdownTotal: { color: ACCENT, fontSize: 13, fontWeight: "900" },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  breakdownLabel: {
    flex: 1,
    color: "#8d9aa8",
    fontSize: 8.5,
    fontWeight: "700",
  },
  breakdownValue: { color: "#e8edf2", fontSize: 9, fontWeight: "900" },
  breakdownPositive: { color: "#22c55e" },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 2,
  },
  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#5f6d7b",
  },
  checkboxActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  termsText: {
    flex: 1,
    color: "#8593a1",
    fontSize: 8.5,
    lineHeight: 13,
    fontWeight: "600",
  },
  termsLink: {
    color: ACCENT,
    fontWeight: "900",
    textDecorationLine: "underline",
  },
  fixedBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 102,
    paddingTop: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(6,12,20,0.94)",
  },
  totalBlock: { width: 92 },
  totalLabel: { color: "#9aa7b4", fontSize: 9, fontWeight: "800" },
  totalValue: {
    color: "#f8fafc",
    fontSize: 19,
    lineHeight: 23,
    fontWeight: "900",
    marginTop: 2,
  },
  totalMeta: {
    color: "#657382",
    fontSize: 7.5,
    fontWeight: "600",
    marginTop: 1,
  },
  confirmButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 12,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 15,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOpacity: 0.26,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 5 },
      },
      android: { elevation: 6 },
    }),
  },
  confirmPressed: { transform: [{ scale: 0.985 }], opacity: 0.9 },
  confirmText: { color: DARK, fontSize: 12, fontWeight: "900" },
  confirmArrow: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.43)",
  },
  disabled: { opacity: 0.42 },
  pressed: { opacity: 0.76 },
});
