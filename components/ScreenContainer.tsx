import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenContainerProps = {
  children: React.ReactNode;
};

export default function ScreenContainer({ children }: ScreenContainerProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  content: {
    flex: 1,
    padding: 16,
  },
});