import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useState } from 'react';

// Dummy data for details
const DUMMY_SALONS: Record<string, any> = {
  '1': { name: 'صالون المقص الذهبي', address: 'عمان, الدوار السابع', rating: 4.8, image: 'https://images.unsplash.com/photo-1521590832167-7bfcfaa6362f?q=80&w=1470&auto=format&fit=crop', description: 'أفضل صالون حلاقة وعناية بالرجل في المنطقة، نقدم خدمات متكاملة للعريس والعناية بالبشرة.' },
  '2': { name: 'لمسة جمال', address: 'إربد, شارع الجامعة', rating: 4.5, image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1469&auto=format&fit=crop', description: 'لمسة جمال تقدم لك أحدث القصات والصيحات في عالم العناية بالشعر واللحية.' },
  '3': { name: 'أناقة رجل', address: 'الزرقاء, شارع السعادة', rating: 4.9, image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=1470&auto=format&fit=crop', description: 'صمم خصيصاً للرجل الأنيق. خدمات VIP وأجواء سينمائية فاخرة.' },
};

const DUMMY_SERVICES = [
  { id: 's1', name: 'حلاقة شعر كلاسيكية', price: 10 },
  { id: 's2', name: 'تحديد لحية', price: 5 },
  { id: 's3', name: 'باقة العريس VIP', price: 50 },
  { id: 's4', name: 'تنظيف بشرة', price: 15 },
];

export default function SalonDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const salon = DUMMY_SALONS[id as string] || DUMMY_SALONS['1'];
  
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const totalPrice = selectedServices.reduce((total, sId) => {
    const service = DUMMY_SERVICES.find(s => s.id === sId);
    return total + (service?.price || 0);
  }, 0);

  return (
    <View style={styles.container}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image source={salon.image} style={styles.heroImage} contentFit="cover" />
          <View style={styles.overlay} />
          
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.right" size={24} color="#F8F8F8" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{salon.name}</Text>
            <View style={styles.ratingBadge}>
              <IconSymbol name="star.fill" size={14} color="#0A0A0B" />
              <Text style={styles.ratingText}>{salon.rating}</Text>
            </View>
          </View>

          <View style={styles.addressRow}>
            <IconSymbol name="mappin.and.ellipse" size={16} color="#C3D809" />
            <Text style={styles.addressText}>{salon.address}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>عن الصالون</Text>
          <Text style={styles.description}>{salon.description}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>اختر الخدمات</Text>
          <Text style={styles.sectionSubtitle}>يمكنك اختيار أكثر من خدمة</Text>
          
          {DUMMY_SERVICES.map((service) => {
            const isSelected = selectedServices.includes(service.id);
            return (
              <TouchableOpacity 
                key={service.id} 
                style={[styles.serviceRow, isSelected && styles.serviceRowSelected]}
                activeOpacity={0.7}
                onPress={() => toggleService(service.id)}
              >
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.servicePrice}>{service.price} د.أ</Text>
                </View>
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                  {isSelected && <IconSymbol name="checkmark" size={12} color="#0A0A0B" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Floating Booking Button */}
      {selectedServices.length > 0 ? (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>المجموع:</Text>
            <Text style={styles.totalAmount}>{totalPrice} د.أ</Text>
          </View>
          <TouchableOpacity 
            style={styles.bookButton} 
            activeOpacity={0.9}
            onPress={() => router.push(`/salon/${id}/book` as any)}
          >
            <Text style={styles.bookButtonText}>متابعة الحجز ({selectedServices.length})</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  imageContainer: {
    width: '100%',
    height: 350,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 11, 0.4)',
    bottom: 0,
    height: '100%',
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
  content: {
    padding: 24,
    paddingBottom: 100, // space for footer
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontFamily: 'ElMessiri_700Bold',
    color: '#F8F8F8',
    flex: 1,
    textAlign: 'right',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C3D809',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    marginLeft: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0A0A0B',
  },
  addressRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  addressText: {
    fontSize: 16,
    fontFamily: 'ElMessiri_400Regular',
    color: '#AAAAAA',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(195, 216, 9, 0.15)',
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'ElMessiri_600SemiBold',
    color: '#C3D809',
    marginBottom: 16,
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
    fontSize: 16,
    fontFamily: 'ElMessiri_400Regular',
    color: '#AAAAAA',
    lineHeight: 24,
    textAlign: 'right',
  },
  serviceRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#111112',
  },
  serviceRowSelected: {
    borderColor: '#C3D809',
    backgroundColor: 'rgba(195, 216, 9, 0.05)',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontFamily: 'ElMessiri_500Medium',
    color: '#F8F8F8',
    textAlign: 'right',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 14,
    fontFamily: 'ElMessiri_700Bold',
    color: '#C3D809',
    textAlign: 'right',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
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
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 24,
    backgroundColor: '#0A0A0B',
    borderTopWidth: 1,
    borderTopColor: 'rgba(195, 216, 9, 0.1)',
  },
  totalRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'ElMessiri_500Medium',
    color: '#AAAAAA',
  },
  totalAmount: {
    fontSize: 24,
    fontFamily: 'ElMessiri_700Bold',
    color: '#F8F8F8',
  },
  bookButton: {
    backgroundColor: '#C3D809',
    paddingVertical: 16,
    borderRadius: 12,
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
