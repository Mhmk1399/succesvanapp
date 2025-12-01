import { View, Text } from 'react-native';

export default function BookingsList() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' , }}>
      <Text style={{
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
      }}>رزروهای من</Text>
    </View>
  );
}
