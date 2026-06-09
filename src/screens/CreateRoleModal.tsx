import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Modal, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { X, Check } from 'lucide-react-native';
import { COLORS, SPACING } from '../constants/Theme';
import { PERMISSION_GROUPS, ALL_PERMISSIONS, Permission, StaffRole } from '../constants/permissions';
import { createStaffRoleRequest, updateStaffRoleRequest, clearStaffRoleError } from '../store/slices/staffRoleSlice';
import { RootState } from '../store';

interface Props {
  visible: boolean;
  onClose: () => void;
  editingRole?: StaffRole | null;
  onSuccess?: (msg: string) => void;
}

const CreateRoleModal: React.FC<Props> = ({ visible, onClose, editingRole = null, onSuccess }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { roles, loading, error } = useSelector((s: RootState) => s.staffRoles);
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [selPerms, setSelPerms] = useState<Permission[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editingRole) { setRoleName(editingRole.name); setRoleDesc(editingRole.description); setSelPerms([...editingRole.permissions]); }
      else { setRoleName(''); setRoleDesc(''); setSelPerms([]); }
      dispatch(clearStaffRoleError());
    }
  }, [visible, editingRole, dispatch]);

  useEffect(() => {
    if (submitting && !loading) {
      if (error) { setSubmitting(false); }
      else { onSuccess?.(editingRole ? t('admin.staff.roleUpdated', { name: roleName }) : t('admin.staff.roleCreated', { name: roleName })); setSubmitting(false); onClose(); }
    }
  }, [submitting, loading, error]);

  const togglePerm = (p: Permission) => setSelPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  const toggleAll = () => setSelPerms(selPerms.length === ALL_PERMISSIONS.length ? [] : [...ALL_PERMISSIONS]);

  const trimmedName = roleName.trim();
  const trimmedDesc = roleDesc.trim();
  const isDuplicate = roles.some(r => 
      r.name.toLowerCase() === trimmedName.toLowerCase() && 
      (!editingRole || r.id !== editingRole.id)
  );

  let nameError = '';
  if (trimmedName.length > 0) {
      if (trimmedName.length < 3) nameError = "Role name must be at least 3 characters";
      else if (trimmedName.length > 50) nameError = "Role name cannot exceed 50 characters";
      else if (!/^[A-Za-z][A-Za-z0-9\s&-]{2,49}$/.test(trimmedName)) nameError = "Invalid format. Start with a letter. Only letters, numbers, spaces, &, - allowed.";
      else if (isDuplicate) nameError = "Role already exists";
  }

  let descError = '';
  if (trimmedDesc.length > 0) {
      if (trimmedDesc.length < 10) descError = "Description must be at least 10 characters";
      else if (trimmedDesc.length > 250) descError = "Description cannot exceed 250 characters";
  }

  const valid = trimmedName.length >= 3 && !nameError && !descError && selPerms.length > 0;

  const handleSubmit = () => {
    if (!valid) return;
    setSubmitting(true);
    if (editingRole) dispatch(updateStaffRoleRequest({ id: editingRole.id, name: trimmedName, description: trimmedDesc, permissions: selPerms }));
    else dispatch(createStaffRoleRequest({ name: trimmedName, description: trimmedDesc, permissions: selPerms }));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.container}>
          <View style={s.header}>
            <Text style={s.headerTitle}>{editingRole ? t('admin.staff.editRole', { name: editingRole.name }) : t('admin.staff.createRole')}</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}><X size={20} color={COLORS.onSurface} /></TouchableOpacity>
          </View>
          <ScrollView style={s.body} contentContainerStyle={s.bodyContent} showsVerticalScrollIndicator={false}>
            {error && <View style={s.err}><Text style={s.errTxt}>{error}</Text></View>}
            <View style={s.field}>
              <View style={s.labelRow}>
                <Text style={s.label}>{t('admin.staff.roleNameLabel')} *</Text>
                <Text style={s.charCount}>{roleName.length} / 50</Text>
              </View>
              <TextInput style={[s.input, nameError ? s.inputError : null]} value={roleName} onChangeText={setRoleName} placeholder="e.g. Content Manager" placeholderTextColor={COLORS.outline} maxLength={50} />
              {nameError ? <Text style={s.inlineErrTxt}>{nameError}</Text> : null}
            </View>
            <View style={s.field}>
              <View style={s.labelRow}>
                <Text style={s.label}>{t('admin.staff.description')}</Text>
                <Text style={s.charCount}>{roleDesc.length} / 250</Text>
              </View>
              <TextInput style={[s.input, descError ? s.inputError : null]} value={roleDesc} onChangeText={setRoleDesc} placeholder="e.g. Can manage courses and training plans" placeholderTextColor={COLORS.outline} maxLength={250} />
              {descError ? <Text style={s.inlineErrTxt}>{descError}</Text> : null}
            </View>
            <View style={s.field}>
              <View style={s.permHdr}><Text style={s.label}>{t('admin.staff.permissions')} *</Text><TouchableOpacity onPress={toggleAll}><Text style={s.selAll}>{selPerms.length === ALL_PERMISSIONS.length ? t('admin.staff.deselectAll') : t('admin.staff.selectAll')}</Text></TouchableOpacity></View>
              {Object.entries(PERMISSION_GROUPS).map(([gk, g]) => (
                <View key={gk} style={s.grpCard}>
                  <View style={s.grpHdr}><Text style={s.grpLabel}>{t(g.label, { defaultValue: gk })}</Text></View>
                  {Object.entries(g.subPermissions).map(([pk, sp]) => {
                    const p = pk as Permission; const sel = selPerms.includes(p);
                    return (<TouchableOpacity key={p} style={[s.pItem, sel && s.pItemSel]} onPress={() => togglePerm(p)} activeOpacity={0.7}>
                      <View style={[s.chk, sel && s.chkSel]}>{sel && <Check size={12} color="#fff" />}</View>
                      <View style={s.pTxt}>
                        <Text style={s.pLabel}>
                          {p === 'training_plans_assign' 
                            ? "Assign" 
                            : t(sp.label, { defaultValue: pk })}
                        </Text>
                        <Text style={s.pDesc}>
                          {p === 'training_plans_assign'
                            ? "First set the user management view condition"
                            : t(sp.description, { defaultValue: '' })}
                        </Text>
                      </View>
                    </TouchableOpacity>);
                  })}
                </View>
              ))}
              {selPerms.length === 0 && <Text style={s.valErr}>{t('admin.staff.selectAtLeastOnePermission')}</Text>}
            </View>
          </ScrollView>
          <View style={s.footer}>
            <TouchableOpacity style={[s.submitBtn, !valid && s.submitDis]} onPress={handleSubmit} disabled={!valid || loading} activeOpacity={0.8}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.submitTxt}>{editingRole ? t('admin.staff.updateRoleBtn') : t('admin.staff.createRoleBtn')}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.onSurface, flex: 1 },
  closeBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  body: { maxHeight: '100%' }, bodyContent: { padding: 20, paddingBottom: 10 },
  err: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, padding: 12, marginBottom: SPACING.md },
  errTxt: { fontSize: 13, fontWeight: '600', color: '#dc2626' },
  field: { marginBottom: SPACING.md },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.onSurface },
  charCount: { fontSize: 12, fontWeight: '500', color: COLORS.outline },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, fontWeight: '500', color: COLORS.onSurface },
  inputError: { borderColor: '#ef4444' },
  inlineErrTxt: { color: '#ef4444', fontSize: 12, marginTop: 4, fontWeight: '500', marginLeft: 4 },
  permHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  selAll: { fontSize: 12, fontWeight: '700', color: '#a855f7' },
  grpCard: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  grpHdr: { backgroundColor: '#f1f5f9', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  grpLabel: { fontSize: 13, fontWeight: '800', color: COLORS.onSurface },
  pItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  pItemSel: { backgroundColor: '#faf5ff' },
  chk: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  chkSel: { backgroundColor: '#a855f7', borderColor: '#a855f7' },
  pTxt: { flex: 1 },
  pLabel: { fontSize: 13, fontWeight: '700', color: COLORS.onSurface },
  pDesc: { fontSize: 11, color: COLORS.outline, marginTop: 2 },
  valErr: { fontSize: 12, fontWeight: '600', color: '#ef4444', marginTop: 4 },
  footer: { padding: 20, paddingBottom: 30, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  submitBtn: { backgroundColor: '#a855f7', paddingVertical: 14, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#a855f7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  submitDis: { opacity: 0.5 },
  submitTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default CreateRoleModal;
