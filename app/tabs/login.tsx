import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";

const Login = () => {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#8426f5', '#563acc']}
        style={{
            marginBottom: 20,
            borderRadius: 50,
            padding: 15,
            alignItems: 'center',
            justifyContent: 'center',
        }}
        >
        <Icon name="lock-closed-outline" size={50} color="white" />
        </LinearGradient>
      <Text style={styles.title}>Iniciar Sesión</Text>
      <Text style={styles.subtitle}>Accede a tu cuenta</Text>

      <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Contraseña" secureTextEntry />

      <View style={styles.buttonContainer}>
        <LinearGradient
        colors={['#8426f5', '#563acc']}
        style={styles.gradientButton}
        >
        <Text style={styles.buttonText}>Iniciar Sesión</Text>
        </LinearGradient>
        </View>
    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: "#666",
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  buttonContainer: {
    width: "100%",
    marginTop: 10,
    borderRadius: 8,
    overflow: "hidden",
  },
  gradientButton: {
    paddingVertical: 15,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
