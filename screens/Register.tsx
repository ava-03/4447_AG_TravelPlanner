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
import { registerUser } from '../utils/auth';
import { setCurrentUserId } from '../utils/authStorage';

type Props = {
  navigation: any;
};

export default function Register({ navigation }: Props) {
  const { colors, themeMode } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    try {
      setLoading(true);

      if (!name.trim() || !email.trim() || !password.trim()) {
        Alert.alert('Missing details', 'Please complete all fields.');
        return;
      }

      const user = await registerUser({
        name: name.trim(),
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
        error instanceof Error ? error.message : 'Registration failed. Please try again.';
      Alert.alert('Registration failed', message);
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
            <Text style={[styles.cardTitle, { color: colors.text }]}>Register</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Enter your name"
                placeholderTextColor={colors.placeholder}
                value={name}
                onChangeText={setName}
                accessibilityLabel="Name input"
              />
            </View>

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
                placeholder="Create a password"
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
              onPress={handleRegister}
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
                  Create Account
                </Text>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.secondaryButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>
                Back to Login
              </Text>
            </Pressable>

            <Pressable
              style={styles.linkButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={[styles.linkText, { color: colors.subtext }]}>
                Already have an account? Log in
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
  secondaryButton: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 4,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
});