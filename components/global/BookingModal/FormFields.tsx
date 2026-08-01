import { AddOn, Office, User } from "@/types/type";
import {
    calculateAddonPrice,
    getAddonDisplayPrice,
} from "@/utils/addonCalculator";
import {
  calculateBillableDuration,
  getMatchingAddonTierIndex,
  getMinDriverAge,
  isAddonAvailableForCategory,
  isAddonAvailableForDays,
} from "@/utils/bookingPrice";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
    ActivityIndicator,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";
import { Van } from "../vanlist";
import { ACCENT, DARK } from "./constants";
import { styles } from "./styles";
import { formatDate, formatTime } from "./utils";

type FormFieldsProps = {
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  focusedInput: string | null;
  setFocusedInput: (v: string | null) => void;
  errors: Record<string, string>;
  setErrors: (v: Record<string, string>) => void;
  user: User | null;
  hasPrefilledData: boolean;
  selectedOffice: string;
  offices: Office[];
  setOfficeModalVisible: (v: boolean) => void;
  officeModalVisible: boolean;
  driverAge: string;
  setDriverAge: (v: string) => void;
  pickupDate: Date | null;
  pickupTime: string;
  returnDate: Date | null;
  returnTime: string;
  openDatePicker: () => void;
  openTimePicker: (field: "pickupTime" | "returnTime") => void;
  addons: AddOn[];
  addonSelections: Record<
    string,
    { quantity: number; tierId?: string; selectedTierIndex?: number }
  >;
  setAddonSelections: (
    v: Record<
      string,
      { quantity: number; tierId?: string; selectedTierIndex?: number }
    >
  ) => void;
  isLoadingData: boolean;
  message: string;
  setMessage: (v: string) => void;
  selectedGear: "manual" | "automatic";
  setSelectedGear: (v: "manual" | "automatic") => void;
  van: Van | null;
};

export const FormFields = ({
  name,
  setName,
  email,
  setEmail,
  focusedInput,
  setFocusedInput,
  errors,
  setErrors,
  user,
  hasPrefilledData,
  selectedOffice,
  offices,
  setOfficeModalVisible,
  officeModalVisible,
  driverAge,
  setDriverAge,
  pickupDate,
  pickupTime,
  returnDate,
  returnTime,
  openDatePicker,
  openTimePicker,
  addons,
  addonSelections,
  setAddonSelections,
  isLoadingData,
  message,
  setMessage,
  selectedGear,
  setSelectedGear,
  van,
}: FormFieldsProps) => {
  const minDriverAge = React.useMemo(
    () => getMinDriverAge((van as any)?.type?.name || van?.name),
    [van],
  );

  const rentalDays = React.useMemo(() => {
    if (!pickupDate || !returnDate || !pickupTime || !returnTime) return 1;
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    const [pickupHour, pickupMinute] = pickupTime.split(":").map(Number);
    const [returnHour, returnMinute] = returnTime.split(":").map(Number);
    start.setHours(pickupHour, pickupMinute, 0, 0);
    end.setHours(returnHour, returnMinute, 0, 0);
    return calculateBillableDuration(start, end).totalDays || 1;
  }, [pickupDate, pickupTime, returnDate, returnTime]);

  const accountName = React.useMemo(() => {
    const fullName = [user?.name, user?.lastName].filter(Boolean).join(" ");
    return fullName || name || "Your account";
  }, [name, user?.lastName, user?.name]);

  const accountEmail = user?.emaildata?.emailAddress || email || "No email";

  return (
  <>
    {user ? (
      <View style={styles.accountSummary}>
        <View style={styles.accountSummaryIcon}>
          <Ionicons name="checkmark-circle" size={18} color={ACCENT} />
        </View>
        <View style={styles.accountSummaryText}>
          <Text style={styles.accountSummaryLabel}>Booking as</Text>
          <Text style={styles.accountSummaryName} numberOfLines={1}>
            {accountName}
          </Text>
          <Text style={styles.accountSummaryEmail} numberOfLines={1}>
            {accountEmail}
          </Text>
        </View>
        <View style={styles.accountLockedPill}>
          <Ionicons name="lock-closed" size={11} color="#94a3b8" />
          <Text style={styles.accountLockedText}>Account</Text>
        </View>
      </View>
    ) : (
      <>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <View
            style={[
              styles.inputWrapper,
              focusedInput === "name" && styles.inputFocused,
            ]}
          >
            <Ionicons
              name="person-outline"
              size={18}
              color={focusedInput === "name" ? ACCENT : "#9ca3af"}
            />
            <TextInput
              placeholder="Enter your name"
              placeholderTextColor="#6b7280"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors({ ...errors, name: "" });
              }}
              onFocus={() => {
                Haptics.selectionAsync();
                setFocusedInput("name");
              }}
              onBlur={() => setFocusedInput(null)}
              style={styles.input}
            />
          </View>
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <View
            style={[
              styles.inputWrapper,
              focusedInput === "email" && styles.inputFocused,
            ]}
          >
            <Ionicons
              name="mail-outline"
              size={18}
              color={focusedInput === "email" ? ACCENT : "#9ca3af"}
            />
            <TextInput
              placeholder="your@email.com"
              placeholderTextColor="#6b7280"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: "" });
              }}
              onFocus={() => {
                Haptics.selectionAsync();
                setFocusedInput("email");
              }}
              onBlur={() => setFocusedInput(null)}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>
      </>
    )}

    {!hasPrefilledData && (
      <>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Office</Text>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setOfficeModalVisible(true);
            }}
            style={[
              styles.inputWrapper,
              officeModalVisible && styles.inputFocused,
            ]}
          >
            <Ionicons
              name="location-outline"
              size={18}
              color={selectedOffice ? ACCENT : "#9ca3af"}
            />
            <Text
              style={[styles.input, !selectedOffice && { color: "#6b7280" }]}
            >
              {selectedOffice
                ? offices.find((o) => o._id === selectedOffice)?.name ||
                  "Select office"
                : "Select office"}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#9ca3af" />
          </Pressable>
          {errors.office && (
            <Text style={styles.errorText}>{errors.office}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Driver Age ({minDriverAge}-80)</Text>
          <View
            style={[
              styles.inputWrapper,
              focusedInput === "driverAge" && styles.inputFocused,
            ]}
          >
            <Ionicons
              name="person-outline"
              size={18}
              color={focusedInput === "driverAge" ? ACCENT : "#9ca3af"}
            />
            <TextInput
              placeholder={`${minDriverAge}-80`}
              placeholderTextColor="#6b7280"
              value={driverAge}
              onChangeText={(text) => {
                setDriverAge(text);
                if (errors.driverAge) setErrors({ ...errors, driverAge: "" });
              }}
              onFocus={() => {
                Haptics.selectionAsync();
                setFocusedInput("driverAge");
              }}
              onBlur={() => setFocusedInput(null)}
              style={styles.input}
              keyboardType="numeric"
            />
          </View>
          {errors.driverAge && (
            <Text style={styles.errorText}>{errors.driverAge}</Text>
          )}
        </View>

        <Text style={styles.sectionLabel}>Pickup & Return</Text>
        {errors.pickup && <Text style={styles.errorText}>{errors.pickup}</Text>}
        {errors.return && <Text style={styles.errorText}>{errors.return}</Text>}
        <Pressable onPress={openDatePicker} style={[styles.inputWrapper]}>
          <Ionicons
            name="calendar-outline"
            size={18}
            color={pickupDate && returnDate ? ACCENT : "#9ca3af"}
          />
          <Text
            style={[
              styles.input,
              (!pickupDate || !returnDate) && { color: "#6b7280" },
            ]}
          >
            {pickupDate && returnDate
              ? `${formatDate(pickupDate)} - ${formatDate(returnDate)}`
              : "Select dates"}
          </Text>
        </Pressable>

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Pickup Time</Text>
            <Pressable
              onPress={() => openTimePicker("pickupTime")}
              style={styles.inputWrapper}
            >
              <Ionicons
                name="time-outline"
                size={18}
                color={pickupTime ? ACCENT : "#9ca3af"}
              />
              <Text style={[styles.input, !pickupTime && { color: "#6b7280" }]}>
                {formatTime(pickupTime)}
              </Text>
            </Pressable>
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Return Time</Text>
            <Pressable
              onPress={() => openTimePicker("returnTime")}
              style={styles.inputWrapper}
            >
              <Ionicons
                name="time-outline"
                size={18}
                color={returnTime ? ACCENT : "#9ca3af"}
              />
              <Text style={[styles.input, !returnTime && { color: "#6b7280" }]}>
                {formatTime(returnTime)}
              </Text>
            </Pressable>
          </View>
        </View>
      </>
    )}

    {(() => {
      return van?.gear && typeof van.gear === 'object' && van.gear.availableTypes && van.gear.availableTypes.length > 1;
    })() && (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Gearbox</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedGear("manual");
            }}
            style={{
              flex: 1,
              backgroundColor:
                selectedGear === "manual"
                  ? "rgba(254,154,0,0.15)"
                  : "rgba(255,255,255,0.05)",
              borderRadius: 13,
              padding: 9,
              borderWidth: 1.5,
              borderColor:
                selectedGear === "manual" ? ACCENT : "rgba(255,255,255,0.1)",
              alignItems: "center",
              gap: 5,
            }}
          >
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor:
                  selectedGear === "manual"
                    ? "rgba(254,154,0,0.2)"
                    : "rgba(255,255,255,0.05)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="hand-left"
                size={16}
                color={selectedGear === "manual" ? ACCENT : "#9ca3af"}
              />
            </View>
            <Text
              style={{
                color: selectedGear === "manual" ? ACCENT : "#e5e7eb",
                fontSize: 12,
                fontWeight: "700",
              }}
            >
              Manual
            </Text>
            <Text
              style={{ color: "#9ca3af", fontSize: 10, textAlign: "center" }}
            >
              Standard
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedGear("automatic");
            }}
            style={{
              flex: 1,
              backgroundColor:
                selectedGear === "automatic"
                  ? "rgba(254,154,0,0.15)"
                  : "rgba(255,255,255,0.05)",
              borderRadius: 13,
              padding: 9,
              borderWidth: 1.5,
              borderColor:
                selectedGear === "automatic" ? ACCENT : "rgba(255,255,255,0.1)",
              alignItems: "center",
              gap: 5,
            }}
          >
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor:
                  selectedGear === "automatic"
                    ? "rgba(254,154,0,0.2)"
                    : "rgba(255,255,255,0.05)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="settings"
                size={16}
                color={selectedGear === "automatic" ? ACCENT : "#9ca3af"}
              />
            </View>
            <Text
              style={{
                color: selectedGear === "automatic" ? ACCENT : "#e5e7eb",
                fontSize: 12,
                fontWeight: "700",
              }}
            >
              Automatic
            </Text>
            {van?.gear && typeof van.gear === 'object' && van.gear.automaticExtraCost &&
            van.gear.automaticExtraCost > 0 ? (
              <View
                style={{
                  backgroundColor:
                    selectedGear === "automatic"
                      ? "rgba(254,154,0,0.2)"
                      : "rgba(255,255,255,0.05)",
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 999,
                }}
              >
                <Text
                  style={{
                    color: selectedGear === "automatic" ? ACCENT : "#9ca3af",
                    fontSize: 10,
                    fontWeight: "600",
                  }}
                >
                  +£{van?.gear && typeof van.gear === 'object' ? van.gear.automaticExtraCost : 0}/day
                </Text>
              </View>
            ) : (
              <Text style={{ color: "#9ca3af", fontSize: 10 }}>
                No extra cost
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    )}

    {isLoadingData ? (
      <View
        style={{ marginTop: 10, alignItems: "center", paddingVertical: 20 }}
      >
        <ActivityIndicator color={ACCENT} size="small" />
        <Text style={[styles.label, { marginTop: 8 }]}>Loading add-ons...</Text>
      </View>
    ) : addons.length > 0 ? (
      <View style={{ marginTop: 8 }}>
        <Text style={styles.sectionLabel}>Add-ons (Optional)</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
          {addons
            .filter((addon) => {
              return (
                isAddonAvailableForCategory(addon, van?.id) &&
                isAddonAvailableForDays(addon, rentalDays)
              );
            })
            .map((addon) => {
              const selection = addonSelections[addon._id];
              const isSelected = !!selection;
              
              // Check if another addon with the same type is already selected
              const addonType = (addon as any).type;
              const isTypeDisabled = addonType && Object.entries(addonSelections).some(([id]) => {
                if (id === addon._id) return false;
                const selectedAddon = addons.find((a) => a._id === id);
                return selectedAddon && (selectedAddon as any).type === addonType;
              });
              
              const displayPrice =
                pickupDate && returnDate && pickupTime && returnTime
                  ? getAddonDisplayPrice(
                      addon,
                      pickupDate,
                      returnDate,
                      pickupTime,
                      returnTime
                    )
                  : getAddonDisplayPrice(addon);
              const calculatedPrice =
                pickupDate &&
                returnDate &&
                pickupTime &&
                returnTime &&
                isSelected
                  ? calculateAddonPrice(
                      addon,
                      pickupDate,
                      returnDate,
                      pickupTime,
                      returnTime,
                      1
                    )
                  : 0;

              return (
                <Pressable
                  key={addon._id}
                  onPress={() => {
                    if (isTypeDisabled) return;
                    Haptics.selectionAsync();
                    if (isSelected) {
                      const newSelections = { ...addonSelections };
                      delete newSelections[addon._id];
                      setAddonSelections(newSelections);
                    } else {
                      setAddonSelections({
                        ...addonSelections,
                        [addon._id]: {
                          quantity: 1,
                          selectedTierIndex: getMatchingAddonTierIndex(
                            addon,
                            rentalDays,
                          ),
                        },
                      });
                    }
                  }}
                  disabled={!!isTypeDisabled}
                  style={{
                    width: "48%",
                    backgroundColor: isSelected
                      ? "rgba(254,154,0,0.15)"
                      : "rgba(255,255,255,0.05)",
                    borderRadius: 11,
                    padding: 10,
                    borderWidth: 1.5,
                    borderColor: isSelected ? ACCENT : "rgba(255,255,255,0.1)",
                    opacity: isTypeDisabled ? 0.4 : 1,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: "#f9fafb",
                        fontSize: 12,
                        fontWeight: "700",
                        flex: 1,
                      }}
                    >
                      {addon.name}
                    </Text>
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor: isSelected
                          ? ACCENT
                          : "rgba(255,255,255,0.1)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color={DARK} />
                      )}
                    </View>
                  </View>
                  <Text
                    style={{ color: "#9ca3af", fontSize: 10, marginBottom: 4 }}
                    numberOfLines={2}
                  >
                    {addon.description}
                  </Text>
                  <Text
                    style={{ color: ACCENT, fontSize: 11, fontWeight: "800" }}
                  >
                    {displayPrice}
                  </Text>
                  {isSelected && calculatedPrice > 0 && (
                    <View
                      style={{
                        backgroundColor: "rgba(254,154,0,0.1)",
                        borderRadius: 6,
                        padding: 5,
                        marginTop: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: "#f9fafb",
                          fontSize: 10,
                          fontWeight: "600",
                          textAlign: "center",
                        }}
                      >
                        Total: £{calculatedPrice.toFixed(2)}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
        </View>
      </View>
    ) : null}

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Message (Optional)</Text>
      <View
        style={[
          styles.inputWrapper,
          focusedInput === "message" && styles.inputFocused,
          { minHeight: 64, alignItems: "flex-start" },
        ]}
      >
        <Ionicons
          name="chatbox-outline"
          size={18}
          color={focusedInput === "message" ? ACCENT : "#9ca3af"}
          style={{ marginTop: 7 }}
        />
        <TextInput
          placeholder="Add any special requests or notes..."
          placeholderTextColor="#6b7280"
          value={message}
          onChangeText={setMessage}
          onFocus={() => {
            Haptics.selectionAsync();
            setFocusedInput("message");
          }}
          onBlur={() => setFocusedInput(null)}
          style={[styles.input, { minHeight: 48, textAlignVertical: "top" }]}
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  </>
  );
};
