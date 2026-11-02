import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { login, signup, isLoading, error } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = async () => {
    setFormError('');
    
    if (!email || !password) {
      setFormError('Please fill in all fields');
      return;
    }

    if (!isLogin && !name) {
      setFormError('Please enter your name');
      return;
    }

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, name);
      }
      // AppNavigator automatically renders HingeMain when isAuthenticated is true
    } catch (err: any) {
      setFormError(err.message || 'Authentication failed');
    }
  };

  const handleTestLogin = async (type: 'elite' | 'basic') => {
    try {
      setFormError('');
      if (type === 'elite') {
        await login('elite@test.com', 'ElitePass123!');
      } else {
        await login('basic@test.com', 'BasicPass123!');
      }
      // AppNavigator automatically renders HingeMain when isAuthenticated is true
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Test login failed');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#ffffff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={{ fontSize: 64 }}>💕</Text>
          <Text style={{ fontSize: 42, fontWeight: '300', letterSpacing: 2, color: '#000000' }}>hinge</Text>
          <Text style={{ fontSize: 14, color: '#999999', marginTop: 8, fontStyle: 'italic' }}>Designed to be deleted</Text>
        </View>

        {/* Error Message */}
        {(error || formError) && (
          <View style={{ backgroundColor: '#fff2f2', borderRadius: 8, padding: 12, marginBottom: 20 }}>
            <Text style={{ color: '#ff3b30', fontSize: 14, textAlign: 'center' }}>
              {error || formError}
            </Text>
          </View>
        )}

        {/* Toggle Login/Signup */}
        <View style={{ flexDirection: 'row', backgroundColor: '#f5f5f5', borderRadius: 12, padding: 4, marginBottom: 24 }}>
          <TouchableOpacity
            style={[{ flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' }, !isLogin && { backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }]}
            onPress={() => { setIsLogin(false); setFormError(''); }}
          >
            <Text style={{ fontSize: 16, fontWeight: !isLogin ? '600' : '400', color: !isLogin ? '#000000' : '#999999' }}>Sign Up</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[{ flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' }, isLogin && { backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }]}
            onPress={() => { setIsLogin(true); setFormError(''); }}
          >
            <Text style={{ fontSize: 16, fontWeight: isLogin ? '600' : '400', color: isLogin ? '#000000' : '#999999' }}>Log In</Text>
          </TouchableOpacity>
        </View>

        {/* Name Input (Sign Up only) */}
        {!isLogin && (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 14, color: '#666666', marginBottom: 6 }}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#999999"
              style={{ backgroundColor: '#f5f5f5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#000000' }}
              autoCorrect={false}
            />
          </View>
        )}

        {/* Email Input */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 14, color: '#666666', marginBottom: 6 }}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor="#999999"
            style={{ backgroundColor: '#f5f5f5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#000000' }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Password Input */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, color: '#666666', marginBottom: 6 }}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor="#999999"
            style={{ backgroundColor: '#f5f5f5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#000000' }}
            secureTextEntry
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          style={{ backgroundColor: '#ff6b6b', borderRadius: 24, paddingVertical: 16, alignItems: 'center', marginBottom: 20 }}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '600' }}>
              {isLogin ? 'Log In' : 'Sign Up'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Quick Test Accounts */}
        <View style={{ backgroundColor: '#f8f8f8', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#666666', textAlign: 'center', marginBottom: 12 }}>Quick Test Accounts</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <TouchableOpacity
              onPress={() => handleTestLogin('elite')}
              style={{ backgroundColor: '#ffd700', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#000000' }}>Elite User</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleTestLogin('basic')}
              style={{ backgroundColor: '#e0e0e0', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#000000' }}>Basic User</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 11, color: '#999999', textAlign: 'center', marginTop: 12, lineHeight: 18 }}>
            Elite: elite@test.com / ElitePass123!{'\n'}
            Basic: basic@test.com / BasicPass123!
          </Text>
        </View>

        {/* Footer */}
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#999999', textAlign: 'center' }}>
            By continuing, you agree to our Terms of Service
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
