import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Share } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

const BASE_URL = 'https://maqas.site/';
const ARABIC_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(timeStr: string) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h < 12 ? 'ص' : 'م';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'قيد الانتظار', color: '#FFA500', bg: 'rgba(255,165,0,0.15)' },
  confirmed: { label: 'مؤكد',         color: '#C3D809', bg: 'rgba(195,216,9,0.15)' },
  completed: { label: 'مكتمل',        color: '#888',    bg: 'rgba(255,255,255,0.07)' },
  cancelled: { label: 'ملغي',         color: '#FF4B4B', bg: 'rgba(255,75,75,0.15)' },
};

export default function BookingsScreen() {
  const [phone, setPhone] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchBookings = async (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('تنبيه', 'أدخل رقم هاتف أردني صحيح (07XXXXXXXX)');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`${BASE_URL}api/public/my-bookings.php?phone=${phoneNumber}`);
      const json = await res.json();
      if (json.success) {
        setUpcoming(json.data.upcoming || []);
        setPast(json.data.past || []);
        setSearchPhone(phoneNumber);
      } else {
        Alert.alert('خطأ', json.message || 'لم نجد أي حجوزات');
      }
    } catch (e) {
      Alert.alert('خطأ في الشبكة', 'تأكد من اتصالك بالإنترنت');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (booking: any) => {
    try {
      await Share.share({
        message: `📅 موعدي في ${booking.salon_name}\n🗓 ${formatDate(booking.booking_date)} | ⏰ ${formatTime(booking.booking_time)}\n✂️ ${booking.service_names}\n\nاحجز عبر تطبيق مقص`,
      });
    } catch (e) {}
  };

  const BookingCard = ({ item, isPast }: { item: any; isPast: boolean }) => {
    const status = STATUS_MAP[item.status] || STATUS_MAP.pending;
    return (
      <View style={[styles.card, isPast && styles.pastCard]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(item.booking_date)}</Text>
        </View>

        {/* Salon & Services */}
        <View style={styles.cardBody}>
          <Text style={styles.salonName}>{item.salon_name}</Text>
          <View style={styles.detailRow}>
            <IconSymbol name="scissors" size={14} color="#C3D809" />
            <Text style={styles.detailText}>{item.service_names || 'خدمة حلاقة'}</Text>
          </View>
          <View style={styles.detailRow}>
            <IconSymbol name="clock" size={14} color="#AAAAAA" />
            <Text style={styles.detailText}>{formatTime(item.booking_time)}</Text>
          </View>
          {item.employee_name && (
            <View style={styles.detailRow}>
              <IconSymbol name="person.fill" size={14} color="#AAAAAA" />
              <Text style={styles.detailText}>{item.employee_name}</Text>
            </View>
          )}
          {item.total_price > 0 && (
            <View style={styles.detailRow}>
              <IconSymbol name="creditcard.fill" size={14} color="#AAAAAA" />
              <Text style={[styles.detailText, { color: '#C3D809' }]}>{item.total_price.toFixed(2)} د.أ</Text>
            </View>
          )}
        </View>

        {/* Footer Actions */}
        {!isPast && (
          <View style={styles.cardFooter}>
            <TouchableOpacity style={styles.shareBtn} onPress={() => handleShare(item)}>
              <IconSymbol name="square.and.arrow.up" size={15} color="#C3D809" />
              <Text style={styles.shareBtnText}>مشاركة</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>حجوزاتي</Text>
        <Text style={styles.headerSub}>أدخل رقمك لعرض مواعيدك</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchRow}>
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={() => fetchBookings(phone)}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator size="small" color="#0A0A0B" />
                : <IconSymbol name="magnifyingglass" size={20} color="#0A0A0B" />
              }
            </TouchableOpacity>
            <TextInput
              style={styles.searchInput}
              placeholder="07XXXXXXXX"
              placeholderTextColor="#555"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              textAlign="left"
              onSubmitEditing={() => fetchBookings(phone)}
            />
          </View>
          <Text style={styles.searchHint}>أدخل رقم الهاتف الذي استخدمته عند الحجز</Text>
        </View>

        {/* Results */}
        {searched && !loading && (
          <>
            {upcoming.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📅 المواعيد القادمة ({upcoming.length})</Text>
                {upcoming.map(b => <BookingCard key={b.id} item={b} isPast={false} />)}
              </View>
            )}

            {past.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📂 السابقة ({past.length})</Text>
                {past.map(b => <BookingCard key={b.id} item={b} isPast />)}
              </View>
            )}

            {upcoming.length === 0 && past.length === 0 && (
              <View style={styles.emptyState}>
                <IconSymbol name="calendar.badge.exclamationmark" size={60} color="#333" />
                <Text style={styles.emptyTitle}>لا توجد حجوزات</Text>
                <Text style={styles.emptySubtitle}>لم نجد أي حجوزات مرتبطة بالرقم{'\n'}{searchPhone}</Text>
              </View>
            )}
          </>
        )}

        {!searched && (
          <View style={styles.emptyState}>
            <IconSymbol name="calendar" size={60} color="#222" />
            <Text style={styles.emptyTitle}>حجوزاتك هنا</Text>
            <Text style={styles.emptySubtitle}>أدخل رقم هاتفك أعلاه{'\n'}لعرض مواعيدك كلها</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0B' },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#0A0A0B',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195, 216, 9, 0.08)',
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: 'ElMessiri_700Bold',
    color: '#C3D809',
    textAlign: 'center',
  },
  headerSub: {
    fontSize: 13,
    fontFamily: 'ElMessiri_400Regular',
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  searchSection: {
    padding: 24,
    paddingBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111112',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(195,216,9,0.2)',
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    height: 54,
    color: '#F8F8F8',
    fontFamily: 'ElMessiri_500Medium',
    fontSize: 18,
    paddingHorizontal: 16,
    letterSpacing: 1,
  },
  searchBtn: {
    width: 54,
    height: 54,
    backgroundColor: '#C3D809',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchHint: {
    fontSize: 12,
    fontFamily: 'ElMessiri_400Regular',
    color: '#555',
    textAlign: 'center',
    marginTop: 10,
  },
  section: { paddingHorizontal: 20, marginTop: 12 },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'ElMessiri_700Bold',
    color: '#F8F8F8',
    marginBottom: 14,
    textAlign: 'right',
  },
  card: {
    backgroundColor: '#111112',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(195, 216, 9, 0.15)',
  },
  pastCard: { borderColor: 'rgba(255,255,255,0.05)', opacity: 0.75 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusText: { fontSize: 12, fontFamily: 'ElMessiri_700Bold' },
  dateText: { fontSize: 13, fontFamily: 'ElMessiri_500Medium', color: '#AAAAAA' },
  cardBody: { gap: 8, marginBottom: 4 },
  salonName: {
    fontSize: 20,
    fontFamily: 'ElMessiri_700Bold',
    color: '#F8F8F8',
    textAlign: 'right',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'ElMessiri_400Regular',
    color: '#AAAAAA',
    flex: 1,
    textAlign: 'right',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 14,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(195,216,9,0.3)',
  },
  shareBtnText: { color: '#C3D809', fontFamily: 'ElMessiri_600SemiBold', fontSize: 14 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'ElMessiri_700Bold',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'ElMessiri_400Regular',
    color: '#444',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 24,
  },
});
