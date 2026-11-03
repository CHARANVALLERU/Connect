import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { premium } from '../theme/tokens';

export default function LoginScreen() {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const styles = useMemo(() => makeStyles(), []);

  const submit = async () => {
    setFormError('');
    if (!email || !password) {
      setFormError('Enter email and password');
      return;
    }
    try {
      await login(email, password);
    } catch (err: any) {
      setFormError(err?.message || 'Authentication failed');
    }
  };

  const demo = async (kind: 'elite' | 'premium') => {
    try {
      setFormError('');
      if (kind === 'elite') await login('elite@test.com', 'ElitePass123!');
      else await login('premium@test.com', 'PremiumPass123!');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Demo login failed');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={['#0B0B0C', '#12261C', '#0B0B0C']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>CONNECT</Text>
        <Text style={styles.tag}>Niche communities · Cognitive matching · Tier privacy</Text>

        {(error || formError) && (
          <View style={styles.err}>
            <Text style={styles.errText}>{formError || error}</Text>
          </View>
        )}

        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor="#8A8A8A"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          secureTextEntry
          placeholder="Password"
          placeholderTextColor="#8A8A8A"
          value={password}
          onChangeText={setPassword}
        />

        <Pressable style={styles.primary} onPress={submit} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#0B0B0C" />
          ) : (
            <Text style={styles.primaryText}>Enter network</Text>
          )}
        </Pressable>

        <Text style={styles.or}>Expo Go demo access</Text>
        <Pressable style={styles.demoElite} onPress={() => demo('elite')}>
          <Text style={styles.demoEliteText}>Continue as Elite</Text>
        </Pressable>
        <Pressable style={styles.demoPremium} onPress={() => demo('premium')}>
          <Text style={styles.demoPremiumText}>Continue as Premium</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles() {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0B0B0C' },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 28 },
    brand: {
      fontSize: 36,
      fontWeight: '900',
      letterSpacing: 8,
      color: '#D4AF37',
      textAlign: 'center',
    },
    tag: {
      textAlign: 'center',
      color: '#A1A1AA',
      marginTop: 10,
      marginBottom: 36,
      fontSize: 13,
      lineHeight: 18,
    },
    err: {
      backgroundColor: 'rgba(180,35,24,0.2)',
      padding: 12,
      borderRadius: 10,
      marginBottom: 14,
    },
    errText: { color: '#F97066', textAlign: 'center' },
    input: {
      backgroundColor: '#161618',
      borderWidth: 1,
      borderColor: '#2A2A30',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
      color: '#F5F0E6',
      marginBottom: 12,
      fontSize: 16,
    },
    primary: {
      backgroundColor: '#D4AF37',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 6,
    },
    primaryText: { color: '#0B0B0C', fontWeight: '800', fontSize: 16 },
    or: {
      textAlign: 'center',
      color: '#71717A',
      marginVertical: 18,
      fontSize: 12,
    },
    demoElite: {
      borderWidth: 1,
      borderColor: '#D4AF37',
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: 10,
    },
    demoEliteText: { color: '#D4AF37', fontWeight: '700' },
    demoPremium: {
      backgroundColor: premium.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    demoPremiumText: { color: '#fff', fontWeight: '700' },
  });
}
