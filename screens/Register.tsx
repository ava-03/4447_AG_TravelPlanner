import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
  const { themeMode } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Screen palette
  const palette =
    themeMode === 'dark'
      ? {
          page: '#0F172A',
          hero: '#132A46',
          heroBorder: '#1F3D63',
          card: '#17263D',
          border: '#28405F',
          text: '#F8FAFC',
          subtext: '#C7D2E0',
          input: '#10233A',
          placeholder: '#8FA0B6',
          primary: '#C4622D',
          primaryText: '#FFFFFF',
          secondaryBg: '#111C2D',
          link: '#D4A853',
        }
      : {
          page: '#F5F0E8',
          hero: '#1A2E44',
          heroBorder: '#1A2E44',
          card: '#FFFFFF',
          border: '#DDD6CA',
          text: '#18212B',
          subtext: '#6B7280',
          input: '#FFFFFF',
          placeholder: '#9CA3AF',
          primary: '#C4622D',
          primaryText: '#FFFFFF',
          secondaryBg: '#F8F5EF',
          link: '#C4622D',
        };

  // Register action
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
        style={[styles.flex, { backgroundColor: palette.page }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          {/* Logo and brand block */}
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: palette.hero,
                borderColor: palette.heroBorder,
              },
            ]}
          >
            <Image
              source={require('../assets/wanderly_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.brandTitle}>Wanderly</Text>

            <Text style={styles.brandSubtitle}>
              Plan. Pack. Explore.
            </Text>
          </View>

          {/* Register form card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: palette.card,
                borderColor: palette.border,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: palette.text }]}>Register</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: palette.text }]}>Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: palette.input,
                    borderColor: palette.border,
                    color: palette.text,
                  },
                ]}
                placeholder="Enter your name"
                placeholderTextColor={palette.placeholder}
                value={name}
                onChangeText={setName}
                accessibilityLabel="Name input"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: palette.text }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: palette.input,
                    borderColor: palette.border,
                    color: palette.text,
                  },
                ]}
                placeholder="Enter your email"
                placeholderTextColor={palette.placeholder}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                accessibilityLabel="Email input"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: palette.text }]}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: palette.input,
                    borderColor: palette.border,
                    color: palette.text,
                  },
                ]}
                placeholder="Create a password"
                placeholderTextColor={palette.placeholder}
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
                  backgroundColor: palette.primary,
                  opacity: loading ? 0.7 : 1,
                },
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={palette.primaryText} />
              ) : (
                <Text style={[styles.primaryButtonText, { color: palette.primaryText }]}>
                  Create Account
                </Text>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.secondaryButton,
                {
                  backgroundColor: palette.secondaryBg,
                  borderColor: palette.border,
                },
              ]}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={[styles.secondaryButtonText, { color: palette.text }]}>
                Back to Login
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

  // Main page layout
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },

  // Logo block
  heroCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 18,
    marginBottom: 14,
    alignItems: 'center',
  },
  logo: {
    width: 110,
    height: 110,
    marginBottom: 12,
  },
  brandTitle: {
    color: '#F8F5EF',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  brandSubtitle: {
    color: '#D7DEE8',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Form card
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 18,
    textAlign: 'center',
  },

  // Inputs
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

  // Main button
  primaryButton: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Secondary button
  secondaryButton: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Login link
  linkButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 4,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});