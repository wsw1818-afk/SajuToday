import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Pillar } from '../../types';

const { width } = Dimensions.get('window');

// 12지지별 동물 이름 (접근성용)
const ZODIAC_ANIMALS: Record<string, string> = {
  '자': '쥐',
  '축': '소',
  '인': '호랑이',
  '묘': '토끼',
  '진': '용',
  '사': '뱀',
  '오': '말',
  '미': '양',
  '신': '원숭이',
  '유': '닭',
  '술': '개',
  '해': '돼지',
};

interface TrigramProps {
  lines: ('solid' | 'broken')[];
  angle: number;
  scale?: number;
  isDark?: boolean;
}

const Trigram: React.FC<TrigramProps> = ({ lines, angle, scale = 1, isDark = false }) => {
  const radius = 90 * scale;
  const rotate = `${angle}deg`;
  const lineColor = isDark ? '#A1A1AA' : '#292524';

  return (
    <View
      style={[
        styles.trigramContainer,
        {
          transform: [{ rotate: rotate }, { translateY: -radius }],
        },
      ]}
    >
      {lines.map((type, i) => (
        <View key={i} style={[styles.trigramLineRow, { width: 24 * scale, height: 4 * scale }]}>
          {type === 'solid' ? (
            <View style={[styles.solidLine, { backgroundColor: lineColor }]} />
          ) : (
            <>
              <View style={[styles.brokenLinePart, { backgroundColor: lineColor }]} />
              <View style={styles.brokenLineGap} />
              <View style={[styles.brokenLinePart, { backgroundColor: lineColor }]} />
            </>
          )}
        </View>
      ))}
    </View>
  );
};

interface ZodiacLabelProps {
  char: string;
  angle: number;
  scale?: number;
  isDark?: boolean;
}

const ZodiacLabel: React.FC<ZodiacLabelProps> = ({ char, angle, scale = 1, isDark = false }) => {
  const radius = 70 * scale;
  const animalName = ZODIAC_ANIMALS[char] || '';

  return (
    <View
      style={[
        styles.zodiacContainer,
        {
          transform: [{ rotate: `${angle}deg` }, { translateY: -radius }],
        },
      ]}
      accessible={true}
      accessibilityLabel={`${char}시, ${animalName}띠`}
    >
      <Text
        style={[
          styles.zodiacText,
          {
            transform: [{ rotate: `-${angle}deg` }],
            fontSize: 12 * scale,
            color: isDark ? '#A1A1AA' : '#57534E',
          },
        ]}
      >
        {char}
      </Text>
    </View>
  );
};

interface SajuWheelProps {
  dayPillar?: Pillar;
  yearPillar?: Pillar;
  monthPillar?: Pillar;
  hourPillar?: Pillar | null;
  size?: number;
  isDark?: boolean;
}

const SajuWheel: React.FC<SajuWheelProps> = ({
  dayPillar,
  yearPillar,
  monthPillar,
  hourPillar,
  size = 256,
  isDark = false,
}) => {
  // 반응형 크기 계산
  const scale = size / 256;
  const wheelSize = size;
  const outerRingSize = size;
  const innerRingSize = size * 0.875; // 224/256
  const centerCoreSize = size * 0.5; // 128/256

  const trigrams: ('solid' | 'broken')[][] = [
    ['solid', 'solid', 'solid'],
    ['broken', 'solid', 'solid'],
    ['solid', 'broken', 'solid'],
    ['broken', 'broken', 'solid'],
    ['broken', 'broken', 'broken'],
    ['solid', 'broken', 'broken'],
    ['broken', 'solid', 'broken'],
    ['solid', 'solid', 'broken'],
  ];

  const zodiacs = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

  // 중앙에 표시할 글자 (사주가 있으면 일간/일지, 없으면 기본값)
  const centerChars = {
    topLeft: yearPillar?.stem || '乙',
    topRight: monthPillar?.stem || '亥',
    bottomLeft: dayPillar?.stem || '역',
    bottomRight: hourPillar?.stem || '辛',
  };

  // 다크 모드 색상
  const ringColor = isDark ? '#3F3F46' : '#E7E5E4';
  const textColor = isDark ? '#E4E4E7' : '#292524';
  const crossColor = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)';
  const centerBorderColor = isDark ? '#27272A' : '#FFFFFF';

  // 다크 모드 쿼드런트 색상
  const quadrantColors = isDark ? {
    topLeft: 'rgba(161, 98, 7, 0.3)',     // 노랑/황색 계열
    topRight: 'rgba(63, 63, 70, 0.6)',    // 회색
    bottomLeft: 'rgba(30, 64, 175, 0.3)', // 파랑
    bottomRight: 'rgba(153, 27, 27, 0.3)', // 빨강
  } : {
    topLeft: 'rgba(255, 229, 163, 0.9)',
    topRight: 'rgba(240, 240, 240, 0.95)',
    bottomLeft: 'rgba(230, 243, 255, 0.95)',
    bottomRight: 'rgba(255, 214, 214, 0.9)',
  };

  return (
    <View
      style={[styles.wheelWrapper, { height: wheelSize + 44 }]}
      accessible={true}
      accessibilityLabel="사주팔자 휠. 팔괘와 십이지를 표시합니다."
      accessibilityRole="image"
    >
      <View style={[styles.wheelContainer, { width: wheelSize, height: wheelSize }]}>
        {/* Background Rings */}
        <View style={[styles.outerRing, {
          width: outerRingSize,
          height: outerRingSize,
          borderRadius: outerRingSize / 2,
          borderColor: ringColor,
        }]} />
        <View style={[styles.innerRing, {
          width: innerRingSize,
          height: innerRingSize,
          borderRadius: innerRingSize / 2,
          borderColor: ringColor,
        }]} />

        {/* Trigrams */}
        {trigrams.map((lines, i) => (
          <Trigram key={i} lines={lines} angle={i * 45} scale={scale} isDark={isDark} />
        ))}

        {/* Zodiacs */}
        {zodiacs.map((char, i) => (
          <ZodiacLabel key={i} char={char} angle={i * 30} scale={scale} isDark={isDark} />
        ))}

        {/* Center Core */}
        <View style={[styles.centerCore, {
          width: centerCoreSize,
          height: centerCoreSize,
          borderRadius: centerCoreSize / 2,
          borderColor: centerBorderColor,
          borderWidth: 4 * scale,
        }]}>
          <View style={styles.quadrantRow}>
            <View style={[styles.quadrant, { backgroundColor: quadrantColors.topLeft }]}>
              <Text style={[styles.quadrantText, { fontSize: 20 * scale, color: textColor }]}>
                {centerChars.topLeft}
              </Text>
            </View>
            <View style={[styles.quadrant, { backgroundColor: quadrantColors.topRight }]}>
              <Text style={[styles.quadrantText, { fontSize: 20 * scale, color: textColor }]}>
                {centerChars.topRight}
              </Text>
            </View>
          </View>
          <View style={styles.quadrantRow}>
            <View style={[styles.quadrant, { backgroundColor: quadrantColors.bottomLeft }]}>
              <Text style={[styles.quadrantText, { fontSize: 20 * scale, color: textColor }]}>
                {centerChars.bottomLeft}
              </Text>
            </View>
            <View style={[styles.quadrant, { backgroundColor: quadrantColors.bottomRight }]}>
              <Text style={[styles.quadrantText, { fontSize: 20 * scale, color: textColor }]}>
                {centerChars.bottomRight}
              </Text>
            </View>
          </View>

          {/* Cross Divider */}
          <View style={[styles.crossVertical, { backgroundColor: crossColor }]} />
          <View style={[styles.crossHorizontal, { backgroundColor: crossColor }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wheelWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: width,
    marginBottom: 0,
  },
  wheelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    borderWidth: 1,
  },
  innerRing: {
    position: 'absolute',
    borderWidth: 1,
  },
  trigramContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 20,
  },
  trigramLineRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: 24,
    height: 4,
    marginBottom: 2,
  },
  solidLine: {
    width: '100%',
    height: '100%',
    backgroundColor: '#292524',
    borderRadius: 1,
  },
  brokenLinePart: {
    width: '45%',
    height: '100%',
    backgroundColor: '#292524',
    borderRadius: 1,
  },
  brokenLineGap: {
    width: '10%',
  },
  zodiacContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zodiacText: {
    fontSize: 12,
    color: '#57534E',
    fontWeight: '500',
  },
  centerCore: {
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  quadrantRow: {
    flexDirection: 'row',
    height: '50%',
  },
  quadrant: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quadrantText: {
    fontWeight: 'bold',
  },
  crossVertical: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
  },
  crossHorizontal: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
  },
});

export default SajuWheel;
