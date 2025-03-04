import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

export default function LoginScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatar, setAvatar] = useState(null);

  // Função para salvar usuários
  const saveUser = async (user) => {
    try {
      const existingUsers = await AsyncStorage.getItem('@users');
      const users = existingUsers ? JSON.parse(existingUsers) : [];
      users.push(user);
      await AsyncStorage.setItem('@users', JSON.stringify(users));
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    }
  };

  // Função para verificar login
  const checkLogin = async () => {
    try {
      const existingUsers = await AsyncStorage.getItem('@users');
      const users = existingUsers ? JSON.parse(existingUsers) : [];
      const user = users.find(
        (u) => u.username === username && u.password === password
      );
      return user;
    } catch (error) {
      console.error('Erro ao verificar login:', error);
      return null;
    }
  };

  // Selecionar foto de perfil
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  // Função de cadastro
  const handleRegister = async () => {
    if (!username || !password || !confirmPassword) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    const existingUsers = await AsyncStorage.getItem('@users');
    const users = existingUsers ? JSON.parse(existingUsers) : [];
    if (users.some((u) => u.username === username)) {
      Alert.alert('Erro', 'Usuário já existe');
      return;
    }

    const newUser = { username, password, avatar: avatar || 'https://randomuser.me/api/portraits/women/44.jpg' };
    await saveUser(newUser);
    await AsyncStorage.setItem('@loggedInUser', JSON.stringify(newUser));
    Alert.alert('Sucesso', 'Usuário cadastrado com sucesso!');
    navigation.replace('Home', { user: newUser });
  };

  // Função de login
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    const user = await checkLogin();
    if (user) {
      await AsyncStorage.setItem('@loggedInUser', JSON.stringify(user));
      navigation.replace('Home', { user });
    } else {
      Alert.alert('Erro', 'Usuário ou senha inválidos');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Logo New-Life */}
      <View style={styles.logoContainer}>
        <Image
          source={{ uri: 'URL_DA_SUA_IMAGEM_DE_LOGO_AQUI' }}
          style={styles.logo}
        />
        <Text style={styles.logoText}>
          <Text style={styles.logoNew}>New-</Text>
          <Text style={styles.logoLife}>Life</Text>
        </Text>
      </View>

      {/* Título */}
      <Text style={styles.title}>{isLogin ? 'Login' : 'Cadastro'}</Text>

      {/* Campos de entrada */}
      <TextInput
        style={styles.input}
        placeholder="Usuário"
        value={username}
        onChangeText={setUsername}
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#888"
      />
      {!isLogin && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Confirmar Senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholderTextColor="#888"
          />
          <TouchableOpacity style={styles.avatarButton} onPress={pickImage}>
            <Text style={styles.avatarButtonText}>
              {avatar ? 'Mudar Foto' : 'Adicionar Foto de Perfil'}
            </Text>
          </TouchableOpacity>
          {avatar && (
            <Image source={{ uri: avatar }} style={styles.avatarPreview} />
          )}
        </>
      )}

      {/* Botão principal */}
      <TouchableOpacity
        style={styles.button}
        onPress={isLogin ? handleLogin : handleRegister}
      >
        <Text style={styles.buttonText}>
          {isLogin ? 'Entrar' : 'Cadastrar'}
        </Text>
      </TouchableOpacity>

      {/* Alternar entre login e cadastro */}
      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.switchText}>
          {isLogin
            ? 'Não tem uma conta? Cadastre-se'
            : 'Já tem uma conta? Faça login'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  logoNew: {
    color: '#4DC25A',
  },
  logoLife: {
    color: '#FFFFFF',
    backgroundColor: '#4DC25A',
    paddingHorizontal: 5,
    borderRadius: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4DC25A',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#F9F9F9',
    color: '#333',
  },
  avatarButton: {
    padding: 10,
    backgroundColor: '#4DC25A',
    borderRadius: 10,
    marginBottom: 15,
  },
  avatarButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  avatarPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#4DC25A',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  switchText: {
    fontSize: 14,
    color: '#4DC25A',
    textDecorationLine: 'underline',
  },
});