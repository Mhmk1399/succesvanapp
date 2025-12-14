import React from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AddOn, Office, User } from "@/types/type";
import { styles } from "./styles";
import { ACCENT, DARK } from "./constants";
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
  addonSelections: Record<string, { quantity: number; tierId?: string }>;
  setAddonSelections: (v: Record<string, { quantity: number; tierId?: string }>) => void;
  isLoadingData: boolean;
  message: string;
  setMessage: (v: string) => void;
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
}: FormFieldsProps) => (
  <>
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Full Name</Text>
      <View
        style={[
          styles.inputWrapper,
          focusedInput === "name" && styles.inputFocused,
          user && styles.inputDisabled,
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
          editable={!user}
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
          user && styles.inputDisabled,
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
          editable={!user}
        />
      </View>
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
    </View>

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
          <Text style={styles.label}>Driver Age (25-70)</Text>
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
              placeholder="Enter driver age"
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
          <Ionicons name="calendar-outline" size={18} color={pickupDate && returnDate ? ACCENT : "#9ca3af"} />
          <Text style={[styles.input, (!pickupDate || !returnDate) && { color: "#6b7280" }]}>
            {pickupDate && returnDate ? `${formatDate(pickupDate)} - ${formatDate(returnDate)}` : "Select dates"}
          </Text>
        </Pressable>

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Pickup Time</Text>
            <Pressable onPress={() => openTimePicker("pickupTime")} style={styles.inputWrapper}>
              <Ionicons name="time-outline" size={18} color={pickupTime ? ACCENT : "#9ca3af"} />
              <Text style={[styles.input, !pickupTime && { color: "#6b7280" }]}>{formatTime(pickupTime)}</Text>
            </Pressable>
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Return Time</Text>
            <Pressable onPress={() => openTimePicker("returnTime")} style={styles.inputWrapper}>
              <Ionicons name="time-outline" size={18} color={returnTime ? ACCENT : "#9ca3af"} />
              <Text style={[styles.input, !returnTime && { color: "#6b7280" }]}>{formatTime(returnTime)}</Text>
            </Pressable>
          </View>
        </View>
      </>
    )}

    {isLoadingData ? (
      <View style={{ marginTop: 10, alignItems: "center", paddingVertical: 20 }}>
        <ActivityIndicator color={ACCENT} size="small" />
        <Text style={[styles.label, { marginTop: 8 }]}>Loading add-ons...</Text>
      </View>
    ) : addons.length > 0 ? (
      <View style={{ marginTop: 10 }}>
        <Text style={styles.sectionLabel}>Add-ons (Optional)</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {addons.map((addon) => {
            const selection = addonSelections[addon._id];
            const isSelected = !!selection;
            return (
              <Pressable
                key={addon._id}
                onPress={() => {
                  Haptics.selectionAsync();
                  if (isSelected) {
                    const newSelections = { ...addonSelections };
                    delete newSelections[addon._id];
                    setAddonSelections(newSelections);
                  } else {
                    setAddonSelections({
                      ...addonSelections,
                      [addon._id]: { quantity: 1, tierId: addon.tiers?.[0]?._id },
                    });
                  }
                }}
                style={{
                  width: "48%",
                  backgroundColor: isSelected ? "rgba(254,154,0,0.15)" : "rgba(255,255,255,0.05)",
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1.5,
                  borderColor: isSelected ? ACCENT : "rgba(255,255,255,0.1)",
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <Text style={{ color: "#f9fafb", fontSize: 13, fontWeight: "700", flex: 1 }}>{addon.name}</Text>
                  <View style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: isSelected ? ACCENT : "rgba(255,255,255,0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    {isSelected && <Ionicons name="checkmark" size={14} color={DARK} />}
                  </View>
                </View>
                <Text style={{ color: "#9ca3af", fontSize: 10, marginBottom: 6 }} numberOfLines={2}>{addon.description}</Text>
                <Text style={{ color: ACCENT, fontSize: 12, fontWeight: "700" }}>
                  {addon.pricingType === "flat" ? `£${addon.flatPrice}` : "From £" + (addon.tiers?.[0]?.price || 0)}
                </Text>
                {isSelected && (
                  <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", gap: 6 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          Haptics.selectionAsync();
                          if (selection.quantity > 1) {
                            setAddonSelections({
                              ...addonSelections,
                              [addon._id]: { ...selection, quantity: selection.quantity - 1 },
                            });
                          }
                        }}
                        style={{ backgroundColor: "rgba(254,154,0,0.2)", borderRadius: 6, padding: 4 }}
                      >
                        <Ionicons name="remove" size={12} color={ACCENT} />
                      </Pressable>
                      <Text style={{ color: "#f9fafb", fontSize: 13, fontWeight: "700", minWidth: 24, textAlign: "center" }}>
                        {selection.quantity}
                      </Text>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          Haptics.selectionAsync();
                          setAddonSelections({
                            ...addonSelections,
                            [addon._id]: { ...selection, quantity: selection.quantity + 1 },
                          });
                        }}
                        style={{ backgroundColor: "rgba(254,154,0,0.2)", borderRadius: 6, padding: 4 }}
                      >
                        <Ionicons name="add" size={12} color={ACCENT} />
                      </Pressable>
                    </View>
                    {addon.pricingType === "tiered" && addon.tiers && addon.tiers.length > 0 && (
                      <View style={{ gap: 4 }}>
                        {addon.tiers.map((tier) => (
                          <Pressable
                            key={tier._id}
                            onPress={(e) => {
                              e.stopPropagation();
                              Haptics.selectionAsync();
                              setAddonSelections({
                                ...addonSelections,
                                [addon._id]: { ...selection, tierId: tier._id },
                              });
                            }}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                              backgroundColor: selection.tierId === tier._id ? "rgba(254,154,0,0.25)" : "rgba(255,255,255,0.05)",
                              borderRadius: 6,
                              paddingVertical: 4,
                              paddingHorizontal: 8,
                              borderWidth: 1,
                              borderColor: selection.tierId === tier._id ? ACCENT : "transparent",
                            }}
                          >
                            <Text style={{ color: "#e5e7eb", fontSize: 10, fontWeight: "500" }}>
                              {tier.minDays}-{tier.maxDays}d
                            </Text>
                            <Text style={{ color: ACCENT, fontSize: 11, fontWeight: "700" }}>
                              £{tier.price}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
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
          { minHeight: 80, alignItems: "flex-start" },
        ]}
      >
        <Ionicons
          name="chatbox-outline"
          size={18}
          color={focusedInput === "message" ? ACCENT : "#9ca3af"}
          style={{ marginTop: 8 }}
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
          style={[styles.input, { minHeight: 60, textAlignVertical: "top" }]}
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  </>
);
