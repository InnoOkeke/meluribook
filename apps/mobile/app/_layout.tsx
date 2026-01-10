import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AuthProvider } from "../src/context/AuthContext";
import { BusinessProvider } from "../src/context/BusinessContext";
import { SubscriptionProvider } from "../src/context/SubscriptionContext";

console.log("========================================");
console.log("_layout.tsx MODULE LOADED!");
console.log("========================================");

export default function RootLayout() {
  console.log("RootLayout component rendering!");
  return (
    <AuthProvider>
      <BusinessProvider>
        <SubscriptionProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </SubscriptionProvider>
      </BusinessProvider>
    </AuthProvider>
  );
}
