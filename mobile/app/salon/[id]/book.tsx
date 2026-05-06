import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useState } from 'react';

// Generate some dummy days
const DATES = [
  { id: '1', dayName: 'اليوم', date: '15', full: '15 مايو' },
  { id: '2', dayName: 'غداً', date: '16', full: '16 مايو' },
  { id: '3', dayName: 'الخميس', date: '17', full: '17 مايو' },
  { id: '4', dayName: 'الجمعة', date: '18', full: '18 مايو' },
  { id: '5', dayName: 'السبت', date: '19', full: '19 مايو' },
];

const TIMES = [
  '10:00 ص', '11:00 ص', '12:00 م', '01:00 م', 
  '02:30 م', '04:00 م', '05:00 م', '06:30 م'
];

export default function BookingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [selectedDate, setSelectedDate] = useState(DATES[0].id);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!selectedTime) return;
    alert('تم تأكيد حجزك بنجاح! ✂️🔥');
    router.push('/(tabs)/explore'); // Go to bookings tab
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.right" size={24} color="#F8F8F8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تحديد الموعد</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Date Selector */}
        <Text style={styles.sectionTitle}>اختر اليوم</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
          {DATES.map((item) => {
            const isSelected = selectedDate === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.dateCard, isSelected && styles.dateCardActive]}
                onPress={() => setSelectedDate(item.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dateDayName, isSelected && styles.textBlack]}>{item.dayName}</Text>
                <Text style={[styles.dateNumber, isSelected && styles.textBlack]}>{item.date}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Time Selector */}
        <Text style={styles.sectionTitle}>الوقت المتاح</Text>
        <View style={styles.timeGrid}>
          {TIMES.map((time, index) => {
            const isSelected = selectedTime === time;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.timeSlot, isSelected && styles.timeSlotActive]}
                onPress={() => setSelectedTime(time)}
                activeOpacity={0.8}
              >
                <Text style={[styles.timeText, isSelected && styles.textBlack]}>{time}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Summary Receipt */}
        {selectedTime && (
          <View style={styles.receiptCard}>
            <Text style={styles.receiptTitle}>ملخص الحجز</Text>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>التاريخ:</Text>
              <Text style={styles.receiptValue}>{DATES.find(d => d.id === selectedDate)?.full}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>الوقت:</Text>
              <Text style={styles.receiptValue}>{selectedTime}</Text>
            </View>
            <View style={styles.receiptDivider} />
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>الإجمالي التقريبي:</Text>
              <Text style={[styles.receiptValue, { color: '#C3D809' }]}>١٥ د.أ</Text>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Footer Confirm Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.confirmButton, !selectedTime && styles.confirmButtonDisabled]} 
          activeOpacity={0.9}
          onPress={handleConfirm}
          disabled={!selectedTime}
        >
          <Text style={styles.confirmButtonText}>تأكيد الحجز</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#111112',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195, 216, 9, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'ElMessiri_700Bold',
    color: '#F8F8F8',
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
  dateScroll: {
    gap: 12,
    paddingBottom: 24,
    flexDirection: 'row-reverse',
  },
  dateCard: {
    width: 70,
    height: 90,
    borderRadius: 16,
    backgroundColor: '#111112',
    borderWidth: 1,
    borderColor: 'rgba(195, 216, 9, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dateCardActive: {
    backgroundColor: '#C3D809',
    borderColor: '#C3D809',
    shadowColor: '#C3D809',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  dateDayName: {
    fontSize: 14,
    fontFamily: 'ElMessiri_400Regular',
    color: '#AAAAAA',
  },
  dateNumber: {
    fontSize: 22,
    fontFamily: 'ElMessiri_700Bold',
    color: '#F8F8F8',
  },
  timeGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 32,
  },
  timeSlot: {
    width: '30%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#111112',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  timeSlotActive: {
    backgroundColor: '#C3D809',
    borderColor: '#C3D809',
  },
  timeText: {
    fontSize: 16,
    fontFamily: 'ElMessiri_500Medium',
    color: '#F8F8F8',
  },
  textBlack: {
    color: '#0A0A0B',
  },
  receiptCard: {
    backgroundColor: 'rgba(195, 216, 9, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(195, 216, 9, 0.2)',
    marginBottom: 100,
  },
  receiptTitle: {
    fontSize: 18,
    fontFamily: 'ElMessiri_600SemiBold',
    color: '#C3D809',
    marginBottom: 16,
    textAlign: 'center',
  },
  receiptRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  receiptLabel: {
    fontSize: 16,
    fontFamily: 'ElMessiri_400Regular',
    color: '#AAAAAA',
  },
  receiptValue: {
    fontSize: 16,
    fontFamily: 'ElMessiri_600SemiBold',
    color: '#F8F8F8',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: 'rgba(195, 216, 9, 0.1)',
    marginVertical: 12,
    borderStyle: 'dashed',
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
  confirmButton: {
    backgroundColor: '#C3D809',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#333333',
  },
  confirmButtonText: {
    color: '#0A0A0B',
    fontSize: 18,
    fontFamily: 'ElMessiri_700Bold',
  },
});
