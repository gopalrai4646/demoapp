import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, ActivityIndicator, Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Shield, Plus, Trash2, Pencil,
  Users as UsersIcon, CheckCircle,
} from 'lucide-react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { COLORS, SPACING } from '../constants/Theme';
import { PERMISSION_GROUPS, PERMISSION_MODULES, StaffRole } from '../constants/permissions';
import { RootState } from '../store';
import {
  fetchStaffRolesRequest,
  deleteStaffRoleRequest,
} from '../store/slices/staffRoleSlice';
import { deleteUserRequest } from '../store/slices/userSlice';
import CreateRoleModal from './CreateRoleModal';
import CreateStaffModal from './CreateStaffModal';

const AdminStaffRolesScreen = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const { roles, loading } = useSelector((s: RootState) => s.staffRoles);
  const { users } = useSelector((s: RootState) => s.users);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingRole, setEditingRole] = useState<StaffRole | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch roles on mount
  useEffect(() => { dispatch(fetchStaffRolesRequest()); }, [dispatch]);

  // Auto-hide success
  useEffect(() => {
    if (successMsg) { const t = setTimeout(() => setSuccessMsg(''), 4000); return () => clearTimeout(t); }
  }, [successMsg]);

  const staffUsers = useMemo(() => users.filter(u => u.role === 'staff'), [users]);

  const getStaffCount = useCallback((roleId: string) => staffUsers.filter(u => u.staffRoleId === roleId).length, [staffUsers]);

  const getRoleName = useCallback((roleId?: string) => {
    if (!roleId) return t('admin.staff.unassigned');
    return roles.find(r => r.id === roleId)?.name || t('admin.staff.unknownRole');
  }, [roles, t]);

  const openEditRole = (role: StaffRole) => { setEditingRole(role); setShowRoleModal(true); };
  const openCreateRole = () => { setEditingRole(null); setShowRoleModal(true); };

  const handleDeleteRole = (role: StaffRole) => {
    const count = getStaffCount(role.id);
    const msg = count > 0
      ? t('admin.staff.deleteRoleWithStaff', { name: role.name, count })
      : t('admin.staff.deleteRoleConfirm', { name: role.name });
    Alert.alert(t('common.delete'), msg, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'), style: 'destructive', onPress: () => {
          dispatch(deleteStaffRoleRequest(role.id));
          setSuccessMsg(t('admin.staff.roleDeleted', { name: role.name }));
        }
      },
    ]);
  };

  const handleDeleteStaff = (userId: string, name: string) => {
    Alert.alert(t('common.delete'), t('admin.staff.deleteStaffConfirm', { name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'), style: 'destructive', onPress: () => {
          dispatch(deleteUserRequest(userId));
          setSuccessMsg(t('admin.staff.staffDeleted', { name }));
        }
      },
    ]);
  };

  const renderRoleCard = (item: StaffRole) => (
    <View key={item.id} style={styles.roleCard}>
      <View style={styles.roleHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.roleName}>{item.name}</Text>
          <Text style={styles.roleDesc}>{item.description || t('admin.staff.noDescription')}</Text>
        </View>
        <View style={styles.roleActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => openEditRole(item)}>
            <Pencil size={14} color="#a855f7" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnDanger} onPress={() => handleDeleteRole(item)}>
            <Trash2 size={14} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.permissionsContainer}>
        {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => {
          const groupPerms = item.permissions.filter(p =>
            Object.keys(group.subPermissions).includes(p)
          );
          if (groupPerms.length === 0) return null;
          return (
            <View key={groupKey} style={styles.permissionRow}>
              <Text style={styles.permissionCategory}>
                {t(group.label, { defaultValue: groupKey.toUpperCase() })}:
              </Text>
              <View style={styles.permissionBadges}>
                {groupPerms.map(perm => (
                  <View key={perm} style={styles.permissionBadge}>
                    <Text style={styles.permissionText}>
                      {perm === 'training_plans_assign'
                        ? "Assign"
                        : t(PERMISSION_MODULES[perm]?.label, { defaultValue: perm })}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.roleFooter}>
        <View style={styles.staffCountContainer}>
          <UsersIcon size={14} color={COLORS.outline} />
          <Text style={styles.staffCountText}>{t('admin.staff.staffMemberCount', { count: getStaffCount(item.id) })}</Text>
        </View>
      </View>
    </View>
  );

  const renderStaffItem = (user: typeof staffUsers[0]) => {
    const userRole = roles.find(r => r.id === user.staffRoleId);
    return (
      <View key={user.id} style={styles.staffCard}>
        <View style={styles.staffHeaderRow}>
          <View style={styles.staffInfo}>
            <View style={styles.staffAvatarContainer}>
              {user.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.staffAvatar} />
              ) : (
                <View style={styles.staffAvatarPlaceholder}>
                  <Text style={styles.staffAvatarText}>{(user.name || user.email).charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>
            <View>
              <Text style={styles.staffName}>{user.name || 'No Name'}</Text>
              <Text style={styles.staffEmail}>{user.email}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.deleteIconButton} onPress={() => handleDeleteStaff(user.id, user.name || user.email)}>
            <Trash2 size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.staffDivider} />

        <View style={styles.staffMetaContainer}>
          <View style={styles.staffMetaItem}>
            <Text style={styles.staffMetaLabel}>{t('admin.staff.staffRole')}</Text>
            <View style={styles.staffRoleBadge}>
              <Text style={styles.staffRoleText}>{getRoleName(user.staffRoleId)}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, SPACING.md) }]}
    >
      {/* Header */}
      <View style={styles.headerWrapper}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="headerGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#b366f1" />
              <Stop offset="1" stopColor="#4f46e5" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#headerGrad)" rx={32} />
        </Svg>
        <View style={styles.headerInner}>
          <View style={styles.headerRow}>
            <Shield size={28} color="rgba(255,255,255,0.6)" strokeWidth={1.5} style={styles.shieldIcon} />
            <Text style={styles.headerTitleText}>{t('admin.staff.title')}</Text>
          </View>
          <Text style={styles.headerDescText}>{t('admin.staff.subtitle')}</Text>
        </View>
      </View>

      {/* Success Banner */}
      {successMsg !== '' && (
        <View style={styles.successBanner}>
          <CheckCircle size={16} color="#16a34a" />
          <Text style={styles.successText}>{successMsg}</Text>
        </View>
      )}

      {/* Loading */}
      {loading && roles.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#a855f7" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      )}

      {/* Role Definitions Section */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.iconCircle}><Shield size={20} color="#a855f7" /></View>
          <View>
            <Text style={styles.sectionTitle}>{t('admin.staff.roleDefinitions')}</Text>
            <Text style={styles.sectionSubtitle}>{t('admin.staff.roleDefinitionsSubtitle')}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.createButtonSmall} onPress={openCreateRole}>
          <Plus size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {!loading && roles.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}><Shield size={36} color="#c084fc" /></View>
          <Text style={styles.emptyTitle}>{t('admin.staff.noRoles')}</Text>
          <Text style={styles.emptyDesc}>{t('admin.staff.noRolesDesc')}</Text>
        </View>
      ) : (
        <View style={styles.rolesList}>
          {roles.map(role => renderRoleCard(role))}
        </View>
      )}

      {/* Active Staff Section */}
      <View style={[styles.sectionHeader, { marginTop: SPACING.xl }]}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.iconCircle}><UsersIcon size={20} color="#a855f7" /></View>
          <View>
            <Text style={styles.sectionTitle}>{t('admin.staff.activeStaff')}</Text>
            <Text style={styles.sectionSubtitle}>{t('admin.staff.activeStaffSubtitle')}</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.createButtonSmall, roles.length === 0 && { opacity: 0.5 }]} onPress={() => setShowStaffModal(true)} disabled={roles.length === 0}>
          <Plus size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {staffUsers.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}><UsersIcon size={36} color="#c084fc" /></View>
          <Text style={styles.emptyTitle}>{t('admin.staff.noStaff')}</Text>
          <Text style={styles.emptyDesc}>
            {roles.length === 0 ? t('admin.staff.createRoleFirst') : t('admin.staff.addFirstStaff')}
          </Text>
        </View>
      ) : (
        <View style={styles.staffList}>
          {staffUsers.map(member => renderStaffItem(member))}
        </View>
      )}



      {/* Modals */}
      <CreateRoleModal
        visible={showRoleModal}
        onClose={() => { setShowRoleModal(false); setEditingRole(null); }}
        editingRole={editingRole}
        onSuccess={setSuccessMsg}
      />
      <CreateStaffModal
        visible={showStaffModal}
        onClose={() => setShowStaffModal(false)}
        onSuccess={setSuccessMsg}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: 100 },
  headerWrapper: { minHeight: 180, borderRadius: 32, overflow: 'hidden', marginBottom: SPACING.xl, elevation: 8, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 24 },
  headerInner: { padding: 24, flex: 1, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  shieldIcon: { marginRight: 12 },
  headerTitleText: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerDescText: { fontSize: 16, color: 'rgba(255,255,255,0.85)', lineHeight: 22, fontWeight: '500', maxWidth: '95%' },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 14, padding: 12, marginBottom: SPACING.md },
  successText: { fontSize: 13, fontWeight: '600', color: '#16a34a', flex: 1 },
  loadingContainer: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.outline, fontWeight: '500' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.onSurface },
  sectionSubtitle: { fontSize: 12, color: COLORS.outline, fontWeight: '500' },
  createButtonSmall: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#a855f7', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: SPACING.md },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#faf5ff', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: COLORS.onSurface, marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: COLORS.outline, textAlign: 'center', paddingHorizontal: 40, lineHeight: 19 },
  rolesList: { marginBottom: SPACING.md },
  roleCard: { backgroundColor: '#fff', borderRadius: 20, padding: SPACING.md, borderWidth: 1, borderColor: '#f1f5f9', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, marginBottom: SPACING.md },
  roleHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  roleName: { fontSize: 16, fontWeight: '800', color: COLORS.onSurface },
  roleDesc: { fontSize: 12, color: COLORS.outline, fontWeight: '500', marginTop: 2 },
  roleActions: { flexDirection: 'row', gap: 4 },
  actionBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#faf5ff', justifyContent: 'center', alignItems: 'center' },
  actionBtnDanger: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center' },
  permissionsContainer: { marginVertical: SPACING.sm },
  permissionRow: { marginBottom: 6 },
  permissionCategory: { fontSize: 9, fontWeight: '800', color: COLORS.outline, marginBottom: 2 },
  permissionBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  permissionBadge: { backgroundColor: '#f3e8ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  permissionText: { fontSize: 8, fontWeight: '800', color: '#a855f7' },
  roleFooter: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: SPACING.sm, marginTop: SPACING.xs },
  staffCountContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  staffCountText: { fontSize: 11, color: COLORS.outline, fontWeight: '600' },
  createRoleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#a855f7', paddingVertical: 12, borderRadius: 16, gap: 8, marginBottom: SPACING.lg },
  createRoleButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  staffList: { marginBottom: SPACING.md },
  staffCard: { backgroundColor: '#fff', borderRadius: 20, padding: SPACING.md, borderWidth: 1, borderColor: '#f1f5f9', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, marginBottom: SPACING.md },
  staffHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  staffInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  staffAvatarContainer: { marginRight: SPACING.sm },
  staffAvatar: { width: 40, height: 40, borderRadius: 12 },
  staffAvatarPlaceholder: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primaryContainer, justifyContent: 'center', alignItems: 'center' },
  staffAvatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  staffName: { fontSize: 14, fontWeight: '800', color: COLORS.onSurface },
  staffEmail: { fontSize: 12, color: COLORS.outline },
  deleteIconButton: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center' },
  staffDivider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: SPACING.md },
  staffMetaContainer: { gap: SPACING.md },
  staffMetaItem: { gap: 6 },
  staffMetaLabel: { fontSize: 10, fontWeight: '800', color: COLORS.outline, letterSpacing: 0.5 },
  staffRoleBadge: { backgroundColor: '#f3e8ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start' },
  staffRoleText: { fontSize: 10, fontWeight: '900', color: '#a855f7' },
  createStaffButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#a855f7', paddingVertical: 12, borderRadius: 16, gap: 8 },
  createStaffButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default AdminStaffRolesScreen;
