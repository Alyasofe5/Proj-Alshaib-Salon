import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useEffect, useState } from 'react';

const BASE_URL = 'https://maqas.site/';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1521590832167-7bfcfaa6362f?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1469&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=1470&auto=format&fit=crop',
];

export default function SalonDetailsScreen() {
  const { id, slug } = useLocalSearchParams();
  const router = useRouter();

  const [salonData, setSalonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);

  useEffect(() => {
    if (slug) fetchSalonData(slug as string);
    else if (id) fetchSalonByFallback(id as string);
  }, [id, slug]);

  // Fetch using slug (preferred - comes from home screen)
  const fetchSalonData = async (salonSlug: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}api/booking/salon.php?slug=${salonSlug}`);
      if (!response.ok) throw new Error('API Error');
      const json = await response.json();
      if (json.success && json.data) {
        setSalonData(json.data);
      }
    } catch (error) {
      console.error('Error fetching salon:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fallback: fetch salons list and find the one with this id
  const fetchSalonByFallback = async (salonId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}api/public/salons.php`);
      if (!response.ok) throw new Error('API Error');
      const json = await response.json();
      if (json.success && json.data?.salons) {
        const found = json.data.salons.find((s: any) => s.id.toString() === salonId);
        if (found?.slug) {
          await fetchSalonData(found.slug);
          return;
        }
      }
    } catch (error) {
      console.error('Fallback error:', error);
    }
    setLoading(false);
  };

  const toggleService = (serviceId: number) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(s => s !== serviceId)
        : [...prev, serviceId]
    );
  };

  const services = salonData?.services || [];
  const salon = salonData?.salon || null;

  const totalPrice = selectedServices.reduce((total, sId) => {
    const service = services.find((s: any) => s.id === sId);
    return total + parseFloat(service?.price || '0');
  }, 0);

  const heroImage = salon?.hero_image
    ? `${BASE_URL}${salon.hero_image}`
    : salon?.logo
    ? `${BASE_URL}${salon.logo}`
    : FALLBACK_IMAGES[parseInt(id as string, 10) % FALLBACK_IMAGES.length];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C3D809" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  if (!salon) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>لم يتم العثور على الصالون</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnCenter}>
          <Text style={{ color: '#C3D809' }}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Header Hero Image */}
        <View style={styles.imageContainer}>
          <Image source={heroImage} style={styles.heroImage} contentFit="cover" transition={400} />
          <View style={styles.overlay} />

          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.right" size={24} color="#F8F8F8" />
          </TouchableOpacity>

          {/* Salon name over image */}
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>{salon.name}</Text>
            {salon.address ? (
              <View style={styles.heroAddressRow}>
                <IconSymbol name="mappin.and.ellipse" size={14} color="#C3D809" />
                <Text style={styles.heroAddress}>{salon.address}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{services.length}</Text>
              <Text style={styles.statLabel}>خدمة</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{salonData?.employees?.length || 0}</Text>
              <Text style={styles.statLabel}>موظف</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>★ 4.8</Text>
              <Text style={styles.statLabel}>تقييم</Text>
            </View>
          </View>

          {/* About */}
          {salon.description ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>عن الصالون</Text>
              <Text style={styles.description}>{salon.description}</Text>
            </>
          ) : null}

          <View style={styles.divider} />

          {/* Services */}
          <Text style={styles.sectionTitle}>اختر الخدمات</Text>
          <Text style={styles.sectionSubtitle}>يمكنك اختيار أكثر من خدمة</Text>

          {services.length === 0 ? (
            <Text style={styles.emptyText}>لا توجد خدمات متاحة حالياً</Text>
          ) : (
            services.map((service: any) => {
              const isSelected = selectedServices.includes(service.id);
              const price = parseFloat(service.price || '0');
              return (
                <TouchableOpacity
                  key={service.id}
                  style={[styles.serviceRow, isSelected && styles.serviceRowSelected]}
                  activeOpacity={0.7}
                  onPress={() => toggleService(service.id)}
                >
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    {service.duration_minutes && service.duration_minutes > 0 ? (
                      <Text style={styles.serviceDuration}>{service.duration_minutes} دقيقة</Text>
                    ) : null}
                    <Text style={styles.servicePrice}>{price.toFixed(3)} د.أ</Text>
                  </View>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <IconSymbol name="checkmark" size={12} color="#0A0A0B" />}
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* Employees */}
          {salonData?.employees?.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>فريق العمل</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.empScroll}>
                {salonData.employees.map((emp: any) => (
                  <View key={emp.id} style={styles.empCard}>
                    {emp.avatar ? (
                      <Image
                        source={`${BASE_URL}${emp.avatar}`}
                        style={styles.empAvatar}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.empAvatar, styles.empAvatarPlaceholder]}>
                        <IconSymbol name="person.fill" size={28} color="#C3D809" />
                      </View>
                    )}
                    <Text style={styles.empName} numberOfLines={1}>{emp.name}</Text>
                    {emp.role ? <Text style={styles.empRole} numberOfLines={1}>{emp.role.split('||')[0]}</Text> : null}
                  </View>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </ScrollView>

      {/* Footer Booking Button */}
      {selectedServices.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>المجموع:</Text>
            <Text style={styles.totalAmount}>{totalPrice.toFixed(3)} د.أ</Text>
          </View>
          <TouchableOpacity
            style={styles.bookButton}
            activeOpacity={0.9}
            onPress={() => router.push({
              pathname: `/salon/${id}/book` as any,
              params: { slug: salon.slug, services: JSON.stringify(selectedServices) }
            })}
          >
            <Text style={styles.bookButtonText}>متابعة الحجز ({selectedServices.length})</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0A0B',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#AAAAAA',
    fontFamily: 'ElMessiri_400Regular',
    fontSize: 16,
  },
  backBtnCenter: {
    padding: 12,
  },
  imageContainer: {
    width: '100%',
    height: 320,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 11, 0.55)',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10, 10, 11, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(248, 248, 248, 0.1)',
  },
  heroTextContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    left: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: 'ElMessiri_700Bold',
    color: '#F8F8F8',
    textAlign: 'right',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroAddressRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  heroAddress: {
    color: '#DDDDDD',
    fontSize: 14,
    fontFamily: 'ElMessiri_400Regular',
  },
  content: {
    padding: 24,
    paddingBottom: 120,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#111112',
    borderRadius: 16,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: 'rgba(195, 216, 9, 0.1)',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'ElMessiri_700Bold',
    color: '#F8F8F8',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'ElMessiri_400Regular',
    color: '#AAAAAA',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(195, 216, 9, 0.12)',
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'ElMessiri_600SemiBold',
    color: '#C3D809',
    marginBottom: 12,
    textAlign: 'right',
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'ElMessiri_400Regular',
    color: '#AAAAAA',
    marginBottom: 16,
    textAlign: 'right',
  },
  description: {
    fontSize: 15,
    fontFamily: 'ElMessiri_400Regular',
    color: '#AAAAAA',
    lineHeight: 26,
    textAlign: 'right',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    fontFamily: 'ElMessiri_400Regular',
    fontSize: 15,
    marginVertical: 20,
  },
  serviceRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: '#111112',
  },
  serviceRowSelected: {
    borderColor: '#C3D809',
    backgroundColor: 'rgba(195, 216, 9, 0.06)',
  },
  serviceInfo: {
    flex: 1,
    gap: 4,
  },
  serviceName: {
    fontSize: 16,
    fontFamily: 'ElMessiri_500Medium',
    color: '#F8F8F8',
    textAlign: 'right',
  },
  serviceDuration: {
    fontSize: 12,
    fontFamily: 'ElMessiri_400Regular',
    color: '#777777',
    textAlign: 'right',
  },
  servicePrice: {
    fontSize: 15,
    fontFamily: 'ElMessiri_700Bold',
    color: '#C3D809',
    textAlign: 'right',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#AAAAAA',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  checkboxSelected: {
    backgroundColor: '#C3D809',
    borderColor: '#C3D809',
  },
  empScroll: {
    marginTop: 8,
  },
  empCard: {
    alignItems: 'center',
    marginLeft: 16,
    width: 80,
  },
  empAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: 'rgba(195, 216, 9, 0.4)',
  },
  empAvatarPlaceholder: {
    backgroundColor: '#111112',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empName: {
    color: '#F8F8F8',
    fontSize: 12,
    fontFamily: 'ElMessiri_500Medium',
    marginTop: 8,
    textAlign: 'center',
  },
  empRole: {
    color: '#AAAAAA',
    fontSize: 11,
    fontFamily: 'ElMessiri_400Regular',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 20,
    backgroundColor: '#0A0A0B',
    borderTopWidth: 1,
    borderTopColor: 'rgba(195, 216, 9, 0.1)',
  },
  totalRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'ElMessiri_500Medium',
    color: '#AAAAAA',
  },
  totalAmount: {
    fontSize: 22,
    fontFamily: 'ElMessiri_700Bold',
    color: '#F8F8F8',
  },
  bookButton: {
    backgroundColor: '#C3D809',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#C3D809',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bookButtonText: {
    color: '#0A0A0B',
    fontSize: 18,
    fontFamily: 'ElMessiri_700Bold',
  },
});
