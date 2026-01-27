/**
 * 가족/친구 그룹 관리 서비스
 * 그룹별 프로필 관리 및 궁합 분석
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const GROUP_STORAGE_KEY = '@saju_groups';
const MEMBER_STORAGE_KEY = '@saju_members';

export interface GroupMember {
  id: string;
  name: string;
  birthDate: Date;
  birthTime?: string;
  gender?: 'male' | 'female';
  relation: string;      // 관계 (예: 아빠, 엄마, 형, 친구 등)
  groupId: string;
  note?: string;
  createdAt: string;
}

export interface FamilyGroup {
  id: string;
  name: string;
  icon: string;
  color: string;
  memberCount: number;
  createdAt: string;
}

// 기본 그룹 템플릿
export const DEFAULT_GROUPS: Omit<FamilyGroup, 'id' | 'memberCount' | 'createdAt'>[] = [
  { name: '가족', icon: '👨‍👩‍👧‍👦', color: '#EF4444' },
  { name: '친구', icon: '👫', color: '#3B82F6' },
  { name: '직장', icon: '💼', color: '#8B5CF6' },
  { name: '연인', icon: '💕', color: '#EC4899' },
];

// 관계 옵션
export const RELATION_OPTIONS = {
  가족: ['아빠', '엄마', '형', '오빠', '누나', '언니', '동생', '남동생', '여동생', '할아버지', '할머니', '삼촌', '이모', '고모', '사촌'],
  친구: ['절친', '친구', '선배', '후배', '동기'],
  직장: ['상사', '동료', '부하', '거래처'],
  연인: ['남자친구', '여자친구', '배우자', '약혼자'],
  기타: ['지인', '기타'],
};

// 그룹 생성
export async function createGroup(
  name: string,
  icon: string,
  color: string
): Promise<FamilyGroup> {
  const groups = await getGroups();
  const newGroup: FamilyGroup = {
    id: Date.now().toString(),
    name,
    icon,
    color,
    memberCount: 0,
    createdAt: new Date().toISOString(),
  };

  groups.push(newGroup);
  await AsyncStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(groups));
  return newGroup;
}

// 모든 그룹 가져오기
export async function getGroups(): Promise<FamilyGroup[]> {
  try {
    const data = await AsyncStorage.getItem(GROUP_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    // 기본 그룹 초기화
    const defaultGroups = DEFAULT_GROUPS.map((g, i) => ({
      ...g,
      id: `default_${i}`,
      memberCount: 0,
      createdAt: new Date().toISOString(),
    }));
    await AsyncStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(defaultGroups));
    return defaultGroups;
  } catch {
    return [];
  }
}

// 그룹 업데이트
export async function updateGroup(
  id: string,
  updates: Partial<Omit<FamilyGroup, 'id' | 'createdAt'>>
): Promise<void> {
  const groups = await getGroups();
  const index = groups.findIndex(g => g.id === id);
  if (index !== -1) {
    groups[index] = { ...groups[index], ...updates };
    await AsyncStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(groups));
  }
}

// 그룹 삭제
export async function deleteGroup(id: string): Promise<void> {
  const groups = await getGroups();
  const filtered = groups.filter(g => g.id !== id);
  await AsyncStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(filtered));

  // 해당 그룹의 멤버들도 삭제
  const members = await getMembers();
  const filteredMembers = members.filter(m => m.groupId !== id);
  await AsyncStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(filteredMembers));
}

// 멤버 추가
export async function addMember(
  member: Omit<GroupMember, 'id' | 'createdAt'>
): Promise<GroupMember> {
  const members = await getMembers();
  const newMember: GroupMember = {
    ...member,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };

  members.push(newMember);
  await AsyncStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(members));

  // 그룹의 멤버 수 업데이트
  await updateGroupMemberCount(member.groupId);

  return newMember;
}

// 모든 멤버 가져오기
export async function getMembers(): Promise<GroupMember[]> {
  try {
    const data = await AsyncStorage.getItem(MEMBER_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// 특정 그룹의 멤버 가져오기
export async function getMembersByGroup(groupId: string): Promise<GroupMember[]> {
  const members = await getMembers();
  return members.filter(m => m.groupId === groupId);
}

// 멤버 업데이트
export async function updateMember(
  id: string,
  updates: Partial<Omit<GroupMember, 'id' | 'createdAt'>>
): Promise<void> {
  const members = await getMembers();
  const index = members.findIndex(m => m.id === id);
  if (index !== -1) {
    const oldGroupId = members[index].groupId;
    members[index] = { ...members[index], ...updates };
    await AsyncStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(members));

    // 그룹이 변경되었다면 두 그룹의 멤버 수 업데이트
    if (updates.groupId && updates.groupId !== oldGroupId) {
      await updateGroupMemberCount(oldGroupId);
      await updateGroupMemberCount(updates.groupId);
    }
  }
}

// 멤버 삭제
export async function deleteMember(id: string): Promise<void> {
  const members = await getMembers();
  const member = members.find(m => m.id === id);
  if (member) {
    const filtered = members.filter(m => m.id !== id);
    await AsyncStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(filtered));
    await updateGroupMemberCount(member.groupId);
  }
}

// 그룹 멤버 수 업데이트
async function updateGroupMemberCount(groupId: string): Promise<void> {
  const groups = await getGroups();
  const members = await getMembers();
  const count = members.filter(m => m.groupId === groupId).length;

  const index = groups.findIndex(g => g.id === groupId);
  if (index !== -1) {
    groups[index].memberCount = count;
    await AsyncStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(groups));
  }
}

// 멤버 검색
export async function searchMembers(query: string): Promise<GroupMember[]> {
  const members = await getMembers();
  const lowercaseQuery = query.toLowerCase();
  return members.filter(
    m =>
      m.name.toLowerCase().includes(lowercaseQuery) ||
      m.relation.toLowerCase().includes(lowercaseQuery)
  );
}

// 그룹별 통계
export interface GroupStats {
  totalMembers: number;
  groupBreakdown: { group: FamilyGroup; count: number }[];
  recentMembers: GroupMember[];
}

export async function getGroupStats(): Promise<GroupStats> {
  const groups = await getGroups();
  const members = await getMembers();

  const groupBreakdown = groups.map(group => ({
    group,
    count: members.filter(m => m.groupId === group.id).length,
  }));

  const recentMembers = [...members]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return {
    totalMembers: members.length,
    groupBreakdown,
    recentMembers,
  };
}

// 아이콘 옵션
export const GROUP_ICONS = [
  '👨‍👩‍👧‍👦', '👫', '💼', '💕', '🏠', '🎓', '⛪', '🏢',
  '🎭', '🎪', '🎯', '🎮', '📚', '🎵', '⚽', '🏃',
];

// 색상 옵션
export const GROUP_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
];
