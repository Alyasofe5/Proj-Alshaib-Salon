import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import { useState } from 'react';

const { width, height } = Dimensions.get('window');

import { ActivityIndicator } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phoneNumber) return;
    setLoading(true);
    try {
      const response = await fetch('https://maqas.site/api/public/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      const data = await response.json();
      if (data.success) {
        // Navigate to tabs on success
        router.replace('/(tabs)');
      } else {
        console.error('Login error:', data.message);
      }
    } catch (error) {
      console.error('Network error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      {/* Background Hero Image */}
      <View style={StyleSheet.absoluteFill}>
        <Image 
          source="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1470&auto=format&fit=crop" 
          style={{ width, height }} 
          contentFit="cover"
        />
        {/* Dark Gradient Overlay */}
        <View style={styles.overlay} />
      </View>

      <View style={styles.content}>
        {/* Header / Logo */}
        <View style={styles.headerContainer}>
          <Text style={styles.logoText}>MAQAS</Text>
          <Text style={styles.tagline}>نحن نعتني بأناقتك، لأنك تستحق الأفضل</Text>
        </View>

        {/* Login Form Container (Glassmorphism look) */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>تسجيل الدخول</Text>
          <Text style={styles.formSubtitle}>أدخل رقم هاتفك للمتابعة</Text>

          {/* Phone Input */}
          <View style={styles.inputContainer}>
            <IconSymbol name="phone.fill" size={20} color="#AAAAAA" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="079 123 4567"
              placeholderTextColor="#777777"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              textAlign="left"
            />
            <Text style={styles.countryCode}>+962</Text>
          </View>

          {/* Continue Button */}
          <TouchableOpacity style={styles.loginButton} activeOpacity={0.9} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#0A0A0B" />
            ) : (
              <>
                <Text style={styles.loginButtonText}>متابعة</Text>
                <IconSymbol name="arrow.left" size={20} color="#0A0A0B" />
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>أو</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Auth */}
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <IconSymbol name="applelogo" size={24} color="#F8F8F8" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <IconSymbol name="g.circle.fill" size={24} color="#F8F8F8" />
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text style={styles.termsText}>
            باستمرارك، أنت توافق على <Text style={styles.termsLink}>الشروط والأحكام</Text>
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 11, 0.75)', // 75% dark opacity for cinematic feel
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoText: {
    fontSize: 48,
    fontFamily: 'ElMessiri_700Bold',
    color: '#C3D809',
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 16,
    fontFamily: 'ElMessiri_400Regular',
    color: '#F8F8F8',
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.9,
  },
  formContainer: {
    backgroundColor: 'rgba(28, 28, 30, 0.6)', // Semi-transparent glass look
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  formTitle: {
    fontSize: 24,
    fontFamily: 'ElMessiri_700Bold',
    color: '#F8F8F8',
    textAlign: 'right',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    fontFamily: 'ElMessiri_400Regular',
    color: '#AAAAAA',
    textAlign: 'right',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111112',
    borderWidth: 1,
    borderColor: 'rgba(195, 216, 9, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
    marginBottom: 24,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#F8F8F8',
    fontSize: 18,
    fontFamily: 'ElMessiri_500Medium',
    paddingTop: 4, // Aligns ElMessiri text
  },
  countryCode: {
    color: '#F8F8F8',
    fontSize: 16,
    fontFamily: 'ElMessiri_600SemiBold',
    marginLeft: 12,
  },
  loginButton: {
    backgroundColor: '#C3D809',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#C3D809',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: '#0A0A0B',
    fontSize: 18,
    fontFamily: 'ElMessiri_700Bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: '#AAAAAA',
    fontFamily: 'ElMessiri_400Regular',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsText: {
    color: '#777777',
    fontSize: 12,
    fontFamily: 'ElMessiri_400Regular',
    textAlign: 'center',
  },
  termsLink: {
    color: '#C3D809',
    textDecorationLine: 'underline',
  },
});
