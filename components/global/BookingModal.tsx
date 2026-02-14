import { calculateAddonPrice } from "@/utils/addonCalculator";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";

import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Linking,
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
import { ACCENT, DARK } from "./BookingModal/constants";
import { FormFields } from "./BookingModal/FormFields";
import { styles } from "./BookingModal/styles";
import { BookingModalProps } from "./BookingModal/types";
import { useBookingModal } from "./BookingModal/useBookingModal";
import { getAvailableTimeSlots, getSelectedOffice, isDateDisabled as checkDateDisabled } from "./BookingModal/utils";
import { WorkingTime } from "@/types/type";
import { discountService } from "@/services/discountService";
import { useAuth } from "@/contexts/AuthContext";

const getLondonTime = () => {
  const now = new Date();
  const londonTimeStr = now.toLocaleString("en-GB", {
    timeZone: "Europe/London",
  });
  const [datePart, timePart] = londonTimeStr.split(", ");
  const [day, month, year] = datePart.split("/").map(Number);
  const [hours, minutes, seconds] = timePart.split(":").map(Number);
  const londonDate = new Date(year, month - 1, day, hours, minutes, seconds);
  return londonDate;
};

export default function BookingModal({
  visible,
  van,
  onClose,
  prefilledData,
  onReservationComplete,
}: BookingModalProps) {
  const { user } = useAuth();
  const [discountCode, setDiscountCode] = React.useState("");
  const [discountData, setDiscountData] = React.useState<any>(null);
  const [discountLoading, setDiscountLoading] = React.useState(false);
  const [discountError, setDiscountError] = React.useState("");

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
      van.id
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
    dynamicVanPrice,
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
    discountData
  );

  if (!van) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity }]} />
      </Pressable>

      <Animated.View
        style={[styles.modalContainer, { transform: [{ translateY }] }]}
      >
        <BlurView intensity={50} tint="dark" style={styles.blurContainer}>
          <View {...panResponder.panHandlers} style={styles.handleArea}>
            <View style={styles.handle} />
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 200 }}
            >
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  <View style={styles.headerIconBox}>
                    <Image
                      source={van.image}
                      contentFit="cover"
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 12,
                      }}
                    />
                  </View>
                  <View style={styles.headerTextContainer}>
                    <Text style={styles.headerSubtitle}>
                      Complete Your Booking
                    </Text>
                    <Text style={styles.title}>
                      <Text style={styles.titleVan}>{van.name}</Text>
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.topSection}>
                {/* <VanCard van={van} /> */}

                {hasPrefilledData && prefilledData && (
                  <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryCol}>
                        <View style={styles.summaryItemCompact}>
                          <View style={styles.summaryIconBox}>
                            <Ionicons
                              name="location"
                              size={16}
                              color={ACCENT}
                            />
                          </View>
                          <View style={styles.summaryContent}>
                            <Text style={styles.summaryLabelCompact}>
                              Office
                            </Text>
                            <Text
                              style={styles.summaryValueCompact}
                              numberOfLines={1}
                            >
                              {offices.find(
                                (o) => o._id === prefilledData.office
                              )?.name || "Selected"}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.summaryItemCompact}>
                          <View style={styles.summaryIconBox}>
                            <Ionicons name="person" size={16} color={ACCENT} />
                          </View>
                          <View style={styles.summaryContent}>
                            <Text style={styles.summaryLabelCompact}>
                              Driver Age
                            </Text>
                            <Text style={styles.summaryValueCompact}>
                              {prefilledData.driverAge} years
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.summaryDivider} />

                      <View style={styles.summaryCol}>
                        <View style={styles.summaryItemCompact}>
                          <View style={styles.summaryIconBox}>
                            <Ionicons
                              name="arrow-up-circle"
                              size={16}
                              color="#22c55e"
                            />
                          </View>
                          <View style={styles.summaryContent}>
                            <Text style={styles.summaryLabelCompact}>
                              Pickup
                            </Text>
                            <Text style={styles.summaryValueCompact}>
                              {new Date(
                                prefilledData.pickupDate
                              ).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </Text>
                            <Text style={styles.summaryTimeText}>
                              {prefilledData.pickupTime}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.summaryItemCompact}>
                          <View style={styles.summaryIconBox}>
                            <Ionicons
                              name="arrow-down-circle"
                              size={16}
                              color="#ef4444"
                            />
                          </View>
                          <View style={styles.summaryContent}>
                            <Text style={styles.summaryLabelCompact}>
                              Return
                            </Text>
                            <Text style={styles.summaryValueCompact}>
                              {new Date(
                                prefilledData.returnDate
                              ).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </Text>
                            <Text style={styles.summaryTimeText}>
                              {prefilledData.returnTime}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.form}>
                <FormFields
                  name={name}
                  setName={setName}
                  email={email}
                  setEmail={setEmail}
                  focusedInput={focusedInput}
                  setFocusedInput={setFocusedInput}
                  errors={errors}
                  setErrors={setErrors}
                  user={null}
                  hasPrefilledData={hasPrefilledData}
                  selectedOffice={selectedOffice}
                  offices={offices}
                  setOfficeModalVisible={setOfficeModalVisible}
                  officeModalVisible={officeModalVisible}
                  driverAge={driverAge}
                  setDriverAge={setDriverAge}
                  pickupDate={pickupDate}
                  pickupTime={pickupTime}
                  returnDate={returnDate}
                  returnTime={returnTime}
                  openDatePicker={openDatePicker}
                  openTimePicker={openTimePicker}
                  addons={addons}
                  addonSelections={addonSelections}
                  setAddonSelections={setAddonSelections}
                  isLoadingData={isLoadingData}
                  message={message}
                  setMessage={setMessage}
                  selectedGear={selectedGear}
                  setSelectedGear={setSelectedGear}
                  van={van}
                />
                {/* Discount Code Section */}
                <View style={{ marginTop: 20, marginHorizontal: 0 }}>
                  <Text
                    style={{
                      color: "#9ca3af",
                      fontSize: 12,
                      marginBottom: 6,
                      fontWeight: "600",
                    }}
                  >
                    Discount Code (Optional)
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: "rgba(15,23,42,0.6)",
                          borderRadius: 12,
                          borderWidth: 1.5,
                          borderColor: discountData
                            ? "#22c55e"
                            : discountError
                            ? "#ef4444"
                            : "rgba(148,163,184,0.3)",
                          paddingHorizontal: 12,
                        }}
                      >
                        <Ionicons
                          name="pricetag-outline"
                          size={18}
                          color={discountData ? "#22c55e" : "#9ca3af"}
                        />
                        <TextInput
                          value={discountCode}
                          onChangeText={(text) => {
                            setDiscountCode(text.toUpperCase());
                            setDiscountError("");
                          }}
                          placeholder="Enter code"
                          placeholderTextColor="#6b7280"
                          editable={!discountData}
                          style={{
                            flex: 1,
                            color: "#f9fafb",
                            fontSize: 14,
                            paddingVertical: 12,
                            paddingHorizontal: 8,
                          }}
                        />
                        {discountData && (
                          <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                        )}
                      </View>
                    </View>
                    {!discountData ? (
                      <Pressable
                        onPress={handleApplyDiscount}
                        disabled={discountLoading || !discountCode.trim()}
                        style={({ pressed }) => [{
                          backgroundColor: ACCENT,
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderRadius: 12,
                          opacity: discountLoading || !discountCode.trim() ? 0.5 : pressed ? 0.8 : 1,
                        }]}
                      >
                        {discountLoading ? (
                          <ActivityIndicator size="small" color={DARK} />
                        ) : (
                          <Text
                            style={{
                              color: DARK,
                              fontSize: 13,
                              fontWeight: "700",
                            }}
                          >
                            Apply
                          </Text>
                        )}
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => {
                          setDiscountCode("");
                          setDiscountData(null);
                          setDiscountError("");
                        }}
                        style={{
                          backgroundColor: "rgba(239,68,68,0.2)",
                          paddingHorizontal: 12,
                          paddingVertical: 12,
                          borderRadius: 12,
                        }}
                      >
                        <Ionicons name="close" size={16} color="#ef4444" />
                      </Pressable>
                    )}
                  </View>
                  {discountError && (
                    <Text
                      style={{
                        color: "#ef4444",
                        fontSize: 11,
                        marginTop: 6,
                        fontWeight: "500",
                      }}
                    >
                      {discountError}
                    </Text>
                  )}
                  {discountData && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 6,
                        backgroundColor: "rgba(34,197,94,0.1)",
                        padding: 8,
                        borderRadius: 8,
                      }}
                    >
                      <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                      <Text
                        style={{
                          color: "#22c55e",
                          fontSize: 11,
                          fontWeight: "600",
                          flex: 1,
                        }}
                      >
                        {discountData.percentage}% discount applied!
                      </Text>
                    </View>
                  )}
                </View>
                {/* ← NEW: Terms & Conditions checkbox */}
                <View style={{ marginTop: 20, marginHorizontal: 0 }}>
                  <Pressable
                    onPress={() => setTermsAccepted(!termsAccepted)}
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        borderWidth: 2,
                        borderColor: termsAccepted ? ACCENT : "#6b7280",
                        backgroundColor: termsAccepted ? ACCENT : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {termsAccepted && (
                        <Ionicons name="checkmark" size={18} color={DARK} />
                      )}
                    </View>

                    <Text
                      style={{
                        color: "#ffffffff",
                        fontSize: 14,
                        flex: 1,
                        fontWeight: "500",
                        marginTop: 6,
                      }}
                    >
                      I accept the{" "}
                      <Text
                        style={{
                          color: ACCENT,
                          textDecorationLine: "underline",
                        }}
                        onPress={() =>
                          Linking.openURL(
                            "https://successvanhire.co.uk/terms-and-conditions"
                          )
                        }
                      >
                        Terms and Conditions
                      </Text>{" "}
                      and Privacy Policy
                    </Text>
                  </Pressable>

                  {/* Optional error message if needed */}
                  {/* {!termsAccepted && errors.terms && (
                    <Text style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>
                      You must accept the terms to proceed
                    </Text>
                  )} */}
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          <BlurView intensity={40} tint="dark" style={styles.fixedBottom}>
            {(() => {
              if (
                !pickupDate ||
                !returnDate ||
                !pickupTime ||
                !returnTime ||
                !van
              ) {
                return (
                  <Pressable
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    style={({ pressed }) => [
                      styles.submitBtn,
                      pressed && styles.submitBtnPressed,
                      isSubmitting && styles.submitBtnDisabled,
                    ]}
                  >
                    <LinearGradient
                      colors={[ACCENT, "#ff8c00"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.submitGradient}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color={DARK} size="small" />
                      ) : (
                        <>
                          <Text style={styles.submitText}>Confirm Booking</Text>
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={DARK}
                          />
                        </>
                      )}
                    </LinearGradient>
                  </Pressable>
                );
              }

              const start = new Date(pickupDate);
              const end = new Date(returnDate);
              const [pH, pM] = pickupTime.split(":").map(Number);
              const [rH, rM] = returnTime.split(":").map(Number);
              start.setHours(pH, pM, 0, 0);
              end.setHours(rH, rM, 0, 0);

              const diffTime = end.getTime() - start.getTime();
              const totalMinutes = diffTime / (1000 * 60);
              const totalHours = Math.floor(totalMinutes / 60);
              const remainingMinutes = totalMinutes % 60;
              const billableHours =
                remainingMinutes > 15 ? totalHours + 1 : totalHours;
              const actualDays = Math.floor(billableHours / 24);
              const actualExtraHours = billableHours % 24;

              let totalDays = actualDays;
              const extraHours = actualExtraHours;
              let extraHoursPrice = 0;

              if (billableHours < 24) {
                totalDays = 1;
              } else if (extraHours > 6) {
                totalDays += 1;
              } else if (extraHours > 0) {
                extraHoursPrice = extraHours * (van.extraHoursRate || 0);
              }

              const automaticGearCost =
                selectedGear === "automatic" &&
                typeof van.gear === "object" &&
                van.gear.automaticExtraCost
                  ? van.gear.automaticExtraCost * totalDays
                  : 0;

              const tier =
                van.pricingTiers?.find(
                  (t) => totalDays >= t.minDays && totalDays <= t.maxDays
                ) || van.pricingTiers?.[van.pricingTiers.length - 1];
              const pricePerDay = tier?.pricePerDay || 0;

              let pickupExtFee = prefilledData?.pickupExtensionFee || 0;
              let returnExtFee = prefilledData?.returnExtensionFee || 0;

              if (!hasPrefilledData) {
                const office = getSelectedOffice(offices, selectedOffice);
                if (office && pickupDate && pickupTime) {
                  const dayName = [
                    "sunday",
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                    "saturday",
                  ][pickupDate.getDay()];
                  const workingDay = office.workingTime?.find(
                    (w: WorkingTime) => w.day === dayName
                  );
                  if (workingDay?.pickupExtension) {
                    const slots = getAvailableTimeSlots(
                      pickupDate,
                      office,
                      true
                    );
                    if (
                      slots.normalStart &&
                      slots.normalEnd &&
                      (pickupTime < slots.normalStart ||
                        pickupTime > slots.normalEnd)
                    ) {
                      pickupExtFee = workingDay.pickupExtension.flatPrice;
                    }
                  }
                }
                if (office && returnDate && returnTime) {
                  const dayName = [
                    "sunday",
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                    "saturday",
                  ][returnDate.getDay()];
                  const workingDay = office.workingTime?.find(
                    (w: WorkingTime) => w.day === dayName
                  );
                  if (workingDay?.returnExtension) {
                    const slots = getAvailableTimeSlots(
                      returnDate,
                      office,
                      false
                    );
                    if (
                      slots.normalStart &&
                      slots.normalEnd &&
                      (returnTime < slots.normalStart ||
                        returnTime > slots.normalEnd)
                    ) {
                      returnExtFee = workingDay.returnExtension.flatPrice;
                    }
                  }
                }
              }

              const vanPrice = dynamicVanPrice;
              const addonsPrice = Object.entries(addonSelections).reduce(
                (sum, [id, sel]) => {
                  const addon = addons.find((a) => a._id === id);
                  if (!addon) return sum;
                  return (
                    sum +
                    calculateAddonPrice(
                      addon,
                      pickupDate,
                      returnDate,
                      pickupTime,
                      returnTime,
                      sel.quantity
                    )
                  );
                },
                0
              );
              
              let subtotal = vanPrice + addonsPrice + (hasPrefilledData ? automaticGearCost : 0);
              const discountAmount = discountData ? (subtotal * discountData.percentage) / 100 : 0;
              const total = subtotal - discountAmount;

              const isSubmitDisabled =
                isSubmitting ||
                !termsAccepted ||
                !pickupDate ||
                !returnDate ||
                !pickupTime ||
                !returnTime ||
                !van;

              const hasSellOffer = van.selloffer && van.selloffer > 0;
              const discountedPricePerDay = hasSellOffer
                ? pricePerDay * (1 - (van.selloffer || 0) / 100)
                : pricePerDay;
              const totalSavings = hasSellOffer
                ? (pricePerDay - discountedPricePerDay) * totalDays
                : 0;

              return (
                <>
                  <ScrollView
                    style={{ maxHeight: 100 }}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    <View style={{ gap: 6 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={13}
                          color="#f79515ff"
                        />
                        <View>
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#d1d5db",
                              fontWeight: "500",
                            }}
                          >
                            ({actualDays}d {actualExtraHours}h) {totalDays} day
                            {totalDays > 1 ? "s" : ""} × £
                            {hasSellOffer
                              ? discountedPricePerDay.toFixed(0)
                              : pricePerDay.toFixed(0)}
                          </Text>
                          {hasSellOffer && (
                            <Text
                              style={{
                                fontSize: 10,
                                color: "#22c55e",
                                fontWeight: "600",
                              }}
                            >
                              Saved £{totalSavings.toFixed(1)} (-{van.selloffer}
                              %)
                            </Text>
                          )}
                        </View>
                      </View>
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#f9fafb",
                          fontWeight: "700",
                        }}
                      >
                        £
                        {(
                          totalDays *
                          (hasSellOffer ? discountedPricePerDay : pricePerDay)
                        ).toFixed(0)}
                      </Text>
                    </View>

                    {extraHours > 0 && extraHours <= 6 && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Ionicons
                            name="time-outline"
                            size={13}
                            color="#1e6befff"
                          />
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#d1d5db",
                              fontWeight: "500",
                            }}
                          >
                            {extraHours}h extra × £{van.extraHoursRate || 0}
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#f9fafb",
                            fontWeight: "700",
                          }}
                        >
                          £{extraHoursPrice.toFixed(0)}
                        </Text>
                      </View>
                    )}

                    {pickupExtFee > 0 && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Ionicons
                            name="arrow-up-circle-outline"
                            size={13}
                            color="#fbbf24"
                          />
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#d1d5db",
                              fontWeight: "500",
                            }}
                          >
                            Pickup extra
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#f9fafb",
                            fontWeight: "700",
                          }}
                        >
                          £{pickupExtFee}
                        </Text>
                      </View>
                    )}

                    {returnExtFee > 0 && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Ionicons
                            name="arrow-down-circle-outline"
                            size={13}
                            color="#fbbf24"
                          />
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#d1d5db",
                              fontWeight: "500",
                            }}
                          >
                            Return extra
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#f9fafb",
                            fontWeight: "700",
                          }}
                        >
                          £{returnExtFee}
                        </Text>
                      </View>
                    )}

                    {Object.entries(addonSelections).map(([id, sel]) => {
                      if (sel.quantity === 0) return null;
                      const addon = addons.find((a) => a._id === id);
                      if (!addon) return null;
                      const price = calculateAddonPrice(
                        addon,
                        pickupDate,
                        returnDate,
                        pickupTime,
                        returnTime,
                        sel.quantity
                      );
                      return (
                        <View
                          key={id}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Ionicons
                              name="add-circle-outline"
                              size={13}
                              color="#08d72bff"
                            />
                            <Text
                              style={{
                                fontSize: 12,
                                color: "#d1d5db",
                                fontWeight: "500",
                              }}
                            >
                              {addon.name} ×{sel.quantity}
                            </Text>
                          </View>
                          <Text
                            style={{
                              fontSize: 14,
                              color: "#f9fafb",
                              fontWeight: "700",
                            }}
                          >
                            £{price.toFixed(0)}
                          </Text>
                        </View>
                      );
                    })}

                    {automaticGearCost > 0 && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Ionicons
                            name="settings-outline"
                            size={13}
                            color="#a78bfa"
                          />
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#d1d5db",
                              fontWeight: "500",
                            }}
                          >
                            Automatic gear ({totalDays}d × £
                            {typeof van.gear === "object"
                              ? van.gear.automaticExtraCost
                              : 0}
                            )
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#f9fafb",
                            fontWeight: "700",
                          }}
                        >
                          £{automaticGearCost.toFixed(0)}
                        </Text>
                      </View>
                    )}

                    <View
                      style={{
                        height: 1,
                        backgroundColor: "rgba(255,255,255,0.1)",
                        marginVertical: 8,
                      }}
                    />

                    {discountData && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Ionicons
                            name="pricetag"
                            size={13}
                            color="#22c55e"
                          />
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#d1d5db",
                              fontWeight: "500",
                            }}
                          >
                            Discount ({discountData.percentage}%)
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#22c55e",
                            fontWeight: "700",
                          }}
                        >
                          -£{discountAmount.toFixed(0)}
                        </Text>
                      </View>
                    )}

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: "#f9fafb",
                          fontWeight: "800",
                        }}
                      >
                        Total :
                      </Text>
                      <Text
                        style={{
                          fontSize: 20,
                          color: "#22c55e",
                          fontWeight: "900",
                        }}
                      >
                        £{total.toFixed(0)}
                      </Text>
                    </View>
                  </View>
                  </ScrollView>

                  <Pressable
                    onPress={handleSubmit}
                    disabled={isSubmitDisabled}
                    style={({ pressed }) => [
                      styles.submitBtn,
                      pressed && styles.submitBtnPressed,
                      isSubmitDisabled && styles.submitBtnDisabled,
                    ]}
                  >
                    <LinearGradient
                      colors={[ACCENT, "#ff8c00"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.submitGradient}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color={DARK} size="small" />
                      ) : (
                        <>
                          <Text style={styles.submitText}>Confirm Booking</Text>
                          <Text
                            style={[
                              styles.submitText,
                              { fontSize: 18, fontWeight: "900" },
                            ]}
                          >
                            £{total.toFixed(0)}
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </Pressable>
                </>
              );
            })()}
          </BlurView>
        </BlurView>
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
            <View style={styles.timeModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  {selectingDate === "pickup"
                    ? "📅 Pickup Date"
                    : "📅 Return Date"}
                </Text>
                <Text style={{ color: "#9ca3af", fontSize: 11, marginTop: 4 }}>
                  {selectingDate === "pickup"
                    ? pickupDate
                      ? `Selected: ${pickupDate.toLocaleDateString()}`
                      : "Choose your pickup date"
                    : returnDate
                    ? `Selected: ${returnDate.toLocaleDateString()}`
                    : "Choose your return date"}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setDateRangeModalVisible(false);
                  setSelectingDate("pickup");
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={20} color="#e5e7eb" />
              </Pressable>
            </View>
            <Calendar
              onDayPress={(day) => handleDateSelect(day.dateString)}
              minDate={
                selectingDate === "pickup"
                  ? (() => {
                      const londonTime = getLondonTime();
                      const londonHour = londonTime.getUTCHours();
                      const minDate = new Date();

                      if (londonHour < 16) {
                        minDate.setDate(minDate.getDate() + 1);
                      } else {
                        minDate.setDate(minDate.getDate() + 2);
                      }
                      return minDate.toISOString().split("T")[0];
                    })()
                  : tempPickupDate?.toISOString().split("T")[0]
              }
              maxDate={
                selectingDate === "return" && tempPickupDate
                  ? new Date(
                      tempPickupDate.getTime() + 30 * 24 * 60 * 60 * 1000
                    )
                      .toISOString()
                      .split("T")[0]
                  : undefined
              }
              markedDates={(() => {
                const marked: Record<string, any> = {};
                const currentPickup = tempPickupDate || pickupDate;
                if (currentPickup && returnDate && selectingDate === "pickup") {
                  const start = new Date(currentPickup);
                  const end = new Date(returnDate);
                  const current = new Date(start);
                  while (current <= end) {
                    const dateStr = current.toISOString().split("T")[0];
                    const isStart = current.getTime() === start.getTime();
                    const isEnd = current.getTime() === end.getTime();
                    marked[dateStr] = {
                      color: isStart || isEnd ? ACCENT : "rgba(254,154,0,0.3)",
                      textColor: isStart || isEnd ? "#fff" : "#f9fafb",
                      startingDay: isStart,
                      endingDay: isEnd,
                    };
                    current.setDate(current.getDate() + 1);
                  }
                } else if (currentPickup) {
                  marked[currentPickup.toISOString().split("T")[0]] = {
                    selected: true,
                    selectedColor: ACCENT,
                    selectedTextColor: "#ffffff",
                  };
                }

                // Mark disabled dates (London time-based restriction + office closed days)
                const londonTime = getLondonTime();
                const londonHour = londonTime.getUTCHours();
                const today = new Date();
                const minAllowedDate = new Date(today);

                if (londonHour < 16) {
                  minAllowedDate.setDate(today.getDate() + 1);
                } else {
                  minAllowedDate.setDate(today.getDate() + 2);
                }

                for (let i = 0; i < 60; i++) {
                  const checkDate = new Date(today);
                  checkDate.setDate(today.getDate() + i);
                  const dateStr = checkDate.toISOString().split("T")[0];

                  if (checkDate < minAllowedDate) {
                    marked[dateStr] = {
                      disabled: true,
                      disableTouchEvent: true,
                    };
                  } else if (selectingDate === "pickup") {
                    const office = getSelectedOffice(offices, selectedOffice);
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
              theme={{
                calendarBackground: "transparent",
                textSectionTitleColor: "#9ca3af",
                selectedDayBackgroundColor: ACCENT,
                selectedDayTextColor: "#ffffff",
                todayTextColor: ACCENT,
                dayTextColor: "#f9fafb",
                textDisabledColor: "#4b5563",
                monthTextColor: "#f9fafb",
                arrowColor: ACCENT,
                textDayFontWeight: "500",
                textMonthFontWeight: "700",
                textDayHeaderFontWeight: "600",
                textDayFontSize: 14,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 12,
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={timeModalVisible} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setTimeModalVisible(false);
            setTimeModalField(null);
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={styles.timeModalBox}
          >
            <View style={styles.timeModalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {timeModalField === "pickupTime" ? "Pickup" : "Return"} Time
                </Text>
                <Text style={{ color: "#9ca3af", fontSize: 11, marginTop: 2 }}>
                  Select a time slot
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setTimeModalVisible(false);
                  setTimeModalField(null);
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={20} color="#e5e7eb" />
              </Pressable>
            </View>
            <ScrollView
              showsVerticalScrollIndicator
              contentContainerStyle={{ paddingBottom: 10 }}
            >
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: 2,
                }}
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
                  if (!slots?.start || !slots?.end) return null;

                  const [startH, startM] = slots.start.split(":").map(Number);
                  const [endH, endM] = slots.end.split(":").map(Number);
                  let times: string[] = [];
                  for (let h = startH; h <= endH; h++) {
                    const startMin = h === startH ? startM : 0;
                    const endMin = h === endH ? endM : 45;
                    for (let m = startMin; m <= endMin; m += 15) {
                      times.push(
                        `${h.toString().padStart(2, "0")}:${m
                          .toString()
                          .padStart(2, "0")}`
                      );
                    }
                  }

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
                    (w: WorkingTime) => w.day === dayName
                  );
                  const extension = isPickup
                    ? workingDay?.pickupExtension
                    : workingDay?.returnExtension;
                  const isAllExtension = slots.normalStart === slots.normalEnd;

                  return times.map((time) => {
                    const isPickup = timeModalField === "pickupTime";
                    const isReserved = reservedSlots.some((slot) => {
                      if (isPickup) {
                        return time === slot.startTime;
                      } else {
                        return time === slot.endTime;
                      }
                    });
                    const currentTime =
                      timeModalField === "pickupTime" ? pickupTime : returnTime;
                    const isAvailable = !isReserved;
                    const isExtension =
                      isAllExtension ||
                      (slots.normalStart &&
                      slots.normalEnd &&
                      (time < slots.normalStart || time > slots.normalEnd));
                    const extensionPrice =
                      isExtension && extension ? extension.flatPrice : 0;

                    return (
                      <View
                        key={time}
                        style={{ width: "31%", marginBottom: 10 }}
                      >
                        <Pressable
                          disabled={!isAvailable}
                          onPress={() => isAvailable && selectTime(time)}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            paddingVertical: 12,
                            paddingHorizontal: 10,
                            borderRadius: 12,
                            backgroundColor:
                              currentTime === time
                                ? ACCENT
                                : "rgba(255,255,255,0.05)",
                            borderWidth: 1.5,
                            borderColor:
                              currentTime === time
                                ? ACCENT
                                : "rgba(255,255,255,0.1)",
                            opacity: isAvailable ? 1 : 0.4,
                          }}
                        >
                          <View
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: isAvailable
                                ? isExtension
                                  ? "#fbbf24"
                                  : "#22c55e"
                                : "#ef4444",
                            }}
                          />
                          <Text
                            style={{
                              color: currentTime === time ? DARK : "#e5e7eb",
                              fontSize: 12,
                              fontWeight: "600",
                            }}
                          >
                            {time}
                          </Text>
                        </Pressable>
                        {isExtension && extensionPrice > 0 && (
                          <Text
                            style={{
                              fontSize: 9,
                              color: currentTime === time ? "#fff" : "#fbbf24",
                              textAlign: "center",
                              marginTop: 2,
                            }}
                          >
                            +£{extensionPrice}
                          </Text>
                        )}
                      </View>
                    );
                  });
                })()}
              </View>
            </ScrollView>
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
  );
}
