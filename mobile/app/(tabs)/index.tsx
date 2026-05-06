import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { Colors } from '@/constants/theme';
import { useEffect, useState } from 'react';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

// Dummy data to show immediately
const DUMMY_SALONS = [
  { id: '1', name: 'صالون المقص الذهبي', address: 'عمان, الدوار السابع', rating: 4.8, image: 'https://images.unsplash.com/photo-1521590832167-7bfcfaa6362f?q=80&w=1470&auto=format&fit=crop', category: 'VIP' },
  { id: '2', name: 'لمسة جمال', address: 'إربد, شارع الجامعة', rating: 4.5, image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1469&auto=format&fit=crop', category: 'Hair' },
  { id: '3', name: 'أناقة رجل', address: 'الزرقاء, شارع السعادة', rating: 4.9, image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=1470&auto=format&fit=crop', category: 'Beard' },
];

const CATEGORIES = [
  { id: 'All', name: 'الكل' },
  { id: 'VIP', name: 'خدمات VIP' },
  { id: 'Hair', name: 'عناية بالشعر' },
  { id: 'Beard', name: 'عناية باللحية' },
];

export default function HomeScreen() {
  const [salons, setSalons] = useState<any[]>(DUMMY_SALONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchLiveSalons();
  }, []);

  const fetchLiveSalons = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://maqas.site/api/public/salons.php');
      const json = await response.json();
      if (json.success && json.data && json.data.salons) {
        // Map real API data to UI structure with visual fallbacks
        const apiSalons = json.data.salons.map((salon: any, index: number) => ({
          id: salon.id.toString(),
          name: salon.name,
          address: 'عمان, الأردن', // Fallback address
          rating: (4.5 + (index % 5) * 0.1).toFixed(1), // Fallback rating
          image: DUMMY_SALONS[index % DUMMY_SALONS.length].image, // Maintain premium images
          category: index % 2 === 0 ? 'VIP' : 'Hair',
        }));
        setSalons(apiSalons);
      }
    } catch (error) {
      console.error('Error fetching live salons:', error);
      // Keeps DUMMY_SALONS on failure automatically
    } finally {
      setLoading(false);
    }
  };

  const filteredSalons = salons.filter(salon => {
    const matchesSearch = salon.name.includes(searchQuery) || salon.address.includes(searchQuery);
    const matchesCategory = selectedCategory === 'All' || salon.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderSalonCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={() => router.push(`/salon/${item.id}` as any)}
    >
      <Image 
        source={item.image} 
        style={styles.cardImage} 
        contentFit="cover"
        transition={300}
      />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.salonName}>{item.name}</Text>
          <View style={styles.ratingBadge}>
            <IconSymbol name="star.fill" size={12} color="#0A0A0B" />
            <Text style={styles.ratingText}>{item.rating || 4.5}</Text>
          </View>
        </View>
        <Text style={styles.salonAddress}>{item.address || 'عنوان الصالون'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerSubtitle}>اكتشف أفضل الصالونات</Text>
          <View style={styles.logoAndText}>
            <Text style={styles.headerTitle}>MAQAS</Text>
            <View style={styles.logoContainer}>
              <Image 
                source={require('@/assets/images/icon.png')} 
                style={styles.logoImage} 
                contentFit="cover" 
              />
            </View>
          </View>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن صالون أو مدينة..."
            placeholderTextColor="#777777"
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
          />
          <IconSymbol name="magnifyingglass" size={20} color="#AAAAAA" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoriesContainer}
          style={{ flexGrow: 0 }}
        >
          {CATEGORIES.slice().reverse().map(category => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryPill, selectedCategory === category.id && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={[styles.categoryText, selectedCategory === category.id && styles.categoryTextActive]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Salon List */}
        <View style={styles.listContent}>
          {loading ? (
            <ActivityIndicator size="large" color="#C3D809" style={{ marginTop: 40 }} />
          ) : (
            <>
              {filteredSalons.map(item => (
                <View key={item.id}>{renderSalonCard({ item })}</View>
              ))}
              {filteredSalons.length === 0 && (
                <Text style={styles.emptyText}>لم نجد صالونات مطابقة لبحثك.</Text>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B', // Deep Charcoal Black
  },
  header: {
    paddingTop: 54,
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: '#0A0A0B', // Matched exactly with main background to look seamless
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24, // More breathing room before search
  },
  logoAndText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'ElMessiri_700Bold',
    color: '#C3D809',
    letterSpacing: 1.5,
  },
  logoContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#C3D809',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#C3D809',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'ElMessiri_500Medium',
    color: '#AAAAAA',
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: '#111112',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(195, 216, 9, 0.1)',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  salonName: {
    fontSize: 18,
    fontFamily: 'ElMessiri_700Bold',
    color: '#F8F8F8',
    textAlign: 'right',
  },
  salonAddress: {
    fontSize: 14,
    fontFamily: 'ElMessiri_400Regular',
    color: '#AAAAAA',
    textAlign: 'right',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C3D809',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0A0A0B',
  },
  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#111112',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    height: 52,
    color: '#F8F8F8',
    fontFamily: 'ElMessiri_500Medium',
    fontSize: 16,
    marginRight: 12, // Space between text and magnifying glass
    textAlign: 'right',
  },
  categoriesContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    flexDirection: 'row',
    gap: 12,
  },
  categoryPill: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: '#111112',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPillActive: {
    backgroundColor: '#C3D809',
    borderColor: '#C3D809',
    shadowColor: '#C3D809',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryText: {
    color: '#AAAAAA',
    fontFamily: 'ElMessiri_600SemiBold',
    fontSize: 15,
  },
  categoryTextActive: {
    color: '#0A0A0B',
    fontFamily: 'ElMessiri_700Bold',
  },
  emptyText: {
    color: '#AAAAAA',
    fontFamily: 'ElMessiri_400Regular',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
});
