import { AddOnOption, CategorySuggestion, SelectedAddOn, useFastAgent } from "@/hooks/useFastAgent";
import { Ionicons } from "@expo/vector-icons";
import GlassView from "@/components/global/GlassView";
import { useToast } from "@/components/global/AppToast";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
 } from "react-native";
import VanList, { Van } from "./vanlist";

const { height } = Dimensions.get("window");
const ACCENT = "#fe9a00";
const DARK = "#0f172a";

type AIBookingFlowProps = {
  visible: boolean;
  onClose: () => void;
  onComplete?: (reservationId: string, userToken: string, isNewUser: boolean) => void;
};

export default function AIBookingFlow({
  visible,
  onClose,
  onComplete,
}: AIBookingFlowProps) {
  const { showToast } = useToast();
  const {
    isLoading,
    isRecording,
    isPlaying,
    messages,
    agentState,
    offices,
    sendMessage,
    sendVoiceMessage,
    startRecording,
    stopRecording,
    selectCategory,
    submitBooking,
    confirmAddOns,
    skipAddOns,
    selectGear,
    confirmReceipt,
    sendCode,
    verifyCode,
    reset,
  } = useFastAgent();

  const [hasStarted, setHasStarted] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [bookingForm, setBookingForm] = useState({
    officeId: "",
    startDate: "",
    endDate: "",
    startTime: "10:00",
    endTime: "10:00",
    driverAge: 25,
  });
  const [addOnQuantities, setAddOnQuantities] = useState<Record<string, number>>({});
  const [selectedGearType, setSelectedGearType] = useState<"manual" | "automatic">("manual");

  const translateY = useRef(new Animated.Value(height)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: height,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Start conversation when modal opens
  useEffect(() => {
    if (visible && !hasStarted) {
      setHasStarted(true);
      sendMessage("start");
    }
  }, [visible, hasStarted, sendMessage]);

  // Sync booking form with agent state
  useEffect(() => {
    if (agentState.booking) {
      setBookingForm(prev => ({
        officeId: agentState.booking.officeId || prev.officeId,
        startDate: agentState.booking.startDate || prev.startDate,
        endDate: agentState.booking.endDate || prev.endDate,
        startTime: agentState.booking.startTime || prev.startTime,
        endTime: agentState.booking.endTime || prev.endTime,
        driverAge: agentState.booking.driverAge || prev.driverAge,
      }));
    }
  }, [agentState.booking]);

  // Initialize gear type when category is selected
  useEffect(() => {
    if (agentState.selectedCategory) {
      const gear = agentState.selectedCategory.gear;
      if (typeof gear !== "string" && gear.availableTypes?.length > 0) {
        setSelectedGearType(gear.availableTypes[0] as "manual" | "automatic");
      }
    }
  }, [agentState.selectedCategory]);

  // Handle completion
  useEffect(() => {
    if (agentState.phase === "complete" && agentState.reservationId) {
      setTimeout(() => {
        onComplete?.(
          agentState.reservationId!,
          agentState.userToken || "",
          agentState.isNewUser || false
        );
      }, 2500);
    }
  }, [agentState, onComplete]);

  const handleClose = () => {
    reset();
    setHasStarted(false);
    onClose();
  };

  const handleVanSelect = async (suggestion: CategorySuggestion) => {
    await Haptics.selectionAsync();
    await selectCategory(suggestion._id);
  };

  const handleBookingSubmit = async (e?: any) => {
    e?.preventDefault?.();
    if (!bookingForm.officeId || !bookingForm.startDate || !bookingForm.endDate) {
      showToast({
        type: "error",
        title: "Missing information",
        message: "Please fill in all required fields.",
      });
      return;
    }
    await submitBooking(bookingForm);
  };

  const handleGearSelection = () => {
    const extraCost = getGearExtraCost();
    selectGear(selectedGearType, extraCost);
  };

  // Get gear extra cost
  const getGearExtraCost = (): number => {
    if (!agentState.selectedCategory) return 0;
    const gear = agentState.selectedCategory.gear;
    if (typeof gear === "string") return 0;
    if (selectedGearType === "automatic" && gear.availableTypes?.includes("automatic") && gear.availableTypes?.includes("manual")) {
      const totalDays = agentState.booking.totalDays || 1;
      return (gear.automaticExtraCost || 0) * totalDays;
    }
    return 0;
  };

  // Calculate add-on price based on rental days
  const getAddOnPrice = (addOn: AddOnOption): number => {
    const totalDays = agentState.booking.totalDays || 1;
    
    if (addOn.pricingType === "flat") {
      const amount = addOn.flatPrice?.amount || 0;
      return addOn.flatPrice?.isPerDay ? amount * totalDays : amount;
    }
    
    if (addOn.tieredPrice?.tiers && addOn.tieredPrice.tiers.length > 0) {
      const tier = addOn.tieredPrice.tiers.find(t => totalDays >= t.minDays && totalDays <= t.maxDays);
      const tierPrice = tier?.price || addOn.tieredPrice.tiers[0].price || 0;
      return addOn.tieredPrice.isPerDay ? tierPrice * totalDays : tierPrice;
    }
    
    return 0;
  };

  // Handle add-on quantity change
  const handleAddOnQuantityChange = (addOnId: string, delta: number) => {
    setAddOnQuantities(prev => {
      const current = prev[addOnId] || 0;
      const newVal = Math.max(0, current + delta);
      return { ...prev, [addOnId]: newVal };
    });
  };

  // Handle confirm add-ons
  const handleConfirmAddOns = async () => {
    const selectedAddOns: SelectedAddOn[] = [];
    
    for (const addOn of agentState.availableAddOns || []) {
      const quantity = addOnQuantities[addOn._id] || 0;
      if (quantity > 0) {
        const pricePerUnit = getAddOnPrice(addOn);
        selectedAddOns.push({
          addOnId: addOn._id,
          name: addOn.name,
          quantity,
          pricePerUnit,
          totalPrice: pricePerUnit * quantity,
        });
      }
    }
    
    await confirmAddOns(selectedAddOns);
  };

  const handlePhoneSubmit = async () => {
    if (phoneInput.length < 10) {
      showToast({
        type: "error",
        title: "Invalid phone",
        message: "Please enter a valid phone number.",
      });
      return;
    }
    await sendCode(phoneInput);
  };

  const handleCodeSubmit = async () => {
    if (codeInput.length < 6) {
      showToast({
        type: "error",
        title: "Invalid code",
        message: "Please enter the 6-digit code.",
      });
      return;
    }
    await verifyCode(codeInput);
    if (agentState.phase === "complete") {
      onComplete?.(
        agentState.reservationId || "",
        agentState.userToken || "",
        agentState.isNewUser || false
      );
      handleClose();
    }
  };

  const handleVoiceRecording = async () => {
    if (isRecording) {
      // Stop recording and send
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const audioBase64 = await stopRecording();
      if (audioBase64) {
        // Use different handler based on current phase
        let action;
        if (agentState.phase === "collect_booking") {
          action = "voice_booking";
        } else if (agentState.phase === "verify_phone") {
          action = "voice_phone";
        }
        await sendVoiceMessage(audioBase64, action);
      }
    } else {
      // Start recording
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await startRecording();
    }
  };

  // Get phase progress
  const getPhaseProgress = (phase: string): number => {
    switch (phase) {
      case "ask_needs": return 10;
      case "show_suggestions": return 25;
      case "collect_booking": return 40;
      case "select_gear": return 50;
      case "select_addons": return 55;
      case "show_receipt": return 70;
      case "verify_phone": return 85;
      case "complete": return 100;
      default: return 0;
    }
  };

  const today = new Date().toISOString().split("T")[0];

  // Convert CategorySuggestion to Van type
  const convertToVan = (suggestion: CategorySuggestion): Van => {
    // Handle gear type conversion
    let gearValue: Van['gear'];
    if (typeof suggestion.gear === 'string') {
      gearValue = suggestion.gear;
    } else if (suggestion.gear && typeof suggestion.gear === 'object') {
      gearValue = {
        availableTypes: suggestion.gear.availableTypes.filter(
          (type): type is 'manual' | 'automatic' => type === 'manual' || type === 'automatic'
        ),
        automaticExtraCost: suggestion.gear.automaticExtraCost || 0,
      };
    } else {
      gearValue = undefined;
    }

    return {
      id: suggestion._id,
      name: suggestion.name,
      image: suggestion.image || require("@/assets/images/van.png"),
      seats: suggestion.seats,
      fuel: suggestion.fuel,
      expert: suggestion.matchReason || "",
      doors: suggestion.doors,
      gear: gearValue,
      pricingTiers: suggestion.pricingTiers,
      extraHoursRate: suggestion.extrahoursRate,
    };
  };

  const renderPhaseContent = () => {
    switch (agentState.phase) {
      case "ask_needs":
        return null;

      case "show_suggestions":
        return (
          <View style={styles.vanListContainer}>
            <Text style={styles.suggestionsTitle}>
              🎯 AI Matched Vans for You
            </Text>
            <VanList
              vans={agentState.suggestions?.map(convertToVan) || []}
              onSelectVan={(van) => {
                const suggestion = agentState.suggestions?.find(
                  (s) => s._id === van.id
                );
                if (suggestion) handleVanSelect(suggestion);
              }}
            />
          </View>
        );

      case "collect_booking":
        return (
          <ScrollView style={styles.bookingFormContainer} contentContainerStyle={styles.bookingFormContent}>
            {/* Selected Category Summary */}
            {agentState.selectedCategory && (
              <View style={styles.selectedCategoryBox}>
                <Ionicons name="car" size={24} color={ACCENT} />
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{agentState.selectedCategory.name}</Text>
                  <Text style={styles.categoryReason}>{agentState.selectedCategory.matchReason}</Text>
                </View>
              </View>
            )}
            
            {/* Office Select */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>📍 Pickup Location *</Text>
              <View style={styles.selectContainer}>
                <Ionicons name="location" size={20} color={ACCENT} style={styles.selectIcon} />
                <Text style={styles.selectText}>
                  {bookingForm.officeId ? offices.find(o => o._id === bookingForm.officeId)?.name || "Select office" : "Select office"}
                </Text>
              </View>
              {offices.map((office) => (
                <Pressable
                  key={office._id}
                  style={[styles.optionButton, bookingForm.officeId === office._id && styles.selectedOption]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setBookingForm(p => ({ ...p, officeId: office._id }));
                  }}
                >
                  <Ionicons name={bookingForm.officeId === office._id ? "checkmark-circle" : "ellipse-outline"} size={18} color={bookingForm.officeId === office._id ? ACCENT : "#9ca3af"} />
                  <Text style={[styles.optionText, bookingForm.officeId === office._id && styles.selectedOptionText]}>
                    {office.name}
                  </Text>
                </Pressable>
              ))}
            </View>
            
            {/* Dates */}
            <View style={styles.dateRow}>
              <View style={styles.dateGroup}>
                <Text style={styles.formLabel}>📅 Pickup Date *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={bookingForm.startDate}
                  onChangeText={(text) => setBookingForm(p => ({ ...p, startDate: text }))}
                />
              </View>
              <View style={styles.dateGroup}>
                <Text style={styles.formLabel}>📅 Return Date *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={bookingForm.endDate}
                  onChangeText={(text) => setBookingForm(p => ({ ...p, endDate: text }))}
                />
              </View>
            </View>
            
            {/* Times */}
            <View style={styles.dateRow}>
              <View style={styles.dateGroup}>
                <Text style={styles.formLabel}>🕐 Pickup Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10:00"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={bookingForm.startTime}
                  onChangeText={(text) => setBookingForm(p => ({ ...p, startTime: text }))}
                />
              </View>
              <View style={styles.dateGroup}>
                <Text style={styles.formLabel}>🕐 Return Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10:00"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={bookingForm.endTime}
                  onChangeText={(text) => setBookingForm(p => ({ ...p, endTime: text }))}
                />
              </View>
            </View>
            
            {/* Driver Age */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>👤 Driver Age *</Text>
              <TextInput
                style={styles.input}
                placeholder="23-80"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={bookingForm.driverAge.toString()}
                onChangeText={(text) => setBookingForm(p => ({ ...p, driverAge: parseInt(text) || 25 }))}
                keyboardType="number-pad"
              />
            </View>
            
            <Pressable
              style={[styles.button, styles.confirmButton, styles.submitButton, (isLoading || !bookingForm.officeId || !bookingForm.startDate || !bookingForm.endDate) && styles.buttonDisabled]}
              onPress={handleBookingSubmit}
              disabled={isLoading || !bookingForm.officeId || !bookingForm.startDate || !bookingForm.endDate}
            >
              <Ionicons name="calendar" size={20} color="#fff" />
              <Text style={styles.buttonText}>Continue to Gear Selection</Text>
            </Pressable>
          </ScrollView>
        );

      case "select_gear":
        if (!agentState.selectedCategory) return null;
        
        const gear = agentState.selectedCategory.gear;
        const hasGearOptions = typeof gear !== "string" && gear.availableTypes?.length > 1;
        
        // If no gear options, auto-advance
        if (!hasGearOptions) {
          const defaultGear = typeof gear === "string" ? "manual" : (gear.availableTypes?.[0] as "manual" | "automatic" || "manual");
          selectGear(defaultGear, 0);
          return null;
        }
        
        return (
          <ScrollView contentContainerStyle={styles.phaseContentScroll}>
            <View style={styles.iconCircle}>
              <Ionicons name="settings" size={40} color={ACCENT} />
            </View>
            <Text style={styles.phaseTitle}>⚙️ Select Gear Type</Text>
            <Text style={styles.phaseSubtitle}>Choose your preferred transmission</Text>
            
            {/* Vehicle Info */}
            <View style={styles.selectedCategoryBox}>
              <Ionicons name="car" size={24} color={ACCENT} />
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{agentState.selectedCategory.name}</Text>
                <Text style={styles.categoryReason}>
                  {agentState.booking.totalDays} day(s) rental
                </Text>
              </View>
            </View>
            
            {/* Gear Options */}
            <View style={styles.gearOptionsContainer}>
              {typeof gear !== "string" && gear.availableTypes?.map((type) => {
                const isSelected = selectedGearType === type;
                const extraCost = type === "automatic" && gear.automaticExtraCost ? gear.automaticExtraCost : 0;
                const totalDays = agentState.booking.totalDays || 1;
                const totalExtraCost = extraCost * totalDays;
                
                return (
                  <Pressable
                    key={type}
                    style={[styles.gearOptionButton, isSelected && styles.selectedGearOption]}
                    onPress={() => setSelectedGearType(type as "manual" | "automatic")}
                  >
                    <View style={styles.gearOptionContent}>
                      <Text style={styles.gearOptionTitle}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                      {extraCost > 0 ? (
                        <Text style={styles.gearOptionPrice}>
                          +£{extraCost}/day (£{totalExtraCost} total)
                        </Text>
                      ) : (
                        <Text style={styles.gearOptionIncluded}>Included</Text>
                      )}
                    </View>
                    {isSelected && <Ionicons name="checkmark" size={24} color={ACCENT} />}
                  </Pressable>
                );
              })}
            </View>
            
            <Pressable
              style={[styles.button, styles.confirmButton]}
              onPress={handleGearSelection}
              disabled={isLoading}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.buttonText}>Continue to Add-ons</Text>
            </Pressable>
          </ScrollView>
        );

      case "select_addons":
        return (
          <ScrollView style={styles.addonsContainer} contentContainerStyle={styles.addonsContent}>
            <View style={styles.addonsHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="add-circle" size={40} color={ACCENT} />
              </View>
              <Text style={styles.phaseTitle}>📦 Optional Add-ons</Text>
              <Text style={styles.phaseSubtitle}>Enhance your rental experience</Text>
            </View>
            
            {/* Add-ons List */}
            <View style={styles.addonsList}>
              {agentState.availableAddOns?.map((addOn) => {
                const price = getAddOnPrice(addOn);
                const quantity = addOnQuantities[addOn._id] || 0;
                
                return (
                  <View key={addOn._id} style={styles.addonItem}>
                    <View style={styles.addonInfo}>
                      <Text style={styles.addonName}>{addOn.name}</Text>
                      {addOn.description && (
                        <Text style={styles.addonDescription}>{addOn.description}</Text>
                      )}
                      <Text style={styles.addonPrice}>
                        £{price.toFixed(2)} {addOn.pricingType === "flat" ? "" : "/ rental"}
                      </Text>
                    </View>
                    
                    {/* Quantity Controls */}
                    <View style={styles.quantityControls}>
                      <Pressable
                        style={[styles.quantityButton, quantity === 0 && styles.quantityButtonDisabled]}
                        onPress={() => handleAddOnQuantityChange(addOn._id, -1)}
                        disabled={quantity === 0}
                      >
                        <Ionicons name="remove" size={16} color={quantity === 0 ? "#666" : "#fff"} />
                      </Pressable>
                      <Text style={styles.quantityText}>{quantity}</Text>
                      <Pressable
                        style={styles.quantityButton}
                        onPress={() => handleAddOnQuantityChange(addOn._id, 1)}
                      >
                        <Ionicons name="add" size={16} color="#fff" />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
            
            {/* Total for selected add-ons */}
            {Object.values(addOnQuantities).some(q => q > 0) && (
              <View style={styles.addonsTotal}>
                <Text style={styles.addonsTotalLabel}>Add-ons Total:</Text>
                <Text style={styles.addonsTotalValue}>
                  £{(agentState.availableAddOns || []).reduce((sum, addOn) => {
                    const qty = addOnQuantities[addOn._id] || 0;
                    return sum + (getAddOnPrice(addOn) * qty);
                  }, 0).toFixed(2)}
                </Text>
              </View>
            )}
            
            {/* Buttons */}
            <View style={styles.addonButtons}>
              <Pressable
                style={[styles.button, styles.skipButton]}
                onPress={skipAddOns}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Skip</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.confirmButton]}
                onPress={handleConfirmAddOns}
                disabled={isLoading}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.buttonText}>Continue</Text>
              </Pressable>
            </View>
          </ScrollView>
        );

      case "show_receipt":
        return (
          <ScrollView contentContainerStyle={styles.phaseContentScroll}>
            <View style={styles.iconCircle}>
              <Ionicons name="receipt" size={40} color={ACCENT} />
            </View>
            <Text style={styles.phaseTitle}>Booking Summary</Text>
            <View style={styles.receiptBox}>
              <Text style={styles.receiptText}>
                {agentState.booking.priceBreakdown || "Calculating..."}
              </Text>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>
                  £{agentState.booking.totalPrice?.toFixed(2) || "0.00"}
                </Text>
              </View>
            </View>
            <Pressable
              style={[styles.button, styles.confirmButton]}
              onPress={confirmReceipt}
            >
              <Text style={styles.buttonText}>Confirm Booking</Text>
            </Pressable>
          </ScrollView>
        );

      case "verify_phone":
        return (
          <ScrollView contentContainerStyle={styles.phaseContentScroll}>
            <View style={styles.iconCircle}>
              <Ionicons name="phone-portrait" size={40} color={ACCENT} />
            </View>
            <Text style={styles.phaseTitle}>Phone Verification</Text>
            {!agentState.verificationSent ? (
              <>
                <Text style={styles.phaseSubtitle}>
                  Enter your phone number to receive a verification code
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={phoneInput}
                  onChangeText={setPhoneInput}
                  keyboardType="phone-pad"
                />
                <Pressable
                  style={[styles.button, styles.confirmButton]}
                  onPress={handlePhoneSubmit}
                >
                  <Text style={styles.buttonText}>Send Code</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.phaseSubtitle}>
                  Enter the 6-digit code sent to your phone
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Verification Code"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={codeInput}
                  onChangeText={setCodeInput}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Pressable
                  style={[styles.button, styles.confirmButton]}
                  onPress={handleCodeSubmit}
                >
                  <Text style={styles.buttonText}>Verify</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        );

      case "complete":
        return (
          <ScrollView contentContainerStyle={styles.phaseContentScroll}>
            <View style={[styles.iconCircle, { backgroundColor: "#22c55e" }]}>
              <Ionicons name="checkmark-circle" size={40} color="#fff" />
            </View>
            <Text style={styles.phaseTitle}>Booking Complete!</Text>
            <Text style={styles.phaseSubtitle}>
              Your reservation has been confirmed
            </Text>
            <Text style={styles.reservationId}>
              ID: {agentState.reservationId}
            </Text>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <GlassView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      </Animated.View>

      <Animated.View
        style={[styles.container, { transform: [{ translateY }, { scale: scaleAnim }] }]}
      >
        <GlassView intensity={80} tint="dark" style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>🤖 AI Van Consultant</Text>
              <Text style={styles.headerSubtitle}>Quick Booking in 1 Minute</Text>
            </View>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>
          
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[styles.progressFill, { width: `${getPhaseProgress(agentState.phase)}%` }]}
              />
            </View>
          </View>

          {/* Messages */}
          <ScrollView
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.map((msg, idx) => (
              <View
                key={idx}
                style={[
                  styles.messageBubble,
                  msg.role === "user" ? styles.userMessage : styles.aiMessage,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.role === "user" && styles.userMessageText,
                  ]}
                >
                  {msg.content}
                </Text>
              </View>
            ))}
            {isLoading && (
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color={ACCENT} />
              </View>
            )}
          </ScrollView>

          {/* Phase Content */}
          {renderPhaseContent()}

          {/* Voice Recording Button - show for voice input phases */}
          {(agentState.phase === "ask_needs" || agentState.phase === "collect_booking" || agentState.phase === "verify_phone") && (
            <View style={styles.voiceContainer}>
              <View style={styles.voiceHint}>
                <Text style={styles.voiceHintText}>
                  {isRecording ? (
                    <Text style={styles.recordingText}>🔴 Recording...</Text>
                  ) : isPlaying ? (
                    "🔊 Speaking..."
                  ) : agentState.phase === "ask_needs" ? (
                    'Say: "I need to move 20 boxes" or "Moving furniture"'
                  ) : agentState.phase === "collect_booking" ? (
                    'Or speak: "Tomorrow at 10am, return Friday 5pm"'
                  ) : agentState.phase === "verify_phone" && !agentState.verificationSent ? (
                    'Or speak: "My number is 07123456789"'
                  ) : (
                    "Tap to speak"
                  )}
                </Text>
              </View>
              
              <Pressable
                style={[
                  styles.voiceButton,
                  isRecording && styles.voiceButtonRecording,
                ]}
                onPress={handleVoiceRecording}
                disabled={isLoading || isPlaying || agentState.verificationSent}
              >
                {isRecording ? (
                  <View style={styles.recordingIndicator}>
                    <View style={styles.recordingPulse} />
                    <Ionicons name="stop" size={28} color="#fff" />
                  </View>
                ) : (
                  <Ionicons name="mic" size={28} color="#fff" />
                )}
              </Pressable>
            </View>
          )}
        </GlassView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  container: {
    flex: 1,
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: ACCENT,
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 16,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    maxWidth: "80%",
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: ACCENT,
  },
  aiMessage: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  messageText: {
    color: "#fff",
    fontSize: 14,
  },
  userMessageText: {
    color: DARK,
  },
  loadingBubble: {
    alignSelf: "flex-start",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  phaseContent: {
    flex: 1,
  },
  phaseContentScroll: {
    padding: 20,
    paddingBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  vanListContainer: {
    flex: 1,
  },
  suggestionsTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    padding: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(254,154,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  phaseTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  phaseSubtitle: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 20,
  },
  gearOptions: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
  },
  // Progress Bar
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  
  // Booking Form
  bookingFormContainer: {
    flex: 1,
  },
  bookingFormContent: {
    padding: 20,
  },
  selectedCategoryBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(254,154,0,0.1)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.3)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  categoryReason: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 2,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  selectContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  selectIcon: {
    marginRight: 12,
  },
  selectText: {
    color: "#fff",
    fontSize: 16,
    flex: 1,
  },
  optionButton: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  selectedOption: {
    backgroundColor: "rgba(254,154,0,0.15)",
    borderWidth: 2,
    borderColor: ACCENT,
  },
  optionText: {
    color: "#e5e7eb",
    fontSize: 14,
    flex: 1,
  },
  selectedOptionText: {
    color: "#fff",
    fontWeight: "600",
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  dateGroup: {
    flex: 1,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
  },
  
  // Gear Selection
  gearOptionsContainer: {
    width: "100%",
    gap: 12,
    marginBottom: 20,
  },
  gearOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
  },
  selectedGearOption: {
    borderColor: ACCENT,
    backgroundColor: "rgba(254,154,0,0.1)",
  },
  gearOptionContent: {
    flex: 1,
  },
  gearOptionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  gearOptionPrice: {
    color: ACCENT,
    fontSize: 14,
    marginTop: 4,
  },
  gearOptionIncluded: {
    color: "#22c55e",
    fontSize: 14,
    marginTop: 4,
  },
  
  // Add-ons
  addonsContainer: {
    flex: 1,
  },
  addonsContent: {
    padding: 20,
  },
  addonsHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  addonsList: {
    gap: 12,
    marginBottom: 20,
  },
  addonItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 16,
  },
  addonInfo: {
    flex: 1,
  },
  addonName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  addonDescription: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 2,
  },
  addonPrice: {
    color: ACCENT,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  quantityText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    minWidth: 24,
    textAlign: "center",
  },
  addonsTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    marginBottom: 20,
  },
  addonsTotalLabel: {
    color: "#e5e7eb",
    fontSize: 14,
  },
  addonsTotalValue: {
    color: ACCENT,
    fontSize: 16,
    fontWeight: "700",
  },
  
  // Examples
  examplesContainer: {
    width: "100%",
    marginTop: 20,
    gap: 8,
  },
  examplesTitle: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  exampleButton: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.3)",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  exampleIcon: {
    opacity: 0.6,
  },
  exampleText: {
    color: ACCENT,
    fontSize: 13,
    fontStyle: "italic",
    flex: 1,
  },
  
  loadingContainer: {
    alignItems: "center",
    gap: 12,
    marginTop: 20,
  },
  loadingText: {
    color: "#9ca3af",
    fontSize: 13,
    fontStyle: "italic",
  },

  voiceContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  voiceHint: {
    alignItems: "center",
  },
  voiceHintText: {
    color: "#9ca3af",
    fontSize: 12,
    textAlign: "center",
  },
  recordingText: {
    color: "#ef4444",
  },
  addonButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  skipButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  confirmButton: {
    backgroundColor: ACCENT,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  receiptBox: {
    width: "100%",
    padding: 20,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 20,
  },
  receiptText: {
    color: "#e5e7eb",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  totalLabel: {
    color: "#9ca3af",
    fontSize: 16,
    fontWeight: "600",
  },
  totalValue: {
    color: ACCENT,
    fontSize: 24,
    fontWeight: "900",
  },
  input: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    color: "#fff",
    fontSize: 16,
    marginBottom: 16,
  },
  reservationId: {
    color: ACCENT,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
  },
  voiceButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  voiceButtonRecording: {
    backgroundColor: "#ef4444",
  },
  recordingIndicator: {
    alignItems: "center",
    justifyContent: "center",
  },
  recordingPulse: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(239, 68, 68, 0.3)",
    opacity: 0.6,
  },
});
