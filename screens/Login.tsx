import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { useTheme } from '../theme/ThemeContext';
import { loginUser } from '../utils/auth';
import { setCurrentUserId } from '../utils/authStorage';

type Props = {
  navigation: any;
};

export default function Login({ navigation }: Props) {
  const { colors, themeMode } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    try {
      setLoading(true);

      if (!email.trim() || !password.trim()) {
        Alert.alert('Missing details', 'Please enter both email and password.');
        return;
      }

      const user = await loginUser({
        email: email.trim(),
        password: password.trim(),
      });

      await setCurrentUserId(user.id);

      navigation.reset({
        index: 0,
        routes: [{ name: 'Trips' }],
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Login failed. Please try again.';
      Alert.alert('Login failed', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <View style={styles.hero}>
            <Text style={[styles.brand, { color: colors.text }]}>Brand</Text>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>Login</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Enter your email"
                placeholderTextColor={colors.placeholder}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                accessibilityLabel="Email input"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Enter your password"
                placeholderTextColor={colors.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                accessibilityLabel="Password input"
              />
            </View>

            <Pressable
              style={[
                styles.primaryButton,
                {
                  backgroundColor: colors.accent,
                  opacity: loading ? 0.7 : 1,
                },
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={themeMode === 'dark' ? '#0f1115' : '#ffffff'} />
              ) : (
                <Text
                  style={[
                    styles.primaryButtonText,
                    { color: themeMode === 'dark' ? '#0f1115' : '#ffffff' },
                  ]}
                >
                  Login
                </Text>
              )}
            </Pressable>

            <Pressable
              style={styles.linkButton}
              onPress={() => navigation.navigate('Register')}
              disabled={loading}
            >
              <Text style={[styles.linkText, { color: colors.accent }]}>
                Don&apos;t have an account? Register
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  hero: {
    marginBottom: 24,
    alignItems: 'center',
  },
  brand: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 18,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 4,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});