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
  useColorScheme,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as Haptics from "expo-haptics";
import { BookingModalProps } from "./BookingModal/types";
import { useBookingModal } from "./BookingModal/useBookingModal";
import { VanCard } from "./BookingModal/VanCard";
import { FormFields } from "./BookingModal/FormFields";
import { styles } from "./BookingModal/styles";
import { ACCENT, DARK } from "./BookingModal/constants";
import { getSelectedOffice, getAvailableTimeSlots, isDateDisabled } from "./BookingModal/utils";

export default function BookingModal({
  visible,
  van,
  onClose,
  prefilledData,
}: BookingModalProps) {
  const colorScheme = useColorScheme();
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
    pickerField,
    setPickerField,
    pickerMode,
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
    hasPrefilledData,
    handleClose,
    openPicker,
    handleConfirm,
    handleSubmit,
    isLoadingData,
  } = useBookingModal(visible, van, onClose, prefilledData);

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
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <Text style={styles.title}>Booking Details</Text>
              </View>

              <VanCard van={van} />

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
                  pickerField={pickerField}
                  openPicker={openPicker}
                  addons={addons}
                  addonSelections={addonSelections}
                  setAddonSelections={setAddonSelections}
                  isLoadingData={isLoadingData}
                />

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
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </BlurView>
      </Animated.View>

      <DateTimePickerModal
        isVisible={pickerField !== null}
        mode={pickerMode}
        onConfirm={handleConfirm}
        onCancel={() => setPickerField(null)}
        is24Hour={true}
        display="spinner"
        themeVariant={colorScheme === "dark" ? "dark" : "light"}
        accentColor={ACCENT}
        textColor={colorScheme === "dark" ? "#fff" : DARK}
        minimumDate={
          pickerMode === "date"
            ? new Date()
            : (() => {
                const slots =
                  pickerField === "pickupTime"
                    ? getAvailableTimeSlots(
                        pickupDate,
                        getSelectedOffice(offices, selectedOffice)
                      )
                    : getAvailableTimeSlots(
                        returnDate,
                        getSelectedOffice(offices, selectedOffice)
                      );
                const [h, m] = (slots.start || "00:00").split(":").map(Number);
                const minTime = new Date();
                minTime.setHours(h, m, 0, 0);
                return minTime;
              })()
        }
        maximumDate={
          pickerMode === "time"
            ? (() => {
                const slots =
                  pickerField === "pickupTime"
                    ? getAvailableTimeSlots(
                        pickupDate,
                        getSelectedOffice(offices, selectedOffice)
                      )
                    : getAvailableTimeSlots(
                        returnDate,
                        getSelectedOffice(offices, selectedOffice)
                      );
                const [h, m] = (slots.end || "23:59").split(":").map(Number);
                const maxTime = new Date();
                maxTime.setHours(h, m, 0, 0);
                return maxTime;
              })()
            : undefined
        }
      />

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
