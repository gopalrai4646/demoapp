import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Modal, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { X, Eye, EyeOff, ChevronDown } from 'lucide-react-native';
import { COLORS, SPACING } from '../constants/Theme';
import { createStaffUserRequest, clearStaffRoleError } from '../store/slices/staffRoleSlice';
import { RootState } from '../store';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

const CreateStaffModal: React.FC<Props> = ({ visible, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { roles, loading, error } = useSelector((s: RootState) => s.staffRoles);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) { setName(''); setEmail(''); setPassword(''); setRoleId(''); setShowPw(false); setShowPicker(false); dispatch(clearStaffRoleError()); }
  }, [visible, dispatch]);

  useEffect(() => {
    if (submitting && !loading) {
      if (error) { setSubmitting(false); }
      else { onSuccess?.(t('admin.staff.staffCreated', { name })); setSubmitting(false); onClose(); }
    }
  }, [submitting, loading, error]);

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || password.length < 6 || !roleId) return;
    setSubmitting(true);
    dispatch(createStaffUserRequest({ name: name.trim(), email: email.trim().toLowerCase(), password, staffRoleId: roleId }));
  };

  const valid = name.trim().length > 0 && email.trim().length > 0 && password.length >= 6 && roleId.length > 0;
  const selectedRole = roles.find(r => r.id === roleId);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.container}>
          <View style={s.header}>
            <Text style={s.headerTitle}>{t('admin.staff.createStaff')}</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}><X size={20} color={COLORS.onSurface} /></TouchableOpacity>
          </View>
          <ScrollView style={s.body} contentContainerStyle={s.bodyContent} showsVerticalScrollIndicator={false}>
            {error && <View style={s.err}><Text style={s.errTxt}>{error}</Text></View>}

            <View style={s.field}><Text style={s.label}>{t('admin.staff.staffName')} *</Text>
              <TextInput style={s.input} value={name} onChangeText={setName} placeholder="e.g. John Smith" placeholderTextColor={COLORS.outline} /></View>

            <View style={s.field}><Text style={s.label}>{t('admin.staff.emailAddress')} *</Text>
              <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="e.g. john@company.com" placeholderTextColor={COLORS.outline} keyboardType="email-address" autoCapitalize="none" /></View>

            <View style={s.field}><Text style={s.label}>{t('admin.staff.password')} *</Text>
              <View style={s.pwWrap}>
                <TextInput style={s.pwInput} value={password} onChangeText={setPassword} placeholder={t('admin.staff.passwordPlaceholder', { defaultValue: 'At least 6 characters' })} placeholderTextColor={COLORS.outline} secureTextEntry={!showPw} />
                <TouchableOpacity onPress={() => setShowPw(!showPw)} style={s.eyeBtn}>
                  {showPw ? <EyeOff size={18} color={COLORS.outline} /> : <Eye size={18} color={COLORS.outline} />}
                </TouchableOpacity>
              </View>
              {password.length > 0 && password.length < 6 && <Text style={s.valErr}>Password must be at least 6 characters</Text>}
            </View>

            <View style={s.field}><Text style={s.label}>{t('admin.staff.staffRole')} *</Text>
              <TouchableOpacity style={s.picker} onPress={() => setShowPicker(!showPicker)} activeOpacity={0.7}>
                <Text style={[s.pickerTxt, !roleId && { color: COLORS.outline }]}>
                  {selectedRole 
                    ? `${selectedRole.name} — ${t('admin.staff.permissionsCount', { count: selectedRole.permissions.length })}` 
                    : t('admin.staff.selectRole')}
                </Text>
                <ChevronDown size={16} color={COLORS.outline} />
              </TouchableOpacity>
              {showPicker && (
                <View style={s.pickerList}>
                  {roles.map(r => (
                    <TouchableOpacity key={r.id} style={[s.pickerItem, roleId === r.id && s.pickerItemSel]} onPress={() => { setRoleId(r.id); setShowPicker(false); }}>
                      <Text style={[s.pickerItemTxt, roleId === r.id && s.pickerItemTxtSel]}>{r.name}</Text>
                      <Text style={s.pickerItemSub}>{t('admin.staff.permissionsCount', { count: r.permissions.length })}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={s.infoBox}>
              <Text style={s.infoTxt}>💡 After creating the account, share the email and password with the staff member. They will log in through the regular login page.</Text>
            </View>
          </ScrollView>
          <View style={s.footer}>
            <TouchableOpacity style={[s.submitBtn, !valid && s.submitDis]} onPress={handleSubmit} disabled={!valid || loading} activeOpacity={0.8}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.submitTxt}>{t('admin.staff.createStaffBtn')}</Text>}
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
  label: { fontSize: 13, fontWeight: '700', color: COLORS.onSurface, marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, fontWeight: '500', color: COLORS.onSurface },
  pwWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14 },
  pwInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, fontWeight: '500', color: COLORS.onSurface },
  eyeBtn: { paddingHorizontal: 14 },
  picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 },
  pickerTxt: { fontSize: 14, fontWeight: '500', color: COLORS.onSurface, flex: 1 },
  pickerList: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, marginTop: 8, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  pickerItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9' },
  pickerItemSel: { backgroundColor: '#faf5ff' },
  pickerItemTxt: { fontSize: 14, fontWeight: '600', color: COLORS.onSurface },
  pickerItemTxtSel: { color: '#a855f7' },
  pickerItemSub: { fontSize: 11, color: COLORS.outline, marginTop: 2 },
  infoBox: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 14, padding: 14, marginBottom: SPACING.md },
  infoTxt: { fontSize: 13, fontWeight: '500', color: '#92400e', lineHeight: 19 },
  valErr: { fontSize: 12, fontWeight: '600', color: '#ef4444', marginTop: 6 },
  footer: { padding: 20, paddingBottom: 30, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  submitBtn: { backgroundColor: '#a855f7', paddingVertical: 14, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#a855f7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  submitDis: { opacity: 0.5 },
  submitTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default CreateStaffModal;
