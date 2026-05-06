import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, TextInput, ScrollView, Share } from 'react-native';
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
    const BASE_URL = 'https://maqas.site/';
    try {
      const response = await fetch('https://maqas.site/api/public/salons.php');
      
      if (!response.ok) {
        console.warn('API returned status:', response.status, '- Using fallback data');
        setLoading(false);
        return;
      }

      const json = await response.json();
      if (json.success && json.data && json.data.salons && json.data.salons.length > 0) {
        const apiSalons = json.data.salons.map((salon: any, index: number) => {
          // Pick best available image: hero > logo > unsplash fallback
          const image = (salon.hero_image && salon.hero_image !== '')
            ? `${BASE_URL}${salon.hero_image}`
            : (salon.logo_path && salon.logo_path !== '')
            ? `${BASE_URL}${salon.logo_path}`
            : DUMMY_SALONS[index % DUMMY_SALONS.length].image;

          return {
            id: salon.id.toString(),
            name: salon.name,
            address: 'عمان, الأردن',
            rating: (4.5 + (index % 5) * 0.1).toFixed(1),
            image,
            services_count: salon.services_count,
            employees_count: salon.employees_count,
            slug: salon.slug,
            category: index % 2 === 0 ? 'VIP' : 'Hair',
          };
        });
        setSalons(apiSalons);
      }
    } catch (error) {
      console.error('Network error fetching salons:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSalons = salons.filter(salon => {
    const matchesSearch = salon.name.includes(searchQuery) || salon.address.includes(searchQuery);
    const matchesCategory = selectedCategory === 'All' || salon.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const [favorites, setFavorites] = useState<string[]>([]);

  // Promotional Banner Data
  const PROMO_BANNERS = [
    { id: 'p1', title: 'خصم 30% للعرسان', subtitle: 'في جميع فروع المقص الذهبي', color: '#C3D809', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1470&auto=format&fit=crop' },
    { id: 'p2', title: 'باقة العناية المتكاملة', subtitle: 'احجز الآن واحصل على تنظيف بشرة مجاني', color: '#F8F8F8', image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=1470&auto=format&fit=crop' },
  ];

  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]);
  };

  const handleShare = async (item: any) => {
    try {
      await Share.share({
        message: `✂️ ${item.name}\n📍 ${item.address}\n\nاحجز الآن عبر تطبيق مقص 🚀\nhttps://maqas.site`,
        title: item.name,
      });
    } catch (e) {}
  };

  const renderSalonCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.9}
      onPress={() => router.push({
        pathname: `/salon/${item.id}` as any,
        params: { slug: item.slug }
      })}
    >
      <Image 
        source={item.image} 
        style={styles.cardImage} 
        contentFit="cover"
        transition={300}
      />
      
      {/* Floating Action Buttons */}
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => toggleFavorite(item.id)}
        >
          <IconSymbol 
            name={favorites.includes(item.id) ? "heart.fill" : "heart"} 
            size={20} 
            color={favorites.includes(item.id) ? "#FF4B4B" : "#FFF"} 
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(item)}>
          <IconSymbol name="square.and.arrow.up" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

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
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.mapToggleBtn}>
              <IconSymbol name="map.fill" size={18} color="#C3D809" />
              <Text style={styles.mapToggleText}>خريطة</Text>
            </TouchableOpacity>
          </View>
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
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن صالون أو خدمة..."
            placeholderTextColor="#777777"
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
          />
          <IconSymbol name="magnifyingglass" size={20} color="#AAAAAA" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
        
        {/* Promotional Carousel */}
        <View style={styles.carouselSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            snapToInterval={320} 
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
          >
            {PROMO_BANNERS.map(promo => (
              <TouchableOpacity key={promo.id} style={styles.promoCard} activeOpacity={0.9}>
                <Image source={promo.image} style={styles.promoImage} contentFit="cover" />
                <View style={styles.promoOverlay}>
                  <View style={styles.promoTag}>
                    <Text style={styles.promoTagText}>عرض حصري</Text>
                  </View>
                  <Text style={styles.promoTitle}>{promo.title}</Text>
                  <Text style={styles.promoSubtitle}>{promo.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

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
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(195, 216, 9, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(195, 216, 9, 0.2)',
  },
  mapToggleText: {
    color: '#C3D809',
    fontSize: 14,
    fontFamily: 'ElMessiri_600SemiBold',
  },
  logoAndText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  carouselSection: {
    marginTop: 10,
    marginBottom: 10,
  },
  promoCard: {
    width: 300,
    height: 160,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#111112',
  },
  promoImage: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  promoOverlay: {
    position: 'absolute',
    inset: 0,
    padding: 20,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  promoTag: {
    backgroundColor: '#C3D809',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  promoTagText: {
    color: '#0A0A0B',
    fontSize: 10,
    fontFamily: 'ElMessiri_700Bold',
    textTransform: 'uppercase',
  },
  promoTitle: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'ElMessiri_700Bold',
    textAlign: 'right',
  },
  promoSubtitle: {
    color: '#AAA',
    fontSize: 12,
    fontFamily: 'ElMessiri_400Regular',
    textAlign: 'right',
    marginTop: 2,
  },
  cardActions: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
