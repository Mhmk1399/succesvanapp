import React from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { AddOn, Office, User } from "@/types/type";
import { styles } from "./styles";
import { ACCENT, DARK } from "./constants";
import { formatDate, formatTime } from "./utils";
import { PickerField } from "./types";

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
  pickupTime: Date | null;
  returnDate: Date | null;
  returnTime: Date | null;
  pickerField: PickerField;
  openPicker: (field: PickerField, mode: "date" | "time") => void;
  addons: AddOn[];
  selectedAddons: string[];
  setSelectedAddons: (v: string[]) => void;
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
  pickerField,
  openPicker,
  addons,
  selectedAddons,
  setSelectedAddons,
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
          <Text style={styles.label}>Driver Age (25-75)</Text>
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

        <Text style={styles.sectionLabel}>Pickup</Text>
        {errors.pickup && <Text style={styles.errorText}>{errors.pickup}</Text>}
        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Date</Text>
            <Pressable
              onPress={() => openPicker("pickupDate", "date")}
              style={[
                styles.inputWrapper,
                pickerField === "pickupDate" && styles.inputFocused,
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={pickupDate ? ACCENT : "#9ca3af"}
              />
              <Text style={[styles.input, !pickupDate && { color: "#6b7280" }]}>
                {formatDate(pickupDate)}
              </Text>
            </Pressable>
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Time</Text>
            <Pressable
              onPress={() => openPicker("pickupTime", "time")}
              style={[
                styles.inputWrapper,
                pickerField === "pickupTime" && styles.inputFocused,
              ]}
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
        </View>

        <Text style={styles.sectionLabel}>Return</Text>
        {errors.return && <Text style={styles.errorText}>{errors.return}</Text>}
        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Date</Text>
            <Pressable
              onPress={() => openPicker("returnDate", "date")}
              style={[
                styles.inputWrapper,
                pickerField === "returnDate" && styles.inputFocused,
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={returnDate ? ACCENT : "#9ca3af"}
              />
              <Text style={[styles.input, !returnDate && { color: "#6b7280" }]}>
                {formatDate(returnDate)}
              </Text>
            </Pressable>
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Time</Text>
            <Pressable
              onPress={() => openPicker("returnTime", "time")}
              style={[
                styles.inputWrapper,
                pickerField === "returnTime" && styles.inputFocused,
              ]}
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

    {addons.length > 0 && (
      <View style={{ marginTop: 10 }}>
        <Text style={styles.sectionLabel}>Add-ons (Optional)</Text>
        {addons.map((addon) => {
          const isSelected = selectedAddons.includes(addon._id);
          return (
            <Pressable
              key={addon._id}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedAddons(
                  isSelected
                    ? selectedAddons.filter((id) => id !== addon._id)
                    : [...selectedAddons, addon._id]
                );
              }}
              style={[styles.addonCard, isSelected && styles.addonCardSelected]}
            >
              <View style={styles.addonInfo}>
                <Text style={styles.addonName}>{addon.name}</Text>
                <Text style={styles.addonDesc}>{addon.description}</Text>
                <Text style={styles.addonPrice}>
                  {addon.pricingType === "flat"
                    ? `£${addon.flatPrice}`
                    : "Tiered pricing"}
                </Text>
              </View>
              <View
                style={[styles.checkbox, isSelected && styles.checkboxSelected]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color={DARK} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    )}
  </>
);
