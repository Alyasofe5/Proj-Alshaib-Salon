import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { Image } from 'expo-image';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useEffect, useState, useMemo } from 'react';

const BASE_URL = 'https://maqas.site/';
const ARABIC_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const ARABIC_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function generateDates(bookingDays: number, offDays: number[]): any[] {
  const dates = [];
  const today = new Date();
  let count = 0;
  let i = 0;
  while (count < bookingDays && i < 60) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayOfWeek = d.getDay(); // 0=Sun
    if (!offDays.includes(dayOfWeek)) {
      dates.push({
        full: d,
        iso: d.toISOString().split('T')[0],
        dayName: i === 0 ? 'اليوم' : i === 1 ? 'غداً' : ARABIC_DAYS[dayOfWeek],
        date: d.getDate().toString(),
        month: ARABIC_MONTHS[d.getMonth()],
      });
      count++;
    }
    i++;
  }
  return dates;
}

function generateTimeSlotsISO(start: string, end: string, interval: number): { display: string; iso: string }[] {
  const slots = [];
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;

  // Treat 00:00 as midnight (24:00), also handle wrap-around
  if (endMin === 0 || endMin <= startMin) {
    endMin = 24 * 60;
  }

  let cur = startMin;
  while (cur < endMin) {
    const h = Math.floor(cur / 60) % 24;
    const m = cur % 60;
    const hh = h.toString().padStart(2, '0');
    const mm = m.toString().padStart(2, '0');
    const period = h < 12 ? 'ص' : 'م';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    slots.push({ display: `${h12}:${mm} ${period}`, iso: `${hh}:${mm}` });
    cur += interval;
  }
  return slots;
}


export default function BookingScreen() {
  const { id, slug, services: servicesParam } = useLocalSearchParams();
  const router = useRouter();

  const [salonData, setSalonData] = useState<any>(null);
  const [bookedSlots, setBookedSlots] = useState<any[]>([]);
  const [offEmployeeIds, setOffEmployeeIds] = useState<number[]>([]);

  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<any>(null);
  const [selectedTime, setSelectedTime] = useState<{ display: string; iso: string } | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const selectedServiceIds: number[] = servicesParam
    ? JSON.parse(servicesParam as string)
    : [];

  useEffect(() => {
    if (slug) fetchSalonData();
    else setPageLoading(false);
  }, [slug]);

  useEffect(() => {
    if (selectedDate && salonData) fetchBookedSlots();
  }, [selectedDate]);

  const fetchSalonData = async () => {
    try {
      const res = await fetch(`${BASE_URL}api/booking/salon.php?slug=${slug}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSalonData(json.data);
        // Set default date
        const dates = generateDates(json.data.booking_days || 7, json.data.off_days || []);
        if (dates.length > 0) setSelectedDate(dates[0]);
      }
    } catch (e) {
      console.error('fetchSalonData error:', e);
    } finally {
      setPageLoading(false);
    }
  };

  const fetchBookedSlots = async () => {
    if (!selectedDate) return;
    setFetchingSlots(true);
    try {
      const res = await fetch(`${BASE_URL}api/booking/book.php?slug=${slug}&date=${selectedDate.iso}`);
      const json = await res.json();
      if (json.success && json.data) {
        setBookedSlots(json.data.booked_slots || []);
        setOffEmployeeIds(json.data.off_employees_ids || []);
      }
    } catch (e) {
      console.error('fetchBookedSlots error:', e);
    } finally {
      setFetchingSlots(false);
    }
  };

  const isSlotBooked = (isoTime: string) => {
    if (!selectedEmployee) return false;
    return bookedSlots.some(
      b => b.booking_time === isoTime && b.employee_id === selectedEmployee
    );
  };

  const salon = salonData?.salon;
  const employees = (salonData?.employees || []).filter((e: any) => !offEmployeeIds.includes(e.id));
  const services = salonData?.services || [];
  const workHours = salonData?.work_hours || { start: '09:00', end: '22:00', interval: 30 };
  const dates = useMemo(() => {
    return salonData ? generateDates(salonData.booking_days || 7, salonData.off_days || []) : [];
  }, [salonData]);
  const timeSlots = useMemo(() => {
    return generateTimeSlotsISO(workHours.start, workHours.end, workHours.interval);
  }, [workHours]);

  const selectedServiceObjects = services.filter((s: any) => selectedServiceIds.includes(s.id));
  const totalPrice = selectedServiceObjects.reduce((t: number, s: any) => t + parseFloat(s.price || '0'), 0);

  const handleConfirm = async () => {
    if (!selectedTime || !customerName || !customerPhone) {
      Alert.alert('تنبيه', 'يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    try {
      const body: any = {
        salon_slug: slug,
        service_ids: selectedServiceIds.length > 0 ? selectedServiceIds : selectedServiceObjects.map((s: any) => s.id),
        booking_date: selectedDate?.iso,
        booking_time: selectedTime.iso,
        customer_name: customerName,
        customer_phone: customerPhone,
        notes,
      };
      if (selectedEmployee) body.employee_id = selectedEmployee;

      const res = await fetch(`${BASE_URL}api/booking/book.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        Alert.alert(
          '✅ تم الحجز بنجاح',
          `رقم الحجز: ${data.data?.id}\nالتاريخ: ${selectedDate?.dayName} ${selectedDate?.date} ${selectedDate?.month}\nالوقت: ${selectedTime?.display}`,
          [{ text: 'حسناً', onPress: () => router.push('/(tabs)' as any) }]
        );
      } else {
        Alert.alert('خطأ', data.message || 'فشل الحجز');
      }
    } catch (e) {
      Alert.alert('خطأ', 'فشل الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <View style={styles.loadingFull}>
        <ActivityIndicator size="large" color="#C3D809" />
      </View>
    );
  }

  const canConfirm = selectedDate && selectedTime && customerName.trim().length >= 3 && customerPhone.trim().length === 10;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="chevron.right" size={22} color="#F8F8F8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تحديد الموعد</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Selected Services Summary */}
        {selectedServiceObjects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>الخدمات المختارة</Text>
            {selectedServiceObjects.map((s: any) => (
              <View key={s.id} style={styles.summaryRow}>
                <Text style={styles.summaryPrice}>{parseFloat(s.price).toFixed(3)} د.أ</Text>
                <Text style={styles.summaryName}>{s.name}</Text>
              </View>
            ))}
            <View style={styles.totalLine}>
              <Text style={styles.totalAmount}>{totalPrice.toFixed(3)} د.أ</Text>
              <Text style={styles.totalLabel}>المجموع</Text>
            </View>
          </View>
        )}

        {/* Employee Picker */}
        {employees.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>اختر الحلاق</Text>
            <Text style={styles.sectionHint}>اختياري - يمكنك ترك الاختيار تلقائياً</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.empRow}>
              {/* Any barber option */}
              <TouchableOpacity
                style={[styles.empCard, selectedEmployee === null && styles.empCardActive]}
                onPress={() => setSelectedEmployee(null)}
              >
                <View style={[styles.empAvatarAny, selectedEmployee === null && styles.empAvatarAnyActive]}>
                  <IconSymbol name="person.2.fill" size={24} color={selectedEmployee === null ? '#0A0A0B' : '#C3D809'} />
                </View>
                <Text style={[styles.empName, selectedEmployee === null && styles.empNameActive]}>أي حلاق</Text>
              </TouchableOpacity>

              {employees.map((emp: any) => (
                <TouchableOpacity
                  key={emp.id}
                  style={[styles.empCard, selectedEmployee === emp.id && styles.empCardActive]}
                  onPress={() => setSelectedEmployee(emp.id)}
                >
                  {emp.avatar ? (
                    <Image source={`${BASE_URL}${emp.avatar}`} style={styles.empAvatar} contentFit="cover" />
                  ) : (
                    <View style={[styles.empAvatar, styles.empAvatarPlaceholder]}>
                      <IconSymbol name="person.fill" size={26} color="#C3D809" />
                    </View>
                  )}
                  <Text style={[styles.empName, selectedEmployee === emp.id && styles.empNameActive]} numberOfLines={1}>
                    {emp.name?.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Date Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>اختر اليوم</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.datesRow}>
              {dates.map((d, idx) => {
                const isActive = selectedDate?.iso === d.iso;
                return (
                  <TouchableOpacity
                    key={d.iso}
                    style={[styles.dateCard, isActive && styles.dateCardActive]}
                    onPress={() => { setSelectedDate(d); setSelectedTime(null); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dateDayName, isActive && styles.textBlack]}>{d.dayName}</Text>
                    <Text style={[styles.dateNum, isActive && styles.textBlack]}>{d.date}</Text>
                    <Text style={[styles.dateMonth, isActive && styles.textBlack]}>{d.month}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Time Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الوقت المتاح</Text>
          {fetchingSlots ? (
            <ActivityIndicator color="#C3D809" style={{ marginVertical: 16 }} />
          ) : (
            <View style={styles.timeGrid}>
              {timeSlots.map((slot, idx) => {
                const booked = isSlotBooked(slot.iso);
                const isActive = selectedTime?.iso === slot.iso;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.timeSlot, isActive && styles.timeSlotActive, booked && styles.timeSlotBooked]}
                    onPress={() => !booked && setSelectedTime(slot)}
                    activeOpacity={booked ? 1 : 0.8}
                    disabled={booked}
                  >
                    <Text style={[styles.timeText, isActive && styles.textBlack, booked && styles.timeTextBooked]}>
                      {slot.display}
                    </Text>
                    {booked && <Text style={styles.bookedLabel}>محجوز</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>بياناتك</Text>

          <Text style={styles.inputLabel}>الاسم الكامل *</Text>
          <TextInput
            style={styles.input}
            placeholder="أدخل اسمك الكامل"
            placeholderTextColor="#555"
            value={customerName}
            onChangeText={setCustomerName}
            textAlign="right"
          />

          <Text style={styles.inputLabel}>رقم الهاتف * <Text style={styles.inputHint}>(07XXXXXXXX)</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="07XXXXXXXX"
            placeholderTextColor="#555"
            value={customerPhone}
            onChangeText={setCustomerPhone}
            keyboardType="phone-pad"
            textAlign="left"
            maxLength={10}
          />

          <Text style={styles.inputLabel}>ملاحظات <Text style={styles.inputHint}>(اختياري)</Text></Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="أي طلبات إضافية..."
            placeholderTextColor="#555"
            value={notes}
            onChangeText={setNotes}
            textAlign="right"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Booking Summary Receipt */}
        {selectedDate && selectedTime && (
          <View style={styles.receipt}>
            <Text style={styles.receiptTitle}>✂️ ملخص الحجز</Text>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptVal}>{selectedDate.dayName} {selectedDate.date} {selectedDate.month}</Text>
              <Text style={styles.receiptKey}>📅 التاريخ</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptVal}>{selectedTime.display}</Text>
              <Text style={styles.receiptKey}>⏰ الوقت</Text>
            </View>
            {selectedEmployee && (
              <View style={styles.receiptRow}>
                <Text style={styles.receiptVal}>{employees.find((e: any) => e.id === selectedEmployee)?.name}</Text>
                <Text style={styles.receiptKey}>💈 الحلاق</Text>
              </View>
            )}
            <View style={styles.receiptDivider} />
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptVal, { color: '#C3D809', fontSize: 18 }]}>
                {totalPrice > 0 ? `${totalPrice.toFixed(3)} د.أ` : 'حسب الاتفاق'}
              </Text>
              <Text style={styles.receiptKey}>💰 الإجمالي</Text>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!canConfirm || loading}
          activeOpacity={0.9}
        >
          {loading
            ? <ActivityIndicator color="#0A0A0B" />
            : <Text style={styles.confirmBtnText}>تأكيد الحجز ✓</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0B' },
  loadingFull: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A0A0B' },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#111112',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195,216,9,0.1)',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20, fontFamily: 'ElMessiri_700Bold', color: '#F8F8F8',
  },
  scroll: { flex: 1 },
  section: {
    marginHorizontal: 20, marginTop: 24,
    backgroundColor: '#111112',
    borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  sectionTitle: {
    fontSize: 18, fontFamily: 'ElMessiri_600SemiBold',
    color: '#C3D809', textAlign: 'right', marginBottom: 6,
  },
  sectionHint: {
    fontSize: 13, fontFamily: 'ElMessiri_400Regular',
    color: '#666', textAlign: 'right', marginBottom: 14,
  },

  // Services Summary
  summaryRow: {
    flexDirection: 'row-reverse', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  summaryName: { fontSize: 15, fontFamily: 'ElMessiri_400Regular', color: '#F8F8F8' },
  summaryPrice: { fontSize: 15, fontFamily: 'ElMessiri_700Bold', color: '#C3D809' },
  totalLine: {
    flexDirection: 'row-reverse', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(195,216,9,0.2)',
  },
  totalLabel: { fontSize: 15, fontFamily: 'ElMessiri_500Medium', color: '#AAAAAA' },
  totalAmount: { fontSize: 20, fontFamily: 'ElMessiri_700Bold', color: '#F8F8F8' },

  // Employees
  empRow: { marginTop: 4 },
  empCard: {
    alignItems: 'center', marginRight: 12,
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 14, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    minWidth: 72,
  },
  empCardActive: {
    borderColor: '#C3D809',
    backgroundColor: 'rgba(195,216,9,0.08)',
  },
  empAvatarAny: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(195,216,9,0.1)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(195,216,9,0.3)',
  },
  empAvatarAnyActive: {
    backgroundColor: '#C3D809',
    borderColor: '#C3D809',
  },
  empAvatar: {
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 2, borderColor: 'rgba(195,216,9,0.3)',
  },
  empAvatarPlaceholder: {
    backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center',
  },
  empName: {
    fontSize: 12, fontFamily: 'ElMessiri_500Medium',
    color: '#AAAAAA', marginTop: 8, textAlign: 'center',
  },
  empNameActive: { color: '#C3D809' },

  // Dates
  datesRow: { flexDirection: 'row-reverse', gap: 10, paddingBottom: 4 },
  dateCard: {
    width: 68, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#0A0A0B', alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: 'rgba(195,216,9,0.15)',
  },
  dateCardActive: {
    backgroundColor: '#C3D809', borderColor: '#C3D809',
    shadowColor: '#C3D809', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  dateDayName: { fontSize: 12, fontFamily: 'ElMessiri_400Regular', color: '#AAAAAA' },
  dateNum: { fontSize: 22, fontFamily: 'ElMessiri_700Bold', color: '#F8F8F8' },
  dateMonth: { fontSize: 11, fontFamily: 'ElMessiri_400Regular', color: '#777' },
  textBlack: { color: '#0A0A0B' },

  // Times
  timeGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  timeSlot: {
    width: '30%', paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#0A0A0B', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  timeSlotActive: { backgroundColor: '#C3D809', borderColor: '#C3D809' },
  timeSlotBooked: { backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,0,0,0.15)', opacity: 0.5 },
  timeText: { fontSize: 14, fontFamily: 'ElMessiri_500Medium', color: '#F8F8F8' },
  timeTextBooked: { color: '#555', fontSize: 13 },
  bookedLabel: { fontSize: 10, color: '#FF4444', fontFamily: 'ElMessiri_400Regular', marginTop: 2 },

  // Customer Info
  inputLabel: {
    fontSize: 14, fontFamily: 'ElMessiri_500Medium',
    color: '#AAAAAA', textAlign: 'right', marginBottom: 8, marginTop: 14,
  },
  inputHint: { fontSize: 12, color: '#555' },
  input: {
    backgroundColor: '#0A0A0B', borderRadius: 12, padding: 14,
    color: '#F8F8F8', fontSize: 16, fontFamily: 'ElMessiri_400Regular',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  inputMultiline: { height: 90, textAlignVertical: 'top' },

  // Receipt
  receipt: {
    marginHorizontal: 20, marginTop: 20,
    backgroundColor: 'rgba(195,216,9,0.04)',
    borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: 'rgba(195,216,9,0.2)',
    borderStyle: 'dashed',
  },
  receiptTitle: {
    fontSize: 18, fontFamily: 'ElMessiri_700Bold',
    color: '#C3D809', textAlign: 'center', marginBottom: 16,
  },
  receiptRow: {
    flexDirection: 'row-reverse', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  receiptKey: { fontSize: 14, fontFamily: 'ElMessiri_400Regular', color: '#AAAAAA' },
  receiptVal: { fontSize: 15, fontFamily: 'ElMessiri_600SemiBold', color: '#F8F8F8' },
  receiptDivider: {
    height: 1, backgroundColor: 'rgba(195,216,9,0.15)',
    marginVertical: 12,
  },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, width: '100%',
    padding: 20, backgroundColor: '#0A0A0B',
    borderTopWidth: 1, borderTopColor: 'rgba(195,216,9,0.1)',
  },
  confirmBtn: {
    backgroundColor: '#C3D809', paddingVertical: 17,
    borderRadius: 14, alignItems: 'center',
    shadowColor: '#C3D809', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 7,
  },
  confirmBtnDisabled: { backgroundColor: '#2A2A2A', shadowOpacity: 0 },
  confirmBtnText: { fontSize: 18, fontFamily: 'ElMessiri_700Bold', color: '#0A0A0B' },
});
