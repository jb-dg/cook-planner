import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";

type AnimatedSplashScreenProps = {
  onFinish: () => void;
};

export function AnimatedSplashScreen({ onFinish }: AnimatedSplashScreenProps) {
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.75)).current;
  const logoTranslateY = useRef(new Animated.Value(18)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;

  const animation = useMemo(
    () =>
      Animated.sequence([
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(logoScale, {
            toValue: 1,
            tension: 70,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(logoTranslateY, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 520,
            delay: 140,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(logoScale, {
            toValue: 1.06,
            duration: 360,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(logoScale, {
            toValue: 1,
            duration: 360,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(220),
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    [
      containerOpacity,
      logoOpacity,
      logoScale,
      logoTranslateY,
      titleOpacity,
    ]
  );

  useEffect(() => {
    animation.start(({ finished }) => {
      if (finished) {
        onFinish();
      }
    });

    return () => animation.stop();
  }, [animation, onFinish]);

  return (
    <Animated.View style={[styles.root, { opacity: containerOpacity }]}>
      <LinearGradient
        colors={["#FDF8F1", "#F5EFE4", "#FDF8F1"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoWrap,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }, { translateY: logoTranslateY }],
            },
          ]}
        >
          <Image
            source={require("../assets/images/book-icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={{ opacity: titleOpacity }}>
          <Text style={styles.title}>Cook Planner</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  logoWrap: {
    width: 140,
    height: 140,
    borderRadius: 28,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2D2D2A",
    letterSpacing: 0.3,
  },
});
