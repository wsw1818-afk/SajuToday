/**
 * 가족/친구 그룹 관리 화면
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  Plus,
  Users,
  Search,
  X,
  ChevronRight,
  Trash2,
  Edit3,
  Heart,
  UserPlus,
} from 'lucide-react-native';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../utils/theme';
import {
  FamilyGroup,
  GroupMember,
  getGroups,
  getMembers,
  createGroup,
  deleteGroup,
  addMember,
  deleteMember,
  getMembersByGroup,
  RELATION_OPTIONS,
  GROUP_ICONS,
  GROUP_COLORS,
} from '../services/FamilyGroup';
import DateTimePicker from '@react-native-community/datetimepicker';

type ModalType = 'none' | 'addGroup' | 'addMember' | 'viewGroup';

export default function FamilyGroupScreen() {
  const navigation = useNavigation<any>();
  const [groups, setGroups] = useState<FamilyGroup[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [modalType, setModalType] = useState<ModalType>('none');
  const [selectedGroup, setSelectedGroup] = useState<FamilyGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);

  // New group form
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState('👨‍👩‍👧‍👦');
  const [newGroupColor, setNewGroupColor] = useState(COLORS.error);

  // New member form
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberBirthDate, setNewMemberBirthDate] = useState(new Date());
  const [newMemberBirthTime, setNewMemberBirthTime] = useState('');
  const [newMemberRelation, setNewMemberRelation] = useState('');
  const [newMemberGender, setNewMemberGender] = useState<'male' | 'female'>('male');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadData = async () => {
    try {
      const [groupList, memberList] = await Promise.all([
        getGroups(),
        getMembers(),
      ]);
      setGroups(groupList);
      setMembers(memberList);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert('알림', '그룹 이름을 입력해주세요.');
      return;
    }

    try {
      await createGroup(newGroupName, newGroupIcon, newGroupColor);
      setModalType('none');
      resetGroupForm();
      loadData();
      Alert.alert('완료', '그룹이 생성되었습니다.');
    } catch (error) {
      Alert.alert('오류', '그룹 생성에 실패했습니다.');
    }
  };

  const handleDeleteGroup = (group: FamilyGroup) => {
    Alert.alert(
      '그룹 삭제',
      `'${group.name}' 그룹을 삭제하시겠습니까?\n멤버도 함께 삭제됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            await deleteGroup(group.id);
            loadData();
          },
        },
      ]
    );
  };

  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      Alert.alert('알림', '이름을 입력해주세요.');
      return;
    }
    if (!newMemberRelation) {
      Alert.alert('알림', '관계를 선택해주세요.');
      return;
    }
    if (!selectedGroup) return;

    try {
      await addMember({
        name: newMemberName,
        birthDate: newMemberBirthDate,
        birthTime: newMemberBirthTime || undefined,
        gender: newMemberGender,
        relation: newMemberRelation,
        groupId: selectedGroup.id,
      });
      resetMemberForm();
      loadData();
      // 그룹 상세 화면 갱신
      const updatedMembers = await getMembersByGroup(selectedGroup.id);
      setGroupMembers(updatedMembers);
      Alert.alert('완료', '멤버가 추가되었습니다.');
    } catch (error) {
      Alert.alert('오류', '멤버 추가에 실패했습니다.');
    }
  };

  const handleDeleteMember = (member: GroupMember) => {
    Alert.alert(
      '멤버 삭제',
      `'${member.name}'님을 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            await deleteMember(member.id);
            loadData();
            if (selectedGroup) {
              const updatedMembers = await getMembersByGroup(selectedGroup.id);
              setGroupMembers(updatedMembers);
            }
          },
        },
      ]
    );
  };

  const openGroupDetail = async (group: FamilyGroup) => {
    setSelectedGroup(group);
    const members = await getMembersByGroup(group.id);
    setGroupMembers(members);
    setModalType('viewGroup');
  };

  const resetGroupForm = () => {
    setNewGroupName('');
    setNewGroupIcon('👨‍👩‍👧‍👦');
    setNewGroupColor(COLORS.error);
  };

  const resetMemberForm = () => {
    setNewMemberName('');
    setNewMemberBirthDate(new Date());
    setNewMemberBirthTime('');
    setNewMemberRelation('');
    setNewMemberGender('male');
  };

  const getRelationOptions = () => {
    if (!selectedGroup) return RELATION_OPTIONS['기타'];
    const groupName = selectedGroup.name;
    return RELATION_OPTIONS[groupName as keyof typeof RELATION_OPTIONS] || RELATION_OPTIONS['기타'];
  };

  const filteredMembers = members.filter(
    m =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.relation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderGroupCard = (group: FamilyGroup) => (
    <TouchableOpacity
      key={group.id}
      style={[styles.groupCard, { borderLeftColor: group.color }]}
      onPress={() => openGroupDetail(group)}
    >
      <View style={styles.groupIconContainer}>
        <Text style={styles.groupIcon}>{group.icon}</Text>
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.groupMemberCount}>
          {group.memberCount}명의 멤버
        </Text>
      </View>
      <ChevronRight size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  const renderMemberCard = (member: GroupMember) => {
    const group = groups.find(g => g.id === member.groupId);
    return (
      <View key={member.id} style={styles.memberCard}>
        <View style={[styles.memberAvatar, { backgroundColor: group?.color || COLORS.primary }]}>
          <Text style={styles.memberAvatarText}>
            {member.name.charAt(0)}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.name}</Text>
          <Text style={styles.memberRelation}>
            {group?.name} · {member.relation}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.compatibilityButton}
          onPress={() => {
            navigation.navigate('Compatibility', { member });
          }}
        >
          <Heart size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  // 그룹 추가 모달
  const renderAddGroupModal = () => (
    <Modal
      visible={modalType === 'addGroup'}
      animationType="slide"
      transparent
      onRequestClose={() => setModalType('none')}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>새 그룹 만들기</Text>
            <TouchableOpacity onPress={() => setModalType('none')}>
              <X size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            <Text style={styles.inputLabel}>그룹 이름</Text>
            <TextInput
              style={styles.input}
              placeholder="예: 가족, 동호회"
              placeholderTextColor={COLORS.textSecondary}
              value={newGroupName}
              onChangeText={setNewGroupName}
            />

            <Text style={styles.inputLabel}>아이콘 선택</Text>
            <View style={styles.iconGrid}>
              {GROUP_ICONS.map(icon => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    newGroupIcon === icon && styles.iconOptionSelected,
                  ]}
                  onPress={() => setNewGroupIcon(icon)}
                >
                  <Text style={styles.iconText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>색상 선택</Text>
            <View style={styles.colorGrid}>
              {GROUP_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    newGroupColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setNewGroupColor(color)}
                />
              ))}
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleCreateGroup}
            >
              <Text style={styles.saveButtonText}>그룹 만들기</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // 그룹 상세 모달
  const renderViewGroupModal = () => (
    <Modal
      visible={modalType === 'viewGroup'}
      animationType="slide"
      transparent
      onRequestClose={() => setModalType('none')}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {selectedGroup && (
            <>
              <View style={styles.modalHeader}>
                <View style={styles.groupDetailHeader}>
                  <Text style={styles.groupDetailIcon}>{selectedGroup.icon}</Text>
                  <Text style={styles.modalTitle}>{selectedGroup.name}</Text>
                </View>
                <TouchableOpacity onPress={() => setModalType('none')}>
                  <X size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <View style={styles.groupActions}>
                  <TouchableOpacity
                    style={styles.addMemberButton}
                    onPress={() => setModalType('addMember')}
                  >
                    <UserPlus size={18} color="white" />
                    <Text style={styles.addMemberText}>멤버 추가</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteGroupButton}
                    onPress={() => {
                      setModalType('none');
                      handleDeleteGroup(selectedGroup);
                    }}
                  >
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                {groupMembers.length === 0 ? (
                  <View style={styles.emptyMembers}>
                    <Users size={48} color={COLORS.textSecondary} />
                    <Text style={styles.emptyText}>아직 멤버가 없습니다</Text>
                    <Text style={styles.emptyHint}>멤버를 추가해보세요</Text>
                  </View>
                ) : (
                  groupMembers.map(member => (
                    <View key={member.id} style={styles.groupMemberCard}>
                      <View style={[styles.memberAvatar, { backgroundColor: selectedGroup.color }]}>
                        <Text style={styles.memberAvatarText}>
                          {member.name.charAt(0)}
                        </Text>
                      </View>
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        <Text style={styles.memberRelation}>{member.relation}</Text>
                        <Text style={styles.memberBirth}>
                          {new Date(member.birthDate).toLocaleDateString('ko-KR')}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteMemberButton}
                        onPress={() => handleDeleteMember(member)}
                      >
                        <Trash2 size={16} color={COLORS.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  // 멤버 추가 모달
  const renderAddMemberModal = () => (
    <Modal
      visible={modalType === 'addMember'}
      animationType="slide"
      transparent
      onRequestClose={() => setModalType('viewGroup')}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>멤버 추가</Text>
            <TouchableOpacity onPress={() => setModalType('viewGroup')}>
              <X size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            <Text style={styles.inputLabel}>이름</Text>
            <TextInput
              style={styles.input}
              placeholder="이름을 입력하세요"
              placeholderTextColor={COLORS.textSecondary}
              value={newMemberName}
              onChangeText={setNewMemberName}
            />

            <Text style={styles.inputLabel}>성별</Text>
            <View style={styles.genderSelector}>
              <TouchableOpacity
                style={[
                  styles.genderOption,
                  newMemberGender === 'male' && styles.genderOptionSelected,
                ]}
                onPress={() => setNewMemberGender('male')}
              >
                <Text style={[
                  styles.genderOptionText,
                  newMemberGender === 'male' && styles.genderOptionTextSelected,
                ]}>남성</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderOption,
                  newMemberGender === 'female' && styles.genderOptionSelected,
                ]}
                onPress={() => setNewMemberGender('female')}
              >
                <Text style={[
                  styles.genderOptionText,
                  newMemberGender === 'female' && styles.genderOptionTextSelected,
                ]}>여성</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>생년월일</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {newMemberBirthDate.toLocaleDateString('ko-KR')}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={newMemberBirthDate}
                mode="date"
                display="spinner"
                onChange={(_, date) => {
                  setShowDatePicker(false);
                  if (date) setNewMemberBirthDate(date);
                }}
              />
            )}

            <Text style={styles.inputLabel}>태어난 시간 (선택)</Text>
            <TextInput
              style={styles.input}
              placeholder="예: 오전 6시, 14:30"
              placeholderTextColor={COLORS.textSecondary}
              value={newMemberBirthTime}
              onChangeText={setNewMemberBirthTime}
            />

            <Text style={styles.inputLabel}>관계</Text>
            <View style={styles.relationGrid}>
              {getRelationOptions().map(relation => (
                <TouchableOpacity
                  key={relation}
                  style={[
                    styles.relationOption,
                    newMemberRelation === relation && styles.relationOptionSelected,
                  ]}
                  onPress={() => setNewMemberRelation(relation)}
                >
                  <Text style={[
                    styles.relationOptionText,
                    newMemberRelation === relation && styles.relationOptionTextSelected,
                  ]}>
                    {relation}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddMember}
            >
              <Text style={styles.saveButtonText}>멤버 추가</Text>
            </TouchableOpacity>

            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>가족/친구 관리</Text>
        <TouchableOpacity onPress={() => setModalType('addGroup')}>
          <Plus size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* 검색 바 */}
      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="이름 또는 관계로 검색..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 그룹 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>그룹</Text>
          {groups.map(renderGroupCard)}
        </View>

        {/* 전체 멤버 섹션 */}
        {filteredMembers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              전체 멤버 ({filteredMembers.length}명)
            </Text>
            {filteredMembers.map(renderMemberCard)}
          </View>
        )}

        {members.length === 0 && (
          <View style={styles.emptyContainer}>
            <Users size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>등록된 멤버가 없습니다</Text>
            <Text style={styles.emptyHint}>
              그룹을 선택하고 멤버를 추가해보세요
            </Text>
          </View>
        )}

        <View style={{ height: 50 }} />
      </ScrollView>

      {renderAddGroupModal()}
      {renderViewGroupModal()}
      {renderAddMemberModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
  },
  groupIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  groupIcon: {
    fontSize: 24,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  groupMemberCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  memberAvatarText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: 'white',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  memberRelation: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  memberBirth: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  compatibilityButton: {
    padding: SPACING.sm,
    backgroundColor: COLORS.primary + '20',
    borderRadius: BORDER_RADIUS.full,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptyHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalScroll: {
    padding: SPACING.md,
  },
  inputLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    borderColor: COLORS.primary,
  },
  iconText: {
    fontSize: 24,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: COLORS.text,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: 'white',
  },
  groupDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  groupDetailIcon: {
    fontSize: 24,
  },
  groupActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  addMemberButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  addMemberText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: 'white',
  },
  deleteGroupButton: {
    padding: SPACING.sm,
    backgroundColor: '#FEE2E2',
    borderRadius: BORDER_RADIUS.md,
  },
  groupMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  deleteMemberButton: {
    padding: SPACING.sm,
  },
  emptyMembers: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  genderSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  genderOption: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  genderOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genderOptionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  genderOptionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  dateButton: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  relationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  relationOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  relationOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  relationOptionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  relationOptionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
});
