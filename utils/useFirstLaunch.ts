import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const FIRST_LAUNCH_KEY = "hasLaunched";

export function useFirstLaunch() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
        setIsFirstLaunch(hasLaunched === null);
      } catch (error) {
        console.log("Error checking first launch:", error);
        setIsFirstLaunch(false);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const completeFirstLaunch = useCallback(async () => {
    try {
      await AsyncStorage.setItem(FIRST_LAUNCH_KEY, "true");
    } catch (error) {
      console.log("Error saving first launch:", error);
    } finally {
      setIsFirstLaunch(false);
    }
  }, []);

  return { isFirstLaunch, isLoading, completeFirstLaunch };
}
