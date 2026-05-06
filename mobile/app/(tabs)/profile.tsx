import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Image } from 'expo-image';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>حسابي</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image 
            source="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1287&auto=format&fit=crop" 
            style={styles.avatar} 
            contentFit="cover"
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>أحمد عبدالله</Text>
            <Text style={styles.userPhone}>+962 79 123 4567</Text>
          </View>
          <TouchableOpacity style={styles.editButton} activeOpacity={0.8}>
            <IconSymbol name="pencil" size={20} color="#0A0A0B" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>الإعدادات</Text>

        {/* Settings List */}
        <View style={styles.menuContainer}>
          
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.8}>
            <IconSymbol name="chevron.left" size={20} color="#555555" />
            <View style={styles.menuItemRight}>
              <Text style={styles.menuText}>الإشعارات</Text>
              <View style={styles.iconContainer}>
                <IconSymbol name="bell.fill" size={18} color="#C3D809" />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.8}>
            <IconSymbol name="chevron.left" size={20} color="#555555" />
            <View style={styles.menuItemRight}>
              <Text style={styles.menuText}>اللغة (عربي)</Text>
              <View style={styles.iconContainer}>
                <IconSymbol name="globe" size={18} color="#C3D809" />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.8}>
            <IconSymbol name="chevron.left" size={20} color="#555555" />
            <View style={styles.menuItemRight}>
              <Text style={styles.menuText}>طرق الدفع</Text>
              <View style={styles.iconContainer}>
                <IconSymbol name="creditcard.fill" size={18} color="#C3D809" />
              </View>
            </View>
          </TouchableOpacity>

        </View>

        <Text style={styles.sectionTitle}>الدعم والمساعدة</Text>

        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.8}>
            <IconSymbol name="chevron.left" size={20} color="#555555" />
            <View style={styles.menuItemRight}>
              <Text style={styles.menuText}>الشروط والأحكام</Text>
              <View style={styles.iconContainer}>
                <IconSymbol name="doc.text.fill" size={18} color="#C3D809" />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.8}>
            <IconSymbol name="chevron.left" size={20} color="#555555" />
            <View style={styles.menuItemRight}>
              <Text style={styles.menuText}>تواصل معنا</Text>
              <View style={styles.iconContainer}>
                <IconSymbol name="phone.fill" size={18} color="#C3D809" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8}>
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
          <IconSymbol name="arrow.right.square.fill" size={20} color="#FF3B30" />
        </TouchableOpacity>

        <Text style={styles.versionText}>الإصدار 1.0.0</Text>

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
  profileCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#111112',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(195, 216, 9, 0.2)',
    marginBottom: 32,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#C3D809',
  },
  userInfo: {
    flex: 1,
    marginRight: 16,
  },
  userName: {
    fontSize: 20,
    fontFamily: 'ElMessiri_700Bold',
    color: '#F8F8F8',
    textAlign: 'right',
  },
  userPhone: {
    fontSize: 14,
    fontFamily: 'ElMessiri_400Regular',
    color: '#AAAAAA',
    textAlign: 'right',
    marginTop: 4,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#C3D809',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'ElMessiri_600SemiBold',
    color: '#AAAAAA',
    marginBottom: 12,
    textAlign: 'right',
  },
  menuContainer: {
    backgroundColor: '#111112',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 24,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(195, 216, 9, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    fontSize: 16,
    fontFamily: 'ElMessiri_500Medium',
    color: '#F8F8F8',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'ElMessiri_700Bold',
    color: '#FF3B30',
  },
  versionText: {
    fontSize: 12,
    fontFamily: 'ElMessiri_400Regular',
    color: '#555555',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
});
