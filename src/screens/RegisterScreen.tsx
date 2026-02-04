import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // Alterado para Expo Router
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';

import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

export default function RegisterScreen() {
  const router = useRouter(); // Instância do Expo Router
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);

  const signIn = useAuthStore((state) => state.signIn);

  const handleAddPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  async function handleRegister() {
    if (!name || !email || !password || !confirmPassword) {
      return Alert.alert('Campos incompletos', 'Preencha todos os campos.');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Erro', 'As senhas não coincidem.');
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);

      if (selectedImage) {
        // Extrai a extensão do arquivo para definir o tipo corretamente
        const uriParts = selectedImage.split('.');
        const fileType = uriParts[uriParts.length - 1];

        formData.append('avatar', {
          uri: selectedImage,
          name: `.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }

      // Envio para a URL correta /users/signup
      const response = await api.post('/users/signup', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { user, token } = response.data;
      
      Alert.alert('Sucesso', 'Conta criada com sucesso!');
      
      // Loga automaticamente e redireciona via AuthStore/Routes
      await signIn(user, token);

    } catch (error: any) {
      console.log('Register Error:', error.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível criar a conta. Verifique os dados ou tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          <Animated.View 
            entering={FadeInUp.delay(100).duration(800).springify()}
            style={styles.header}
          >
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back-ios" size={20} color="#0f172a" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nova Conta</Text>
            <View style={{ width: 40 }} />
          </Animated.View>

          <View style={styles.main}>
            
            <Animated.View 
               entering={FadeInDown.delay(200).duration(800).springify()}
               style={styles.textSection}
            >
              <Text style={styles.title}>Crie sua conta</Text>
              <Text style={styles.subtitle}>Comece a controlar sua riqueza hoje.</Text>
            </Animated.View>

            <Animated.View 
               entering={FadeInDown.delay(300).duration(800).springify()}
               style={styles.imageUploadContainer}
            >
              <View style={styles.imageUploadWrapper}>
                <TouchableOpacity style={styles.imagePicker} onPress={handleAddPhoto}>
                  {selectedImage ? (
                    <Image 
                      source={{ uri: selectedImage }} 
                      style={styles.previewImage} 
                    />
                  ) : (
                    <MaterialIcons name="add-a-photo" size={32} color="#9ca3af" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.editBadge} onPress={handleAddPhoto}>
                    <MaterialIcons name="edit" size={14} color="#FFF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.imageUploadLabel}>
                {selectedImage ? 'Toque para trocar' : 'Adicionar foto (Opcional)'}
              </Text>
            </Animated.View>

            <Animated.View 
               entering={FadeInDown.delay(500).duration(800).springify()}
               style={styles.form}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome completo</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="person" size={20} color="#6b7280" style={styles.inputIconLeft} />
                  <TextInput
                    style={styles.input}
                    placeholder="João Carlos"
                    placeholderTextColor="#9ca3af"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-mail</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="mail" size={20} color="#6b7280" style={styles.inputIconLeft} />
                  <TextInput
                    style={styles.input}
                    placeholder="john@example.com"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Senha</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="lock" size={20} color="#6b7280" style={styles.inputIconLeft} />
                  <TextInput
                    style={styles.input}
                    placeholder="Digite sua senha"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity 
                    style={styles.inputIconRight}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={22} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirme senha</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="lock" size={20} color="#6b7280" style={styles.inputIconLeft} />
                  <TextInput
                    style={styles.input}
                    placeholder="Digite novamente sua senha"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity 
                    style={styles.inputIconRight}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <MaterialIcons name={showConfirmPassword ? "visibility" : "visibility-off"} size={22} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ height: 16 }} />

              <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.registerButtonText}>Registrar</Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            <View style={{ flex: 1 }} />

            <Animated.View 
               entering={FadeInDown.delay(700).duration(800)}
               style={styles.footer}
            >
              <Text style={styles.footerText}>Já tem uma conta? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.loginLinkText}>Acessar</Text>
              </TouchableOpacity>
            </Animated.View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContainer: { flexGrow: 1, paddingBottom: 24 },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  
  main: { flex: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  
  textSection: { marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '800', color: '#0f172a', marginBottom: 8, lineHeight: 38 },
  subtitle: { fontSize: 16, color: '#64748b' },
  
  imageUploadContainer: { alignItems: 'center', marginBottom: 32, gap: 12 },
  imageUploadWrapper: { position: 'relative' },
  imagePicker: { 
    width: 96, height: 96, borderRadius: 48, backgroundColor: '#ffffff', 
    borderWidth: 2, borderColor: '#cbd5e1', borderStyle: 'dashed', 
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden' 
  },
  previewImage: { width: '100%', height: '100%' },
  
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#1773cf', padding: 6, borderRadius: 999, borderWidth: 2, borderColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  imageUploadLabel: { fontSize: 14, fontWeight: '500', color: '#64748b' },
  
  form: { width: '100%', gap: 20 },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginLeft: 4 },
  
  inputWrapper: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', 
    borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', height: 48, 
    paddingHorizontal: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 
  },
  inputIconLeft: { marginRight: 8 },
  input: { flex: 1, height: '100%', fontSize: 16, color: '#0f172a' },
  inputIconRight: { padding: 8, marginLeft: 4, justifyContent: 'center', alignItems: 'center' },

  registerButton: { height: 48, backgroundColor: '#1773cf', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#1773cf', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  registerButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  
  footer: { marginTop: 32, flexDirection: 'row', justifyContent: 'center', paddingBottom: 16 },
  footerText: { color: '#64748b', fontSize: 14 },
  loginLinkText: { color: '#1773cf', fontWeight: 'bold', fontSize: 14, marginLeft: 4 }
});