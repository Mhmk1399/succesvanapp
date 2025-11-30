// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // هیچ پلاگینی لازم نیست
    // expo-router تو SDK 50 دیگه "expo-router/babel" نمی‌خواد
  };
};
