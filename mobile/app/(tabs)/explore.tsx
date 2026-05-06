import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function BookingsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>حجوزاتي</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.sectionTitle}>القادمة</Text>
        
        {/* Dummy Booking Card */}
        <View style={styles.bookingCard}>
          <View style={styles.bookingHeader}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>مؤكد</Text>
            </View>
            <Text style={styles.bookingDate}>اليوم، ١٥ مايو</Text>
          </View>
          
          <View style={styles.bookingBody}>
            <Text style={styles.salonName}>صالون المقص الذهبي</Text>
            <Text style={styles.serviceText}>باقة العريس VIP - 10:00 ص</Text>
          </View>

          <View style={styles.bookingFooter}>
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
              <IconSymbol name="mappin.and.ellipse" size={16} color="#0A0A0B" />
              <Text style={styles.actionText}>الاتجاهات</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.outlineButton]} activeOpacity={0.8}>
              <Text style={styles.outlineText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>السابقة</Text>
        
        <View style={[styles.bookingCard, styles.pastCard]}>
          <View style={styles.bookingHeader}>
            <View style={[styles.statusBadge, { backgroundColor: '#333333' }]}>
              <Text style={[styles.statusText, { color: '#AAAAAA' }]}>مكتمل</Text>
            </View>
            <Text style={styles.bookingDate}>٥ مايو</Text>
          </View>
          <View style={styles.bookingBody}>
            <Text style={styles.salonName}>لمسة جمال</Text>
            <Text style={styles.serviceText}>حلاقة شعر كلاسيكية - 04:00 م</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#111112',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195, 216, 9, 0.1)',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'ElMessiri_700Bold',
    color: '#C3D809',
  },
  content: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'ElMessiri_600SemiBold',
    color: '#F8F8F8',
    marginBottom: 16,
    textAlign: 'right',
  },
  bookingCard: {
    backgroundColor: '#111112',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(195, 216, 9, 0.2)',
    marginBottom: 16,
  },
  pastCard: {
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    backgroundColor: '#C3D809',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'ElMessiri_700Bold',
    color: '#0A0A0B',
  },
  bookingDate: {
    fontSize: 14,
    fontFamily: 'ElMessiri_500Medium',
    color: '#AAAAAA',
  },
  bookingBody: {
    marginBottom: 16,
  },
  salonName: {
    fontSize: 20,
    fontFamily: 'ElMessiri_700Bold',
    color: '#F8F8F8',
    textAlign: 'right',
    marginBottom: 4,
  },
  serviceText: {
    fontSize: 14,
    fontFamily: 'ElMessiri_400Regular',
    color: '#AAAAAA',
    textAlign: 'right',
  },
  bookingFooter: {
    flexDirection: 'row-reverse',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C3D809',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    flex: 1,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'ElMessiri_700Bold',
    color: '#0A0A0B',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  outlineText: {
    fontSize: 14,
    fontFamily: 'ElMessiri_500Medium',
    color: '#F8F8F8',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 24,
  },
});
