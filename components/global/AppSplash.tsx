import { View, StyleSheet, Animated, Text, ActivityIndicator } from "react-native";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";

type Props = {
  onFinish: () => void;
};

export default function AppSplash({ onFinish }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [lottieError, setLottieError] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(onFinish);
    }, 2500);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      {lottieError ? (
        <View style={styles.fallback}>
          <Text style={styles.text}>Success Van Hire</Text>
          <ActivityIndicator size="large" color="#fe9a00" style={{ marginTop: 20 }} />
        </View>
      ) : (
        <LottieView
          source={require("../../assets/lottie/splash.json")}
          autoPlay
          loop={false}
          style={{ width: 300, height: 300 }}
          onAnimationFailure={() => setLottieError(true)}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  fallback: {
    alignItems: "center",
  },
  text: {
    fontSize: 32,
    fontWeight: "900",
    color: "#fe9a00",
  },
});
