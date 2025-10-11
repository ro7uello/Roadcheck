import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { router } from 'expo-router';
import { useSession, SessionProvider } from '../../../../contexts/SessionManager';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

const roadTiles = {
  road3: require("../../../../../assets/road/road3.png"),
  road4: require("../../../../../assets/road/road4.png"),
  road16: require("../../../../../assets/road/road16.png"),
  road17: require("../../../../../assets/road/road17.png"),
  road18: require("../../../../../assets/road/road18.png"),
  road19: require("../../../../../assets/road/road19.png"),
  road59: require("../../../../../assets/road/road59.png"),
  road20: require("../../../../../assets/road/road20.png"),
  road23: require("../../../../../assets/road/road23.png"),
  road24: require("../../../../../assets/road/road24.png"),
  road49: require("../../../../../assets/road/road49.png"),
  road50: require("../../../../../assets/road/road50.png"),
  road51: require("../../../../../assets/road/road51.png"),
  road52: require("../../../../../assets/road/road52.png"),
  road57: require("../../../../../assets/road/road57.png"),
  road58: require("../../../../../assets/road/road58.png"),
  road59: require("../../../../../assets/road/road59.png"),
  road60: require("../../../../../assets/road/road60.png"),
  int1: require("../../../../../assets/road/int1.png"),
  int2: require("../../../../../assets/road/int2.png"),
  int3: require("../../../../../assets/road/int3.png"),
  int4: require("../../../../../assets/road/int4.png"),
};

const mapLayout = [
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road49", "road59", "road57", "road50", "road52"],
  ["road60", "int3", "int4", "road60", "road24"],
  ["road58", "int2", "int1", "road58", "road23"],
  ["road19", "road59", "road57", "road16", "road51"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
  ["road18", "road4", "road3", "road17", "road20"],
];

const treeSprites = {
  tree1: require("../../../../../assets/tree/Tree3_idle_s.png"),
};

const carSprites = {
  NORTH: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
};

const npcCarSprites = {
  blue: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
  red: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/NORTH/SEPARATED/Red_CIVIC_CLEAN_NORTH_001.png"),
  ],
  green: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Green/MOVE/NORTH/SEPARATED/Green_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Green/MOVE/NORTH/SEPARATED/Green_CIVIC_CLEAN_NORTH_001.png"),
  ],
  yellow: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Yellow/MOVE/NORTH/SEPARATED/Yellow_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Yellow/MOVE/NORTH/SEPARATED/Yellow_CIVIC_CLEAN_NORTH_001.png"),
  ],
};

// South facing cars
const npcCarSpritesSouth = {
  blue: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/SOUTH/SEPARATED/Blue_CIVIC_CLEAN_SOUTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/SOUTH/SEPARATED/Blue_CIVIC_CLEAN_SOUTH_001.png"),
  ],
  red: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/SOUTH/SEPARATED/Red_CIVIC_CLEAN_SOUTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Red/MOVE/SOUTH/SEPARATED/Red_CIVIC_CLEAN_SOUTH_001.png"),
  ],
  green: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Green/MOVE/SOUTH/SEPARATED/Green_CIVIC_CLEAN_SOUTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Green/MOVE/SOUTH/SEPARATED/Green_CIVIC_CLEAN_SOUTH_001.png"),
  ],
  yellow: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Yellow/MOVE/SOUTH/SEPARATED/Yellow_CIVIC_CLEAN_SOUTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Yellow/MOVE/SOUTH/SEPARATED/Yellow_CIVIC_CLEAN_SOUTH_001.png"),
  ],
};

const treePositions = [
  // Left side trees (column -1, outside the road)
  { row: 0, col: 0, type: 'tree1' },
  { row: 1, col: 0, type: 'tree1' },
  { row: 2, col: 0, type: 'tree1' },
  { row: 3, col: 0, type: 'tree1' },
  { row: 4, col: 0, type: 'tree1' },
  { row: 5, col: 0, type: 'tree1' },
  { row: 10, col: 0, type: 'tree1' },
  { row: 11, col: 0, type: 'tree1' },
  { row: 12, col: 0, type: 'tree1' },
  { row: 13, col: 0, type: 'tree1' },
  { row: 14, col: 0, type: 'tree1' },
  { row: 15, col: 0, type: 'tree1' },
  { row: 16, col: 0, type: 'tree1' },
  { row: 17, col: 0, type: 'tree1' },

  // Right side trees (column 5, outside the road)
  { row: 0, col: 3.5, type: 'tree1' },
  { row: 1, col: 3.5, type: 'tree1' },
  { row: 2, col: 3.5, type: 'tree1' },
  { row: 3, col: 3.5, type: 'tree1' },
  { row: 4, col: 3.5, type: 'tree1' },
  { row: 5, col: 3.5, type: 'tree1' },
  { row: 10, col: 3.5, type: 'tree1' },
  { row: 11, col: 3.5, type: 'tree1' },
  { row: 12, col: 3.5, type: 'tree1' },
  { row: 13, col: 3.5, type: 'tree1' },
  { row: 14, col: 3.5, type: 'tree1' },
  { row: 15, col: 3.5, type: 'tree1' },
  { row: 16, col: 3.5, type: 'tree1' },
  { row: 17, col: 3.5, type: 'tree1' },

  // Additional scattered trees for more density
  { row: 0.5, col: 4, type: 'tree1' },
  { row: 2.5, col: 4, type: 'tree1' },
  { row: 4.5, col: 4, type: 'tree1' },
  { row: 11.5, col: 4, type: 'tree1' },
  { row: 13.5, col: 4, type: 'tree1' },
  { row: 15.5, col: 4, type: 'tree1' },

  { row: 0.5, col: 3.5, type: 'tree1' },
  { row: 2.5, col: 3.5, type: 'tree1' },
  { row: 4.5, col: 3.5, type: 'tree1' },
  { row: 11.5, col: 3.5, type: 'tree1' },
  { row: 13.5, col: 4, type: 'tree1' },
  { row: 15.5, col: 3.5, type: 'tree1' },

  // More trees further out
  { row: 1, col: 4, type: 'tree1' },
  { row: 3, col: 4, type: 'tree1' },
  { row: 12, col: 4, type: 'tree1' },
  { row: 14, col: 4, type: 'tree1' },
  { row: 16, col: 4, type: 'tree1' },

  { row: 1, col: 3.5, type: 'tree1' },
  { row: 3, col: 3.5, type: 'tree1' },
  { row: 12, col: 3.5, type: 'tree1' },
  { row: 14, col: 3.5, type: 'tree1' },
  { row: 16, col: 3.5, type: 'tree1' },
];

const questions = [
  {
    question: "You are driving on an intersection near a university. The traffic light ahead is red but the traffic is congesting the intersection, stopping you in the middle of an intersection from the previous green light.",
    options: ["Stay where you are until the traffic light turns green.", "Back up to clear the intersection.", "Proceed forward to clear the intersection."],
    correct: "Proceed forward to clear the intersection.",
    wrongExplanation: {
      "Stay where you are until the traffic light turns green.": "Wrong! Staying put would likely block the intersection even more. In this situation, it is more appropriate to move forward when you have the space and it's clear to do so to clear the intersection.",
      "Back up to clear the intersection.": "Accident prone! Backing up an intersection is dangerous if you are alread in the middle of it.",
    }
  },
];

// Traffic light sprites
const trafficLightSprites = {
  normal: require("../../../../../assets/traffic light/traffic_light_green2.png"),
  yellow: require("../../../../../assets/traffic light/traffic_light_yellow2.png"),
  red: require("../../../../../assets/traffic light/traffic_light_red2.png"),
};

export default function DrivingGame() {

  const {
    updateScenarioProgress,
    moveToNextScenario,
    completeSession,
    currentScenario,
    sessionData
  } = useSession();

  const updateProgress = async (selectedOption, isCorrect) => {
    try {
      const phaseId = sessionData?.phase_id;

      let scenarioId;

      if (phaseId === 4) {
        scenarioId = 30 + currentScenario;
      } else if (phaseId === 5) {
        scenarioId = 40 + currentScenario;
      } else {
        console.error('Unknown phase ID:', phaseId);
        return;
      }

      console.log('🔍 SCENARIO DEBUG:', {
        phaseId,
        currentScenario,
        calculatedScenarioId: scenarioId,
        selectedOption,
        isCorrect
      });

      await updateScenarioProgress(scenarioId, selectedOption, isCorrect);
    } catch (error) {
      console.error('Error updating scenario progress:', error);
    }
  };

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const startOffset = -(mapHeight - height);
  const scrollY = useRef(new Animated.Value(startOffset)).current;
  const currentScroll = useRef(startOffset);

  const trafficLightRowIndex = 9.3;
  const trafficLightColIndex = 2;
  const trafficLightXOffset = -30;

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      currentScroll.current = value;
    });
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  // NPC cars configuration
  const npcCars = [
    // Column 1 - South facing cars (rows 1-5)
    { row: 1, col: .8, color: 'blue', direction: 'south' },
    { row: 2, col: .8, color: 'red', direction: 'south' },
    { row: 3, col: .8, color: 'green', direction: 'south' },
    { row: 4, col: .8, color: 'yellow', direction: 'south' },
    { row: 5, col: .8, color: 'blue', direction: 'south' },
    
    // Column 1 - South facing cars (rows 8-10)
    { row: 8, col: .8, color: 'red', direction: 'south' },
    { row: 9, col: .8, color: 'green', direction: 'south' },
    { row: 10, col: .8, color: 'yellow', direction: 'south' },
    
    // Column 2 - North facing cars (rows 1-5)
    { row: 1, col: 1.8, color: 'green', direction: 'north' },
    { row: 2, col: 1.8, color: 'yellow', direction: 'north' },
    { row: 3, col: 1.8, color: 'blue', direction: 'north' },
  ];

  // UI/game states
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null);

  // Car
  const [carFrame, setCarFrame] = useState(0);
  const [carPaused, setCarPaused] = useState(false);
  const carXAnim = useRef(new Animated.Value(width / 2 - (280 / 2))).current;

  // Traffic light
  const [trafficLightState, setTrafficLightState] = useState('normal');
  const [lightChangeTriggered, setLightChangeTriggered] = useState(false);

  function startScrollAnimation() {
    scrollY.setValue(startOffset);
    setTrafficLightState('green');
    setLightChangeTriggered(false);
    
    const stopRow = 9;
    const stopOffset = startOffset + stopRow * tileSize;

    const yellowTriggerTime = 1000;
    const redTriggerTime = 2000;

    Animated.timing(scrollY, {
      toValue: stopOffset,
      duration: 3000,
      useNativeDriver: true,
    }).start(() => {
    });

    setTimeout(() => {
      if (!lightChangeTriggered) {
        setTrafficLightState('yellow');
        setLightChangeTriggered(true);
      }
    }, yellowTriggerTime);

    setTimeout(() => {
      setTrafficLightState('red');
      setTimeout(() => {
        setShowQuestion(true);
        setTimeout(() => {
          setShowAnswers(true);
        }, 1000);
      }, 500);
    }, redTriggerTime);
  }
  
  useEffect(() => {
    startScrollAnimation();
  }, []);

  useEffect(() => {
    let iv;
    if (!carPaused) {
      iv = setInterval(() => {
        setCarFrame((p) => (p + 1) % carSprites["NORTH"].length);
      }, 200);
    }
    return () => clearInterval(iv);
  }, [carPaused]);

  // feedback anims
  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;
  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);

  const handleFeedback = (answerGiven) => {
      const currentQuestion = questions[questionIndex];
      if (answerGiven === currentQuestion.correct) {
        setIsCorrectAnswer(true);
        setAnimationType("correct");
        Animated.timing(correctAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          correctAnim.setValue(0);
          setShowNext(true);
        });
      } else {
        setIsCorrectAnswer(false);
        setAnimationType("wrong");
        Animated.timing(wrongAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          wrongAnim.setValue(0);
          setShowNext(true);
        });
      }
    };
  

  const handleAnswer = async (answer) => {
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    const currentQuestion = questions[questionIndex];
    const isCorrect = answer === currentQuestion.correct;
    await updateProgress(answer, isCorrect);

    const currentRow = Math.round(Math.abs(currentScroll.current - startOffset) / tileSize);

    if (answer === "Proceed forward to clear the intersection.") {
      const targetRow = 12;
      const rowsToMove = targetRow - currentRow;
      const nextTarget = currentScroll.current + rowsToMove * tileSize;
      
      Animated.timing(scrollY, {
        toValue: nextTarget,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        handleFeedback(answer);
      });
    } else if (answer === "Back up to clear the intersection.") {
        const targetRow = 7.5;
        const rowsToMove = targetRow - currentRow;
        const nextTarget = currentScroll.current + rowsToMove * tileSize;

        setCarPaused(true); 
        setTimeout(() => {
            setCarPaused(false); 
            Animated.timing(scrollY, {
                toValue: nextTarget,
                duration: 3000,
                useNativeDriver: true,
            }).start(() => {
                handleFeedback(answer);
            });
        });
    } else if(answer === "Stay where you are until the traffic light turns green."){
        const targetRow = 9;
        const rowsToMove = targetRow - currentRow;
        const nextTarget = currentScroll.current + rowsToMove * tileSize;
        Animated.timing(scrollY, {
          toValue: nextTarget,
          duration: 3000,
          useNativeDriver: true,
        }).start(() => {
          handleFeedback(answer);
        });
        return;
    }
  };

  const handleNext = async () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null);
    setCarFrame(0);
    carXAnim.setValue(width / 2 - (280 / 2));

    setTrafficLightState('green');

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else if (currentScenario >= 10) {
      console.log('🎯 Scenario 10 complete! Finishing session...');
      try {
            const sessionResults = await completeSession();

            console.log('📊 Session results:', sessionResults);

            if (!sessionResults) {
              Alert.alert('Error', 'Failed to complete session. Please try again.');
              return;
            }

            console.log('✅ Navigating to result-page');
            router.push({
              pathname: '/result-page',
              params: {
                ...sessionResults,
                userAttempts: JSON.stringify(sessionResults.attempts)
              }
            });
      } catch (error) {
        console.error('Error completing session:', error);
        Alert.alert('Error', `Failed to save session results: ${error.message}`);
      }
    } else {
      moveToNextScenario();
      let phaseNumber;
      const categoryId = sessionData?.category_id;
      const phaseId = sessionData?.phase_id;

      if (categoryId === 1) {
        phaseNumber = phaseId;
      } else if (categoryId === 2) {
        phaseNumber = phaseId - 3;
      } else if (categoryId === 3) {
        phaseNumber = phaseId - 6;
      }

      const nextScreen = `S${currentScenario + 1}P${phaseNumber}`;
      router.push(`/scenarios/traffic-signs/phase${phaseNumber}/${nextScreen}`);
    }
  };

  const trafficLightLeft = trafficLightColIndex * tileSize + trafficLightXOffset;
  const trafficLightTop = trafficLightRowIndex * tileSize;

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct. Clear the intersection by moving forward when there is space and it's safe even if the light is red. "
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong!";


  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      {/* Map */}
      <Animated.View
        style={{
          position: "absolute",
          width: width,
          height: mapHeight,
          left: 0,
          transform: [{ translateY: scrollY }],
          zIndex: 1,
        }}
      >
        {mapLayout.map((row, rowIndex) =>
          row.map((tile, colIndex) => (
            <Image
              key={`${rowIndex}-${colIndex}`}
              source={roadTiles[tile]}
              style={{
                position: "absolute",
                width: tileSize,
                height: tileSize,
                left: colIndex * tileSize,
                top: rowIndex * tileSize,
              }}
              resizeMode="stretch"
            />
          ))
        )}
        
        {/* Trees */}
        {treePositions.map((tree, index) => (
          <Image
            key={`tree-${index}`}
            source={treeSprites[tree.type]}
            style={{
              position: "absolute",
              width: tileSize * 0.8,
              height: tileSize * 1.2,
              left: tree.col * tileSize,
              top: tree.row * tileSize,
              zIndex: 2,
            }}
            resizeMode="contain"
          />
        ))}

        {/* NPC Cars */}
        {npcCars.map((npc, index) => {
          const sprites = npc.direction === 'south' ? npcCarSpritesSouth : npcCarSprites;
          return (
            <Image
              key={`npc-${index}`}
              source={sprites[npc.color][0]}
              style={{
                position: "absolute",
                width: tileSize * 1.8,
                height: tileSize * 1.8,
                left: npc.col * tileSize - (tileSize * 0.1),
                top: npc.row * tileSize - (tileSize * 0.25),
                zIndex: 5,
              }}
              resizeMode="contain"
            />
          );
        })}
        
        {/* Traffic Light */}
        <Image
          source={trafficLightSprites[trafficLightState]}
          style={{
            width: tileSize * 1.5,
            height: tileSize * 2,
            position: "absolute",
            top: trafficLightTop,
            left: trafficLightLeft,
            zIndex: 10,
          }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Car - fixed */}
      <Animated.Image
        source={carSprites["NORTH"][carFrame]}
        style={{
          width: 280,
          height: 350,
          position: "absolute",
          bottom: 80,
          left: carXAnim,
          zIndex: 8,
        }}
      />

      {/* Question overlay */}
      {showQuestion && (
        <View style={styles.questionOverlay}>
          <Image
            source={require("../../../../../assets/dialog/LTO.png")}
            style={styles.ltoImage}
          />
          <View style={styles.questionBox}>
            <View style={styles.questionTextContainer}>
              <Text style={styles.questionText}>
                {questions[questionIndex].question}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Answers */}
      {showAnswers && (
        <View style={styles.answersContainer}>
          {questions[questionIndex].options.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.answerButton}
              onPress={() => handleAnswer(option)}
            >
              <Text style={styles.answerText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Feedback */}
      {animationType === "correct" && (
        <View style={styles.feedbackOverlay}>
          <Image source={require("../../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        </View>
      )}

      {animationType === "wrong" && (
        <View style={styles.feedbackOverlay}>
          <Image source={require("../../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>
                {feedbackMessage}
            </Text>
          </View>
        </View>
      )}

      {/* Next button */}
      {showNext && (
        <View style={styles.nextButtonContainer}>
          <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
 questionOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: width,
    height: overlayHeight,
    backgroundColor: "rgba(8, 8, 8, 0.43)",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: 0,
    zIndex: 10,
  },
  ltoImage: {
    width: ltoWidth,
    height: ltoHeight,
    resizeMode: "contain",
    marginLeft: -width * 0.03,
    marginBottom: -height * 0.12,
  },
  questionBox: {
    flex: 1,
    bottom: height * 0.1,
    alignItems: "center",
    justifyContent: "center",
  },
  questionTextContainer: {
    padding: -height * 0.04,
    maxWidth: width * 0.7,
  },
  questionText: {
    flexWrap: "wrap",
    color: "white",
    fontSize: Math.min(width * 0.045, 20),
    fontWeight: "bold",
    textAlign: "center",
  },
  answersContainer: {
    position: "absolute",
    top: height * 0.2,
    right: sideMargin,
    width: width * 0.35,
    height: height * 0.21,
    zIndex: 11,
  },
  answerButton: {
    backgroundColor: "#333",
    padding: height * 0.015,
    borderRadius: 8,
    marginBottom: height * 0.015,
    borderWidth: 1,
    borderColor: "#555",
  },
  answerText: {
    color: "white",
    fontSize: Math.min(width * 0.04, 18),
    textAlign: "center",
  },
  feedbackOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: width,
    height: overlayHeight,
    backgroundColor: "rgba(8, 8, 8, 0.43)",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: height * 0.01,
    zIndex: 10,
  },
  feedbackBox: {
    flex: 1,
    bottom: height * 0.1,
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackText: {
    color: "white",
    fontSize: Math.min(width * 0.06, 24),
    fontWeight: "bold",
    textAlign: "center",
  },
  nextButtonContainer: {
    position: "absolute",
    top: height * 0.50,
    right: sideMargin,
    width: width * 0.2,
    alignItems: "center",
    zIndex: 11,
  },
  nextButton: {
    backgroundColor: "#007bff",
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.06,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: width * 0.15,
    alignItems: "center",
  },
  nextButtonText: {
    color: "white",
    fontSize: Math.min(width * 0.045, 20),
    fontWeight: "bold",
  },
});