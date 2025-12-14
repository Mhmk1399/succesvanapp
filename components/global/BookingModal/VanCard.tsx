import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Van } from "../vanlist";
import { styles } from "./styles";
import { ACCENT } from "./constants";

export const VanCard = ({ van }: { van: Van }) => (
  <View style={styles.vanImageCard}>
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
          £{van?.showPrice || 0}
        </Text>
        <Text style={styles.vanImagePriceUnit}>/day</Text>
      </View>
    </View>
  </View>
);
