import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Product = {
  id: string;
  name: string;
  price: string;
  image: string;
};

const products: Product[] = [
  { id: "1", name: "Cascos Gamer", price: "$120", image: "https://via.placeholder.com/100" },
  { id: "2", name: "Teclado Mecánico", price: "$90", image: "https://via.placeholder.com/100" },
  { id: "3", name: "Mouse RGB", price: "$45", image: "https://via.placeholder.com/100" },
  { id: "4", name: "Monitor 144Hz", price: "$250", image: "https://via.placeholder.com/100" },
  { id: "5", name: "Cascos Gamer", price: "$120", image: "https://via.placeholder.com/100" },
  { id: "6", name: "Teclado Mecánico", price: "$90", image: "https://via.placeholder.com/100" },
  { id: "7", name: "Mouse RGB", price: "$45", image: "https://via.placeholder.com/100" },
  { id: "8", name: "Monitor 144Hz", price: "$250", image: "https://via.placeholder.com/100" },
];

export default function Home() {
  const renderItem = ({ item }: { item: Product }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.price}>{item.price}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Catálogo</Text>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16, textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
    margin: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  image: { width: 100, height: 100, marginBottom: 8 },
  name: { fontSize: 16, fontWeight: "500" },
  price: { fontSize: 14, color: "#888" },
});
