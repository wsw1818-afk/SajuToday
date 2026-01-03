import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Pillar } from '../../types';

const { width } = Dimensions.get('window');

interface TrigramProps {
  lines: ('solid' | 'broken')[];
  angle: number;
}

const Trigram: React.FC<TrigramProps> = ({ lines, angle }) => {
  const radius = 90;
  const rotate = `${angle}deg`;

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
        <View key={i} style={styles.trigramLineRow}>
          {type === 'solid' ? (
            <View style={styles.solidLine} />
          ) : (
            <>
              <View style={styles.brokenLinePart} />
              <View style={styles.brokenLineGap} />
              <View style={styles.brokenLinePart} />
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
}

const ZodiacLabel: React.FC<ZodiacLabelProps> = ({ char, angle }) => {
  const radius = 70;

  return (
    <View
      style={[
        styles.zodiacContainer,
        {
          transform: [{ rotate: `${angle}deg` }, { translateY: -radius }],
        },
      ]}
    >
      <Text style={[styles.zodiacText, { transform: [{ rotate: `-${angle}deg` }] }]}>
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
}

const SajuWheel: React.FC<SajuWheelProps> = ({
  dayPillar,
  yearPillar,
  monthPillar,
  hourPillar,
}) => {
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

  return (
    <View style={styles.wheelWrapper}>
      <View style={styles.wheelContainer}>
        {/* Background Rings */}
        <View style={styles.outerRing} />
        <View style={styles.innerRing} />

        {/* Trigrams */}
        {trigrams.map((lines, i) => (
          <Trigram key={i} lines={lines} angle={i * 45} />
        ))}

        {/* Zodiacs */}
        {zodiacs.map((char, i) => (
          <ZodiacLabel key={i} char={char} angle={i * 30} />
        ))}

        {/* Center Core */}
        <View style={styles.centerCore}>
          <View style={styles.quadrantRow}>
            <View style={[styles.quadrant, { backgroundColor: 'rgba(255, 229, 163, 0.9)' }]}>
              <Text style={styles.quadrantText}>{centerChars.topLeft}</Text>
            </View>
            <View style={[styles.quadrant, { backgroundColor: 'rgba(240, 240, 240, 0.95)' }]}>
              <Text style={styles.quadrantText}>{centerChars.topRight}</Text>
            </View>
          </View>
          <View style={styles.quadrantRow}>
            <View style={[styles.quadrant, { backgroundColor: 'rgba(230, 243, 255, 0.95)' }]}>
              <Text style={styles.quadrantText}>{centerChars.bottomLeft}</Text>
            </View>
            <View style={[styles.quadrant, { backgroundColor: 'rgba(255, 214, 214, 0.9)' }]}>
              <Text style={styles.quadrantText}>{centerChars.bottomRight}</Text>
            </View>
          </View>

          {/* Cross Divider */}
          <View style={styles.crossVertical} />
          <View style={styles.crossHorizontal} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wheelWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
    width: width,
    marginBottom: 0,
  },
  wheelContainer: {
    width: 256,
    height: 256,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: 256,
    height: 256,
    borderRadius: 128,
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  innerRing: {
    position: 'absolute',
    width: 224,
    height: 224,
    borderRadius: 112,
    borderWidth: 1,
    borderColor: '#E7E5E4',
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
    width: 128,
    height: 128,
    borderRadius: 64,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#FFFFFF',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#292524',
  },
  crossVertical: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  crossHorizontal: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});

export default SajuWheel;
