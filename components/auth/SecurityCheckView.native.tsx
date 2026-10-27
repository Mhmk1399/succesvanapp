import React from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";
import type { SecurityCheckViewProps } from "./SecurityCheckView.types";

export default function SecurityCheckView({ url, onMessage, onError }: SecurityCheckViewProps) {
  const expectedOrigin = new URL(url).origin;
  return (
    <View style={{ height: 185 }}>
    <WebView
      source={{ uri: url }}
      style={{ flex: 1, backgroundColor: "#0b1524" }}
      javaScriptEnabled
      domStorageEnabled
      thirdPartyCookiesEnabled
      sharedCookiesEnabled
      scrollEnabled
      nestedScrollEnabled
      onError={onError}
      onHttpError={(event) => {
        if (event.nativeEvent.statusCode >= 400) onError();
      }}
      onShouldStartLoadWithRequest={(request) => {
        if (request.isTopFrame === false) return true;
        try {
          return new URL(request.url).origin === expectedOrigin || request.url === "about:blank" || request.url === "about:srcdoc";
        } catch {
          return false;
        }
      }}
      onMessage={(event) => {
        try {
          if (new URL(event.nativeEvent.url).origin !== expectedOrigin) return;
          onMessage(JSON.parse(event.nativeEvent.data));
        } catch {
          onError();
        }
      }}
    />
    </View>
  );
}
