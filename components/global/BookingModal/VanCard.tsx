import React from "react";
import { View, Text } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Van } from "../vanlist";
import { styles } from "./styles";
import { ACCENT } from "./constants";

export const VanCard = ({ van }: { van: Van }) => (
  <View style={styles.vanImageCard}>
    <Image
      source={typeof van.image === "string" ? { uri: van.image } : van.image}
      style={styles.vanImage}
      contentFit="cover"
    />
    <LinearGradient
      colors={["transparent", "rgba(2,6,23,0.8)"]}
      style={styles.vanImageGradient}
    />
    <View style={styles.vanImageOverlay}>
      <View>
        <Text style={styles.vanImageTitle}>{van.name}</Text>
        <View style={styles.vanImageSpecs}>
          <View style={styles.vanImageSpec}>
            <Ionicons name="people" size={14} color={ACCENT} />
            <Text style={styles.vanImageSpecText}>{van.seats} seats</Text>
          </View>
          <View style={styles.vanImageSpec}>
            <Ionicons name="settings" size={14} color={ACCENT} />
            <Text style={styles.vanImageSpecText}>{van.gear}</Text>
          </View>
        </View>
      </View>
      <View style={styles.vanImagePrice}>
        <Text style={styles.vanImagePriceValue}>
          £{van?.pricingTiers?.[0]?.pricePerHour}
        </Text>
        <Text style={styles.vanImagePriceUnit}>/hour</Text>
      </View>
    </View>
  </View>
);
