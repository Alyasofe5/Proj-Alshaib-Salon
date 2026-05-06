import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  TextInput, Alert, Linking, Modal, Pressable, Switch
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const STORAGE_KEY_NAME  = '@maqas_user_name';
const STORAGE_KEY_PHONE = '@maqas_user_phone';
const WHATSAPP_SUPPORT  = '962799999999'; // رقم واتساب الدعم - عدّله حسب رقمك الفعلي
const TERMS_URL         = 'https://maqas.site/terms';

export default function ProfileScreen() {
  const router = useRouter();
  const [name, setName]   = useState('');
  const [phone, setPhone] = useState('');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName]   = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [showAbout, setShowAbout] = useState(false);

  // ── Load saved profile ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const n = await AsyncStorage.getItem(STORAGE_KEY_NAME);
      const p = await AsyncStorage.getItem(STORAGE_KEY_PHONE);
      if (n) setName(n);
      if (p) setPhone(p);
    })();
  }, []);

  // ── Save profile ────────────────────────────────────────────────
  const saveProfile = async () => {
    if (!editName.trim() || editName.trim().length < 3) {
      Alert.alert('تنبيه', 'الاسم يجب أن يكون 3 أحرف على الأقل');
      return;
    }
    if (editPhone && !/^07\d{8}$/.test(editPhone)) {
      Alert.alert('تنبيه', 'رقم الهاتف يجب أن يكون بصيغة 07XXXXXXXX');
      return;
    }
    await AsyncStorage.setItem(STORAGE_KEY_NAME, editName.trim());
    await AsyncStorage.setItem(STORAGE_KEY_PHONE, editPhone.trim());
    setName(editName.trim());
    setPhone(editPhone.trim());
    setEditing(false);
    Alert.alert('✅ تم الحفظ', 'تم تحديث بياناتك بنجاح');
  };

  const startEdit = () => {
    setEditName(name);
    setEditPhone(phone);
    setEditing(true);
  };

  // ── Logout ──────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل تريد مسح بياناتك المحفوظة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تسجيل الخروج',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove([STORAGE_KEY_NAME, STORAGE_KEY_PHONE]);
            setName('');
            setPhone('');
          },
        },
      ]
    );
  };

  // ── WhatsApp Support ────────────────────────────────────────────
  const openWhatsApp = () => {
    const url = `whatsapp://send?phone=${WHATSAPP_SUPPORT}&text=مرحباً، أحتاج للمساعدة في تطبيق مقص`;
    Linking.canOpenURL(url).then(ok => {
      if (ok) Linking.openURL(url);
      else Linking.openURL(`https://wa.me/${WHATSAPP_SUPPORT}`);
    });
  };

  const openTerms = () => Linking.openURL(TERMS_URL);

  // ── Avatar initials ─────────────────────────────────────────────
  const initials = name
    ? name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '؟';

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>حسابي</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Profile Card ─────────────────────────────────────── */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{name || 'أضف اسمك'}</Text>
            <Text style={styles.userPhone}>{phone || 'لم يُضف رقم هاتف'}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={startEdit} activeOpacity={0.8}>
            <IconSymbol name="pencil" size={18} color="#0A0A0B" />
          </TouchableOpacity>
        </View>

        {/* ── Edit Modal ────────────────────────────────────────── */}
        <Modal visible={editing} transparent animationType="slide">
          <Pressable style={styles.modalOverlay} onPress={() => setEditing(false)}>
            <Pressable style={styles.modalSheet} onPress={e => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>تعديل البيانات</Text>

              <Text style={styles.inputLabel}>الاسم الكامل</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="أدخل اسمك"
                placeholderTextColor="#555"
                textAlign="right"
              />

              <Text style={styles.inputLabel}>رقم الهاتف</Text>
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="07XXXXXXXX"
                placeholderTextColor="#555"
                keyboardType="phone-pad"
                maxLength={10}
                textAlign="left"
              />

              <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
                <Text style={styles.saveBtnText}>حفظ التغييرات</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                <Text style={styles.cancelBtnText}>إلغاء</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* ── My Bookings Shortcut ──────────────────────────────── */}
        <TouchableOpacity
          style={styles.bookingsShortcut}
          activeOpacity={0.85}
          onPress={() => router.push('/(tabs)/explore' as any)}
        >
          <View>
            <Text style={styles.bookingsShortcutTitle}>حجوزاتي</Text>
            <Text style={styles.bookingsShortcutSub}>عرض مواعيدك القادمة والسابقة</Text>
          </View>
          <View style={styles.bookingsShortcutIcon}>
            <IconSymbol name="calendar.badge.clock" size={26} color="#0A0A0B" />
          </View>
        </TouchableOpacity>

        {/* ── Settings ─────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>الإعدادات</Text>
        <View style={styles.menuCard}>
          <View style={styles.menuItem}>
            <Switch
              value={notifEnabled}
              onValueChange={setNotifEnabled}
              trackColor={{ false: '#333', true: '#C3D809' }}
              thumbColor="#FFF"
            />
            <View style={styles.menuItemRight}>
              <Text style={styles.menuText}>الإشعارات</Text>
              <View style={styles.iconBox}>
                <IconSymbol name="bell.fill" size={16} color="#C3D809" />
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.8} onPress={() => setShowAbout(true)}>
            <IconSymbol name="chevron.left" size={18} color="#444" />
            <View style={styles.menuItemRight}>
              <Text style={styles.menuText}>عن التطبيق</Text>
              <View style={styles.iconBox}>
                <IconSymbol name="info.circle.fill" size={16} color="#C3D809" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── About Modal ───────────────────────────────────────── */}
        <Modal visible={showAbout} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setShowAbout(false)}>
            <Pressable style={[styles.modalSheet, { paddingBottom: 30 }]} onPress={e => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>عن تطبيق مقص</Text>
              <Text style={styles.aboutText}>
                منصة مقص هي منصة أردنية متكاملة لحجوزات صالونات الحلاقة الرجالية.{'\n\n'}
                تتيح لك اكتشاف أفضل الصالونات، حجز مواعيدك بسهولة، واختيار الحلاق المفضل لديك.{'\n\n'}
                الإصدار: 1.0.0
              </Text>
              <TouchableOpacity style={styles.saveBtn} onPress={() => setShowAbout(false)}>
                <Text style={styles.saveBtnText}>إغلاق</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* ── Support ──────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>الدعم والمساعدة</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.8} onPress={openTerms}>
            <IconSymbol name="chevron.left" size={18} color="#444" />
            <View style={styles.menuItemRight}>
              <Text style={styles.menuText}>الشروط والأحكام</Text>
              <View style={styles.iconBox}>
                <IconSymbol name="doc.text.fill" size={16} color="#C3D809" />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.8} onPress={openWhatsApp}>
            <IconSymbol name="chevron.left" size={18} color="#444" />
            <View style={styles.menuItemRight}>
              <Text style={styles.menuText}>تواصل معنا (واتساب)</Text>
              <View style={styles.iconBox}>
                <IconSymbol name="phone.fill" size={16} color="#C3D809" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Clear Data / Logout ───────────────────────────────── */}
        {(name || phone) && (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <IconSymbol name="arrow.right.square.fill" size={20} color="#FF3B30" />
            <Text style={styles.logoutText}>مسح البيانات</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.versionText}>مقص © 2025 — الإصدار 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#0A0A0B' },
  header: {
    paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24,
    backgroundColor: '#0A0A0B',
    borderBottomWidth: 1, borderBottomColor: 'rgba(195,216,9,0.08)',
  },
  headerTitle: { fontSize: 26, fontFamily: 'ElMessiri_700Bold', color: '#C3D809', textAlign: 'center' },

  // ── Profile Card
  profileCard: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: '#111112', padding: 20, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(195,216,9,0.15)',
    margin: 20, marginBottom: 10,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#C3D809', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontFamily: 'ElMessiri_700Bold', color: '#0A0A0B' },
  userInfo:  { flex: 1, marginRight: 14 },
  userName:  { fontSize: 18, fontFamily: 'ElMessiri_700Bold', color: '#F8F8F8', textAlign: 'right' },
  userPhone: { fontSize: 13, fontFamily: 'ElMessiri_400Regular', color: '#888', textAlign: 'right', marginTop: 3 },
  editBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#C3D809', alignItems: 'center', justifyContent: 'center',
  },

  // ── Bookings Shortcut
  bookingsShortcut: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(195,216,9,0.08)', borderRadius: 20, padding: 18,
    marginHorizontal: 20, marginVertical: 10,
    borderWidth: 1, borderColor: 'rgba(195,216,9,0.2)',
  },
  bookingsShortcutTitle: { fontSize: 17, fontFamily: 'ElMessiri_700Bold', color: '#C3D809', textAlign: 'right' },
  bookingsShortcutSub:   { fontSize: 12, fontFamily: 'ElMessiri_400Regular', color: '#888', textAlign: 'right', marginTop: 3 },
  bookingsShortcutIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#C3D809', alignItems: 'center', justifyContent: 'center',
  },

  // ── Section
  sectionTitle: {
    fontSize: 14, fontFamily: 'ElMessiri_700Bold', color: '#555',
    textAlign: 'right', marginHorizontal: 20, marginTop: 20, marginBottom: 10,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  menuCard: {
    backgroundColor: '#111112', borderRadius: 20, marginHorizontal: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16,
  },
  menuItemRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(195,216,9,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  menuText: { fontSize: 16, fontFamily: 'ElMessiri_500Medium', color: '#F8F8F8' },
  divider:  { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 16 },

  // ── Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: 'rgba(255,59,48,0.08)', paddingVertical: 15, borderRadius: 16,
    marginHorizontal: 20, marginTop: 24,
    borderWidth: 1, borderColor: 'rgba(255,59,48,0.2)',
  },
  logoutText: { fontSize: 16, fontFamily: 'ElMessiri_700Bold', color: '#FF3B30' },
  versionText: {
    fontSize: 12, fontFamily: 'ElMessiri_400Regular', color: '#444',
    textAlign: 'center', marginTop: 24,
  },

  // ── Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#111112', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingTop: 12,
    borderTopWidth: 1, borderColor: 'rgba(195,216,9,0.15)',
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: '#333', borderRadius: 2,
    alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20, fontFamily: 'ElMessiri_700Bold', color: '#F8F8F8',
    textAlign: 'right', marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13, fontFamily: 'ElMessiri_600SemiBold', color: '#888',
    textAlign: 'right', marginBottom: 6,
  },
  input: {
    backgroundColor: '#0A0A0B', borderRadius: 14, padding: 14,
    color: '#F8F8F8', fontSize: 16, fontFamily: 'ElMessiri_400Regular',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 14,
  },
  saveBtn: {
    backgroundColor: '#C3D809', borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', marginTop: 6,
  },
  saveBtnText: { fontSize: 16, fontFamily: 'ElMessiri_700Bold', color: '#0A0A0B' },
  cancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  cancelBtnText: { fontSize: 15, fontFamily: 'ElMessiri_500Medium', color: '#888' },
  aboutText: {
    fontSize: 15, fontFamily: 'ElMessiri_400Regular', color: '#AAAAAA',
    textAlign: 'right', lineHeight: 26, marginBottom: 20,
  },
});
