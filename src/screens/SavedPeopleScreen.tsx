import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Plus,
  Search,
  User,
  Trash2,
  Edit3,
  Heart,
  X,
  Calendar,
  Clock,
} from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SHADOWS } from '../utils/theme';
import { SavedPerson, Gender, CalendarType } from '../types';
import { StorageService } from '../services/StorageService';
import { calculateSaju } from '../services/SajuCalculator';

// 관계 옵션
const RELATION_OPTIONS = ['연인', '배우자', '친구', '가족', '직장동료', '기타'];

export default function SavedPeopleScreen() {
  const navigation = useNavigation<any>();
  const [people, setPeople] = useState<SavedPerson[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPerson, setEditingPerson] = useState<SavedPerson | null>(null);

  // 폼 상태
  const [formName, setFormName] = useState('');
  const [formBirthDate, setFormBirthDate] = useState(new Date(1990, 0, 1));
  const [formBirthTime, setFormBirthTime] = useState<Date | null>(null);
  const [formGender, setFormGender] = useState<Gender>(null);
  const [formCalendar, setFormCalendar] = useState<CalendarType>('solar');
  const [formRelation, setFormRelation] = useState('');
  const [formMemo, setFormMemo] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // 화면 포커스시 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      loadPeople();
    }, [])
  );

  const loadPeople = async () => {
    const savedPeople = await StorageService.getSavedPeople();
    setPeople(savedPeople);
  };

  // 검색 필터링 (메모이제이션)
  const filteredPeople = useMemo(() =>
    searchQuery
      ? people.filter(
          p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.relation && p.relation.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : people,
    [people, searchQuery]
  );

  // 모달 초기화
  const resetForm = () => {
    setFormName('');
    setFormBirthDate(new Date(1990, 0, 1));
    setFormBirthTime(null);
    setFormGender(null);
    setFormCalendar('solar');
    setFormRelation('');
    setFormMemo('');
    setEditingPerson(null);
  };

  // 새로 추가
  const handleAddNew = () => {
    resetForm();
    setIsModalVisible(true);
  };

  // 수정
  const handleEdit = (person: SavedPerson) => {
    setEditingPerson(person);
    setFormName(person.name);
    setFormBirthDate(new Date(person.birthDate));
    setFormBirthTime(person.birthTime ? parseTime(person.birthTime) : null);
    setFormGender(person.gender);
    setFormCalendar(person.calendar);
    setFormRelation(person.relation || '');
    setFormMemo(person.memo || '');
    setIsModalVisible(true);
  };

  // 시간 문자열을 Date로 변환
  const parseTime = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // 저장
  const handleSave = async () => {
    if (!formName.trim()) {
      Alert.alert('알림', '이름을 입력해주세요.');
      return;
    }

    const birthDateStr = formBirthDate.toISOString().split('T')[0];
    const birthTimeStr = formBirthTime
      ? `${formBirthTime.getHours().toString().padStart(2, '0')}:${formBirthTime.getMinutes().toString().padStart(2, '0')}`
      : null;

    // 사주 계산
    const saju = calculateSaju(
      birthDateStr,
      birthTimeStr,
      formCalendar,
      false
    );

    const person: SavedPerson = {
      id: editingPerson?.id || `person_${Date.now()}`,
      name: formName.trim(),
      birthDate: birthDateStr,
      birthTime: birthTimeStr,
      gender: formGender,
      calendar: formCalendar,
      isLeapMonth: false,
      relation: formRelation || undefined,
      memo: formMemo || undefined,
      saju,
      createdAt: editingPerson?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await StorageService.savePerson(person);
    await loadPeople();
    setIsModalVisible(false);
    resetForm();
  };

  // 삭제
  const handleDelete = (person: SavedPerson) => {
    Alert.alert(
      '삭제 확인',
      `'${person.name}' 님의 정보를 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            await StorageService.deletePerson(person.id);
            await loadPeople();
          },
        },
      ]
    );
  };

  // 궁합 보기
  const handleCompatibility = (person: SavedPerson) => {
    navigation.navigate('CompatibilityInput', { selectedPerson: person });
  };

  // 날짜 포맷
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
  };

  // 성별 텍스트
  const getGenderText = (gender: Gender) => {
    if (gender === 'male') return '남';
    if (gender === 'female') return '여';
    return '-';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6B5B45" />

      {/* Header */}
      <LinearGradient colors={['#6B5B45', '#8B7355']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft color="#FFFFFF" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>저장된 사람</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
              <Plus color="#FFFFFF" size={24} />
            </TouchableOpacity>
          </View>

          {/* 검색 */}
          <View style={styles.searchContainer}>
            <Search color="#A8A29E" size={20} />
            <TextInput
              style={styles.searchInput}
              placeholder="이름 또는 관계로 검색"
              placeholderTextColor="#A8A29E"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X color="#A8A29E" size={18} />
              </TouchableOpacity>
            ) : null}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredPeople.length === 0 ? (
          <View style={styles.emptyContainer}>
            <User size={48} color="#D6D3D1" />
            <Text style={styles.emptyText}>
              {searchQuery ? '검색 결과가 없습니다' : '저장된 사람이 없습니다'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? '다른 검색어를 입력해보세요' : '+ 버튼을 눌러 추가해보세요'}
            </Text>
          </View>
        ) : (
          filteredPeople.map(person => (
            <View key={person.id} style={styles.personCard}>
              <View style={styles.personInfo}>
                <View style={styles.personAvatar}>
                  <Text style={styles.avatarText}>{person.name[0]}</Text>
                </View>
                <View style={styles.personDetails}>
                  <View style={styles.nameRow}>
                    <Text style={styles.personName}>{person.name}</Text>
                    {person.relation && (
                      <View style={styles.relationBadge}>
                        <Text style={styles.relationText}>{person.relation}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.personBirth}>
                    {formatDate(person.birthDate)} ({getGenderText(person.gender)})
                    {person.birthTime && ` ${person.birthTime}`}
                  </Text>
                  {person.memo && (
                    <Text style={styles.personMemo} numberOfLines={1}>
                      {person.memo}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.personActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.compatButton]}
                  onPress={() => handleCompatibility(person)}
                >
                  <Heart size={18} color="#E91E63" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEdit(person)}
                >
                  <Edit3 size={18} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(person)}
                >
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 추가/수정 모달 */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <SafeAreaView edges={['bottom']}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingPerson ? '정보 수정' : '새 사람 추가'}
                </Text>
                <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                  <X color="#1C1917" size={24} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {/* 이름 */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>이름 *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="이름을 입력하세요"
                    value={formName}
                    onChangeText={setFormName}
                  />
                </View>

                {/* 생년월일 */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>생년월일 *</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Calendar size={20} color="#6B5B45" />
                    <Text style={styles.dateButtonText}>
                      {formBirthDate.toLocaleDateString('ko-KR')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    value={formBirthDate}
                    mode="date"
                    display="spinner"
                    onChange={(event, date) => {
                      setShowDatePicker(false);
                      if (date) setFormBirthDate(date);
                    }}
                    maximumDate={new Date()}
                  />
                )}

                {/* 태어난 시간 */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>태어난 시간 (선택)</Text>
                  <View style={styles.timeRow}>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Clock size={20} color="#6B5B45" />
                      <Text style={styles.dateButtonText}>
                        {formBirthTime
                          ? `${formBirthTime.getHours().toString().padStart(2, '0')}:${formBirthTime.getMinutes().toString().padStart(2, '0')}`
                          : '시간 선택'}
                      </Text>
                    </TouchableOpacity>
                    {formBirthTime && (
                      <TouchableOpacity
                        style={styles.clearTimeButton}
                        onPress={() => setFormBirthTime(null)}
                      >
                        <X size={18} color="#78716C" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {showTimePicker && (
                  <DateTimePicker
                    value={formBirthTime || new Date()}
                    mode="time"
                    display="spinner"
                    onChange={(event, date) => {
                      setShowTimePicker(false);
                      if (date) setFormBirthTime(date);
                    }}
                  />
                )}

                {/* 성별 */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>성별</Text>
                  <View style={styles.genderRow}>
                    {[
                      { value: 'male' as Gender, label: '남성' },
                      { value: 'female' as Gender, label: '여성' },
                      { value: null, label: '미선택' },
                    ].map(option => (
                      <TouchableOpacity
                        key={option.label}
                        style={[
                          styles.genderButton,
                          formGender === option.value && styles.genderButtonActive,
                        ]}
                        onPress={() => setFormGender(option.value)}
                      >
                        <Text
                          style={[
                            styles.genderButtonText,
                            formGender === option.value && styles.genderButtonTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* 달력 유형 */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>달력 유형</Text>
                  <View style={styles.genderRow}>
                    {[
                      { value: 'solar' as CalendarType, label: '양력' },
                      { value: 'lunar' as CalendarType, label: '음력' },
                    ].map(option => (
                      <TouchableOpacity
                        key={option.label}
                        style={[
                          styles.genderButton,
                          formCalendar === option.value && styles.genderButtonActive,
                        ]}
                        onPress={() => setFormCalendar(option.value)}
                      >
                        <Text
                          style={[
                            styles.genderButtonText,
                            formCalendar === option.value && styles.genderButtonTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* 관계 */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>관계 (선택)</Text>
                  <View style={styles.relationRow}>
                    {RELATION_OPTIONS.map(option => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.relationChip,
                          formRelation === option && styles.relationChipActive,
                        ]}
                        onPress={() =>
                          setFormRelation(formRelation === option ? '' : option)
                        }
                      >
                        <Text
                          style={[
                            styles.relationChipText,
                            formRelation === option && styles.relationChipTextActive,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* 메모 */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>메모 (선택)</Text>
                  <TextInput
                    style={[styles.formInput, styles.memoInput]}
                    placeholder="메모를 입력하세요"
                    value={formMemo}
                    onChangeText={setFormMemo}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </ScrollView>

              {/* 저장 버튼 */}
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {editingPerson ? '수정하기' : '저장하기'}
                </Text>
              </TouchableOpacity>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  header: {
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1C1917',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 60,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#78716C',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#A8A29E',
    marginTop: 8,
  },
  personCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.md,
  },
  personInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  personAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6B5B45',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  personDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  personName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1917',
  },
  relationBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  relationText: {
    fontSize: 12,
    color: '#6B7280',
  },
  personBirth: {
    fontSize: 14,
    color: '#78716C',
    marginBottom: 2,
  },
  personMemo: {
    fontSize: 13,
    color: '#A8A29E',
    fontStyle: 'italic',
  },
  personActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compatButton: {
    backgroundColor: '#FDF2F8',
  },
  editButton: {
    backgroundColor: '#EFF6FF',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1917',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: 500,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1C1917',
  },
  memoInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    flex: 1,
  },
  dateButtonText: {
    fontSize: 15,
    color: '#1C1917',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearTimeButton: {
    padding: 8,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#6B5B45',
    borderColor: '#6B5B45',
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
  },
  relationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  relationChipActive: {
    backgroundColor: '#6B5B45',
    borderColor: '#6B5B45',
  },
  relationChipText: {
    fontSize: 13,
    color: '#6B7280',
  },
  relationChipTextActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#6B5B45',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
