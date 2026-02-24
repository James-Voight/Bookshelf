import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'signin' | 'signup' | 'reset';

export function AuthScreen() {
  const navigation = useNavigation<any>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const notifyError = (message: string) => {
    if (Platform.OS === 'web') {
      // Alert is unreliable in some web setups; fall back to window.alert.
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert(message);
        return;
      }
    }
    Alert.alert('Error', message);
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      notifyError('Please enter your email');
      return;
    }

    if (mode === 'reset') {
      setLoading(true);
      try {
        await resetPassword(email);
        if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.alert === 'function') {
          window.alert('Password reset email sent!');
        } else {
          Alert.alert('Success', 'Password reset email sent!');
        }
        setMode('signin');
      } catch (error: any) {
        console.error('Reset password error:', error);
        notifyError(error?.message || 'Failed to send reset email');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      notifyError('Please enter your password');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        notifyError('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        notifyError('Passwords do not match');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName || undefined);
      }
      navigation.goBack();
    } catch (error: any) {
      console.error('Auth error:', error);
      const code = error?.code ? ` (${error.code})` : '';
      notifyError(`${error?.message || 'Authentication failed'}${code}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      navigation.goBack();
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      const code = error?.code ? ` (${error.code})` : '';
      notifyError(`${error?.message || 'Google sign-in failed'}${code}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, isDark && styles.containerDark]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Ionicons name="library" size={64} color="#007AFF" />
          <Text style={[styles.title, isDark && styles.textDark]}>BookShelf</Text>
          <Text style={styles.subtitle}>
            {mode === 'signin' ? 'Welcome back!' : 
             mode === 'signup' ? 'Create your account' : 
             'Reset your password'}
          </Text>
        </View>

        <View style={styles.form}>
          {mode === 'signup' && (
            <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
              <Ionicons name="person-outline" size={20} color="#888" />
              <TextInput
                style={[styles.input, isDark && styles.textDark]}
                placeholder="Display Name (optional)"
                placeholderTextColor="#888"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
            <Ionicons name="mail-outline" size={20} color="#888" />
            <TextInput
              style={[styles.input, isDark && styles.textDark]}
              placeholder="Email"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {mode !== 'reset' && (
            <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
              <Ionicons name="lock-closed-outline" size={20} color="#888" />
              <TextInput
                style={[styles.input, isDark && styles.textDark]}
                placeholder="Password"
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={20} 
                  color="#888" 
                />
              </TouchableOpacity>
            </View>
          )}

          {mode === 'signup' && (
            <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
              <Ionicons name="lock-closed-outline" size={20} color="#888" />
              <TextInput
                style={[styles.input, isDark && styles.textDark]}
                placeholder="Confirm Password"
                placeholderTextColor="#888"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>
          )}

          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {mode === 'signin' ? 'Sign In' : 
                 mode === 'signup' ? 'Create Account' : 
                 'Send Reset Email'}
              </Text>
            )}
          </TouchableOpacity>

          {mode === 'signin' && (
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => setMode('reset')}
            >
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          {mode !== 'reset' && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity 
                style={[styles.socialButton, isDark && styles.socialButtonDark]}
                onPress={handleGoogleSignIn}
                disabled={loading}
              >
                <Ionicons name="logo-google" size={20} color="#DB4437" />
                <Text style={[styles.socialButtonText, isDark && styles.textDark]}>
                  Continue with Google
                </Text>
              </TouchableOpacity>

              {Platform.OS === 'ios' && (
                <TouchableOpacity 
                  style={[styles.socialButton, isDark && styles.socialButtonDark]}
                  disabled={loading}
                >
                  <Ionicons name="logo-apple" size={20} color={isDark ? '#fff' : '#000'} />
                  <Text style={[styles.socialButtonText, isDark && styles.textDark]}>
                    Continue with Apple
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View style={styles.footer}>
          {mode === 'signin' ? (
            <TouchableOpacity onPress={() => setMode('signup')}>
              <Text style={styles.footerText}>
                Don't have an account? <Text style={styles.linkText}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setMode('signin')}>
              <Text style={styles.footerText}>
                Already have an account? <Text style={styles.linkText}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  containerDark: {
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  inputContainerDark: {
    backgroundColor: '#1c1c1e',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 8,
  },
  linkText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#888',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  socialButtonDark: {
    backgroundColor: '#1c1c1e',
    borderColor: '#333',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#888',
  },
  textDark: {
    color: '#fff',
  },
});
