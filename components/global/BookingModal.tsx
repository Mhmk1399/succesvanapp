import React from "react";
import {
  View,
  Text,
  Modal,
  Animated,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Calendar } from "react-native-calendars";
import * as Haptics from "expo-haptics";
import { BookingModalProps } from "./BookingModal/types";
import { useBookingModal } from "./BookingModal/useBookingModal";
import { VanCard } from "./BookingModal/VanCard";
import { FormFields } from "./BookingModal/FormFields";
import { styles } from "./BookingModal/styles";
import { ACCENT, DARK } from "./BookingModal/constants";
import { getSelectedOffice, getAvailableTimeSlots } from "./BookingModal/utils";
import { calculatePrice } from "@/utils/priceCalculator";

export default function BookingModal({
  visible,
  van,
  onClose,
  prefilledData,
  onReservationComplete,
}: BookingModalProps) {
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
  } = useBookingModal(
    visible,
    van,
    onClose,
    prefilledData,
    onReservationComplete
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
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
              <View style={styles.header}>
                <Text style={styles.title}>
                  Booking <Text style={styles.titleVan}>{van.name}</Text>
                </Text>
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
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
          
          <BlurView intensity={40} tint="dark" style={styles.fixedBottom}>
            {(() => {
              if (!pickupDate || !returnDate) return null;
              const start = new Date(pickupDate);
              const end = new Date(returnDate);
              const [pH, pM] = pickupTime.split(':').map(Number);
              const [rH, rM] = returnTime.split(':').map(Number);
              start.setHours(pH, pM, 0, 0);
              end.setHours(rH, rM, 0, 0);
              const vanPrice = calculatePrice(start, end, van?.pricingTiers || [], van?.extraHoursRate || 0);
              const addonsPrice = Object.entries(addonSelections).reduce((sum, [id, sel]) => {
                const addon = addons.find(a => a._id === id);
                if (!addon) return sum;
                if (addon.pricingType === 'flat') return sum + (addon.flatPrice || 0) * sel.quantity;
                if (addon.pricingType === 'tiered' && sel.tierId) {
                  const tier = addon.tiers?.find(t => t._id === sel.tierId);
                  return sum + (tier?.price || 0) * sel.quantity;
                }
                return sum;
              }, 0);
              const total = vanPrice + addonsPrice;
              const hasAddons = addonsPrice > 0;
              
              return (
                <>
                  <View style={styles.priceBreakdown}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Van rental</Text>
                      <Text style={styles.breakdownValue}>£{vanPrice}</Text>
                    </View>
                    {hasAddons && (
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Add-ons</Text>
                        <Text style={styles.breakdownValue}>£{addonsPrice}</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Total</Text>
                    <Text style={styles.priceValue}>£{total}</Text>
                  </View>
                </>
              );
            })()}
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
                    <Ionicons name="checkmark-circle" size={20} color={DARK} />
                  </>
                )}
              </LinearGradient>
            </Pressable>
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
              markedDates={(() => {
                const marked: any = {};
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
                return marked;
              })()}
              markingType="period"
              minDate={
                selectingDate === "pickup"
                  ? new Date().toISOString().split("T")[0]
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
              theme={{
                calendarBackground: "transparent",
                textSectionTitleColor: "#9ca3af",
                selectedDayBackgroundColor: ACCENT,
                selectedDayTextColor: "#ffffff",
                todayTextColor: "#06cb48ff",
                dayTextColor: "#f9fafb",
                textDisabledColor: "#4b5563",
                monthTextColor: "#f9fafb",
                arrowColor: ACCENT,
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
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {(() => {
                  const office = getSelectedOffice(offices, selectedOffice);
                  const dateToCheck =
                    timeModalField === "pickupTime" ? pickupDate : returnDate;
                  const slots =
                    office && dateToCheck
                      ? getAvailableTimeSlots(dateToCheck, office)
                      : null;
                  if (!slots?.start || !slots?.end) return null;

                  const [startH, startM] = slots.start.split(":").map(Number);
                  const [endH, endM] = slots.end.split(":").map(Number);
                  const times: string[] = [];
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

                  return times.map((time) => {
                    const isReserved = reservedSlots.some(
                      (slot) => time === slot.startTime
                    );
                    const currentTime =
                      timeModalField === "pickupTime" ? pickupTime : returnTime;
                    const isAvailable = !isReserved;
                    return (
                      <Pressable
                        key={time}
                        disabled={!isAvailable}
                        onPress={() => isAvailable && selectTime(time)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          paddingVertical: 10,
                          paddingHorizontal: 14,
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
                          width: "23%",
                          opacity: isAvailable ? 1 : 0.4,
                        }}
                      >
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: isAvailable
                              ? "#22c55e"
                              : "#ef4444",
                          }}
                        />
                        <Text
                          style={{
                            color: currentTime === time ? DARK : "#e5e7eb",
                            fontSize: 14,
                            fontWeight: "700",
                          }}
                        >
                          {time}
                        </Text>
                      </Pressable>
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
