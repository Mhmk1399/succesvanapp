import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const FIRST_LAUNCH_KEY = "hasLaunched";

export function useFirstLaunch() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);

        if (hasLaunched === null) {
          await AsyncStorage.setItem(FIRST_LAUNCH_KEY, "true");
          setIsFirstLaunch(true);
        } else {
          setIsFirstLaunch(false);
        }
      } catch (error) {
        console.log("Error checking first launch:", error);
        setIsFirstLaunch(false);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return { isFirstLaunch, isLoading };
}
