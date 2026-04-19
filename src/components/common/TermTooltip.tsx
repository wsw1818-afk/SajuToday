/**
 * 사주 용어 도움말 팝업 컴포넌트
 * 어려운 사주 용어를 쉽게 설명해줍니다.
 */

import React, { useState } from 'react';
import { COLORS } from '../../utils/theme';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';

// 사주 용어 사전
const SAJU_TERMS: Record<string, { title: string; description: string; example?: string }> = {
  // 기본 개념
  '사주': {
    title: '사주(四柱)',
    description: '태어난 연, 월, 일, 시를 네 개의 기둥으로 표현한 것입니다. 각 기둥은 천간과 지지로 이루어져 있어요.',
    example: '예: 갑자년 을축월 병인일 정묘시',
  },
  '팔자': {
    title: '팔자(八字)',
    description: '사주의 네 기둥에서 나오는 8개의 글자(천간 4개 + 지지 4개)를 말합니다.',
  },
  '천간': {
    title: '천간(天干)',
    description: '하늘의 기운을 나타내는 10개의 글자입니다. 갑(甲), 을(乙), 병(丙), 정(丁), 무(戊), 기(己), 경(庚), 신(辛), 임(壬), 계(癸)가 있어요.',
  },
  '지지': {
    title: '지지(地支)',
    description: '땅의 기운을 나타내는 12개의 글자로, 12지신과 같습니다. 자(子/쥐), 축(丑/소), 인(寅/호랑이) 등이 있어요.',
  },
  '일주': {
    title: '일주(日柱)',
    description: '태어난 날의 천간과 지지 조합입니다. 사주에서 가장 중요하며, 본인의 핵심 성격과 운명을 나타냅니다.',
    example: '예: 갑자일주, 을축일주',
  },
  '일간': {
    title: '일간(日干)',
    description: '일주의 천간 부분으로, 나 자신을 대표합니다. 일간을 기준으로 다른 오행과의 관계를 봅니다.',
  },

  // 오행
  '오행': {
    title: '오행(五行)',
    description: '우주 만물을 구성하는 5가지 기본 요소입니다. 목(木/나무), 화(火/불), 토(土/흙), 금(金/쇠), 수(水/물)가 있어요.',
  },
  '목': {
    title: '목(木)',
    description: '나무의 기운입니다. 성장, 발전, 인자함을 상징하며 봄과 동쪽을 나타냅니다.',
  },
  '화': {
    title: '화(火)',
    description: '불의 기운입니다. 열정, 예의, 밝음을 상징하며 여름과 남쪽을 나타냅니다.',
  },
  '토': {
    title: '토(土)',
    description: '흙의 기운입니다. 중심, 신뢰, 안정을 상징하며 환절기와 중앙을 나타냅니다.',
  },
  '금': {
    title: '금(金)',
    description: '쇠의 기운입니다. 결단력, 의리, 강함을 상징하며 가을과 서쪽을 나타냅니다.',
  },
  '수': {
    title: '수(水)',
    description: '물의 기운입니다. 지혜, 유연함, 깊이를 상징하며 겨울과 북쪽을 나타냅니다.',
  },

  // 관계
  '상생': {
    title: '상생(相生)',
    description: '서로 도와주는 관계입니다. 목→화→토→금→수→목 순서로 다음 오행을 생(生)합니다.',
    example: '나무(목)가 불(화)을 키우는 것처럼',
  },
  '상극': {
    title: '상극(相剋)',
    description: '서로 억제하는 관계입니다. 목→토→수→화→금→목 순서로 다음 오행을 극(剋)합니다.',
    example: '물(수)이 불(화)을 끄는 것처럼',
  },

  // 십신
  '비견': {
    title: '비견(比肩)',
    description: '나와 같은 오행으로, 형제, 동료, 경쟁자를 나타냅니다. 독립심과 자존심이 강해요.',
  },
  '겁재': {
    title: '겁재(劫財)',
    description: '나와 같은 오행의 음양 반대입니다. 경쟁심, 도전정신, 때로는 재물 손실을 의미해요.',
  },
  '식신': {
    title: '식신(食神)',
    description: '내가 생하는 오행으로, 창의력, 예술성, 먹을 복을 나타냅니다.',
  },
  '상관': {
    title: '상관(傷官)',
    description: '내가 생하는 오행의 음양 반대입니다. 재능, 표현력이 뛰어나지만 반항기질도 있어요.',
  },
  '편재': {
    title: '편재(偏財)',
    description: '내가 극하는 오행입니다. 외부 재물, 투자, 사업 운을 나타내며 아버지도 상징합니다.',
  },
  '정재': {
    title: '정재(正財)',
    description: '내가 극하는 오행의 음양 반대입니다. 정당한 재물, 월급, 안정적 수입을 의미해요.',
  },
  '편관': {
    title: '편관(偏官)/칠살',
    description: '나를 극하는 오행입니다. 권력, 명예, 직장 상사를 나타내며 도전과 시련도 의미해요.',
  },
  '정관': {
    title: '정관(正官)',
    description: '나를 극하는 오행의 음양 반대입니다. 직업, 명예, 사회적 지위를 나타내며 남편을 상징하기도 합니다.',
  },
  '편인': {
    title: '편인(偏印)',
    description: '나를 생하는 오행입니다. 특수한 학문, 종교, 예술적 재능을 나타내요.',
  },
  '정인': {
    title: '정인(正印)',
    description: '나를 생하는 오행의 음양 반대입니다. 학문, 문서, 자격증 운이며 어머니를 상징합니다.',
  },

  // 지지 관계
  '합': {
    title: '합(合)',
    description: '서로 어울려 하나가 되는 좋은 관계입니다. 귀인을 만나거나 좋은 인연이 생겨요.',
  },
  '충': {
    title: '충(沖)',
    description: '서로 부딪히는 관계입니다. 변화, 이동, 분리를 의미하며 주의가 필요해요.',
  },
  '형': {
    title: '형(刑)',
    description: '서로 해치는 관계입니다. 구설, 송사, 건강 문제에 주의하세요.',
  },
  '파': {
    title: '파(破)',
    description: '깨뜨리는 관계입니다. 계획이 틀어지거나 손해가 생길 수 있어요.',
  },
  '해': {
    title: '해(害)',
    description: '해로운 관계입니다. 뒷담화, 배신, 손실에 주의하세요.',
  },

  // 기타
  '용신': {
    title: '용신(用神)',
    description: '사주에서 가장 필요한 오행입니다. 용신을 잘 활용하면 운이 좋아져요.',
  },
  '대운': {
    title: '대운(大運)',
    description: '10년 단위로 바뀌는 큰 운의 흐름입니다. 인생의 큰 방향을 좌우해요.',
  },
  '세운': {
    title: '세운(歲運)',
    description: '매년 바뀌는 운입니다. 그 해의 전반적인 운세를 나타내요.',
  },
  '월운': {
    title: '월운(月運)',
    description: '매월 바뀌는 운입니다. 한 달간의 운세 흐름을 보여줍니다.',
  },
};

interface TermTooltipProps {
  term: string;
  children?: React.ReactNode;
  style?: object;
}

export function TermTooltip({ term, children, style }: TermTooltipProps) {
  const [visible, setVisible] = useState(false);
  const termData = SAJU_TERMS[term];

  if (!termData) {
    return <Text style={style}>{children || term}</Text>;
  }

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} activeOpacity={0.7}>
        <Text style={[styles.termText, style]}>
          {children || term}
          <Text style={styles.helpIcon}> ⓘ</Text>
        </Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.tooltipContainer}>
            <View style={styles.tooltipHeader}>
              <Text style={styles.tooltipTitle}>{termData.title}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.tooltipDescription}>{termData.description}</Text>
            {termData.example && (
              <View style={styles.exampleBox}>
                <Text style={styles.exampleText}>{termData.example}</Text>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

// 용어 목록 모달
interface TermGlossaryProps {
  visible: boolean;
  onClose: () => void;
}

export function TermGlossary({ visible, onClose }: TermGlossaryProps) {
  const categories = [
    { title: '기본 개념', terms: ['사주', '팔자', '천간', '지지', '일주', '일간'] },
    { title: '오행', terms: ['오행', '목', '화', '토', '금', '수'] },
    { title: '오행 관계', terms: ['상생', '상극'] },
    { title: '십신', terms: ['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인'] },
    { title: '지지 관계', terms: ['합', '충', '형', '파', '해'] },
    { title: '운세 용어', terms: ['용신', '대운', '세운', '월운'] },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.glossaryContainer}>
        <View style={styles.glossaryHeader}>
          <Text style={styles.glossaryTitle}>📚 사주 용어 사전</Text>
          <TouchableOpacity onPress={onClose} style={styles.glossaryCloseBtn}>
            <Text style={styles.glossaryCloseText}>닫기</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.glossaryScroll} showsVerticalScrollIndicator={false}>
          {categories.map((category, idx) => (
            <View key={idx} style={styles.glossaryCategory}>
              <Text style={styles.glossaryCategoryTitle}>{category.title}</Text>
              {category.terms.map((term, termIdx) => {
                const termData = SAJU_TERMS[term];
                if (!termData) return null;
                return (
                  <View key={termIdx} style={styles.glossaryItem}>
                    <Text style={styles.glossaryItemTitle}>{termData.title}</Text>
                    <Text style={styles.glossaryItemDesc}>{termData.description}</Text>
                    {termData.example && (
                      <Text style={styles.glossaryItemExample}>{termData.example}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  termText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  helpIcon: {
    fontSize: 12,
    color: '#A78BFA',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  tooltipContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    maxWidth: 340,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5B21B6',
  },
  closeButton: {
    fontSize: 20,
    color: '#78716C',
    padding: 4,
  },
  tooltipDescription: {
    fontSize: 15,
    color: '#44403C',
    lineHeight: 24,
  },
  exampleBox: {
    marginTop: 12,
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    padding: 12,
  },
  exampleText: {
    fontSize: 13,
    color: '#7C3AED',
    fontStyle: 'italic',
  },

  // 용어 사전 모달
  glossaryContainer: {
    flex: 1,
    backgroundColor: COLORS.card,
  },
  glossaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  glossaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  glossaryCloseBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.divider,
    borderRadius: 20,
  },
  glossaryCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  glossaryScroll: {
    flex: 1,
    padding: 20,
  },
  glossaryCategory: {
    marginBottom: 24,
  },
  glossaryCategoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#E9D5FF',
  },
  glossaryItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  glossaryItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  glossaryItemDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  glossaryItemExample: {
    fontSize: 13,
    color: '#7C3AED',
    fontStyle: 'italic',
    marginTop: 8,
  },
});

export default TermTooltip;
