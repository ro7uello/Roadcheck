// S7P3.jsx
import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Image,
  Animated,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Text,
  StyleSheet,
  Easing,
  Alert,
} from "react-native";
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../../../../config/api';
import { useSession } from '../../../../contexts/SessionManager';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const playerCarWidth = Math.min(width * 0.25, 280);
const playerCarHeight = playerCarWidth * (350/280);
const npcCarWidth = playerCarWidth;
const npcCarHeight = playerCarHeight;
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.25, 200);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

// Road tiles
const roadTiles = {
  road8: require("../../../../../assets/road/road8.png"),
  road3: require("../../../../../assets/road/road3.png"),
  road4: require("../../../../../assets/road/road4.png"),
  road17: require("../../../../../assets/road/road17.png"),
  road62: require("../../../../../assets/road/road62.png"),
  road70: require("../../../../../assets/road/road70.png"),
  road73: require("../../../../../assets/road/road73.png"),
  road2: require("../../../../../assets/road/road2.png"),
  road95: require("../../../../../assets/road/road95.png"),
};

// Map layout
const mapLayout = [
  ["road62", "road4", "road2", "road3"],
  ["road62", "road4", "road2", "road3"],
  ["road62", "road4", "road2", "road3"],
  ["road62", "road4", "road2", "road3"],
  ["road62", "road4", "road2", "road3"],
  ["road62", "road4", "road2", "road3"],
  ["road62", "road4", "road2", "road3"],
  ["road62", "road4", "road2", "road3"],
  ["road62", "road4", "road2", "road3"],
  ["road62", "road4", "road2", "road3"],
  ["road62", "road4", "road2", "road3"],
  ["road62", "road4", "road2", "road3"],
  ["road62", "road4", "road2", "road3"],
  ["road62", "road4", "road2", "road3"],
  ["road62", "road4", "road2", "road3"],
  ["road62", "road4", "road2", "road3"],
  ["road62", "road4", "road2", "road3"],
  ["road62", "road4", "road2", "road3"],
  ["road62", "road4", "road2", "road3"],
  ["road62", "road4", "road2", "road3"],
  ["road62", "road4", "road2", "road3"],
  ["road62", "road4", "road2", "road3"],
  ["road62", "road4", "road2", "road3"],
  ["road62", "road4", "road2", "road3"],
  ["road62", "road4", "road2", "road3"],
  ["road62", "road4", "road95", "road3"],
];

// Player car sprites
const playerCarSprites = {
  NORTH: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTH/SEPARATED/Blue_CIVIC_CLEAN_NORTH_001.png"),
  ],
  NORTHWEST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHWEST/SEPARATED/Blue_CIVIC_CLEAN_NORTHWEST_001.png"),
  ],
  WEST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/WEST/SEPARATED/Blue_CIVIC_CLEAN_WEST_001.png"),
  ],
  NORTHEAST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/NORTHEAST/SEPARATED/Blue_CIVIC_CLEAN_NORTHEAST_001.png"),
  ],
  EAST: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_000.png"),
    require("../../../../../assets/car/CIVIC TOPDOWN/Blue/MOVE/EAST/SEPARATED/Blue_CIVIC_CLEAN_EAST_001.png"),
  ],
};

// Traffic car sprites
const trafficCarSprites = {
  BROWN_NORTH: [
    require("../../../../../assets/car/CIVIC TOPDOWN/Brown/MOVE/NORTH/SEPARATED/Brown_CIVIC_CLEAN_NORTH_000.png"),
  ],
  WHITE_NORTH: [
    require("../../../../../assets/car/CIVIC TOPDOWN/White/MOVE/NORTH/SEPARATED/White_CIVIC_CLEAN_NORTH_000.png"),
  ],
};

// Fallback question for speed limit scenario
const fallbackQuestions = [
  {
    question: "You're driving on Ortigas Avenue and see a large \"60 KPH\" speed limit marking painted on the pavement. Your speedometer shows you're going 70 KPH, which feels normal for traffic flow.",
    options: [
      "Continue at 70 KPH since you're following traffic flow", 
      "Reduce speed to 60 KPH as indicated by the pavement marking", 
      "Speed up to 80 KPH since there are no speed cameras visible"
    ],
    correct: "Reduce speed to 60 KPH as indicated by the pavement marking",
    wrongExplanation: {
      "Continue at 70 KPH since you're following traffic flow": "Wrong! Following traffic flow doesn't override posted speed limits; other drivers may also be speeding illegally.",
      "Speed up to 80 KPH since there are no speed cameras visible": "Wrong! Exceeding speed limits is illegal whether or not enforcement cameras are visible."
    }
  },
];

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
      const scenarioId = 20 + currentScenario;
      await updateScenarioProgress(scenarioId, selectedOption, isCorrect);
    } catch (error) {
      console.error('Error updating scenario progress:', error);
    }
  };

  const [questions, setQuestions] = useState(fallbackQuestions);
  const [error, setError] = useState(null);

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const [isPlayerCarVisible, setIsPlayerCarVisible] = useState(true);
  const [areNPCCarsVisible, setAreNPCCarsVisible] = useState(true);


  // --- NPC Car Animations (FIXED) ---
  const npcCars = useRef([
    {
      id: 'npc1',
      sprite: 'BROWN_NORTH',
      lane: 1, // Left lane
      yAnim: new Animated.Value(0), // Start at 0 for translateY
      frame: 0,
    },
    {
      id: 'npc2',
      sprite: 'WHITE_NORTH',
      lane: 3, // Right lane
      yAnim: new Animated.Value(-100), // Offset for variety
      frame: 0,
    },
  ]).current;

  const scrollY = useRef(new Animated.Value(0)).current;
  const currentScroll = useRef(0);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      currentScroll.current = value;
    });
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null);
  const [animationType, setAnimationType] = useState(null);
  const [showNext, setShowNext] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [playerCarDirection, setPlayerCarDirection] = useState("NORTH");
  const [playerCarFrame, setPlayerCarFrame] = useState(0);

  const playerCarLane = 2;
  const playerCarInitialX = playerCarLane * tileSize + (tileSize / 2 - playerCarWidth / 2);
  const playerCarXAnim = useRef(new Animated.Value(playerCarInitialX)).current;

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;

  // Fetch scenario data for S7P3 (scenario_id = 73)
  useEffect(() => {
    const fetchScenarioData = async () => {
      try {
        console.log('S7P3: Fetching scenario data...');
        console.log('S7P3: API_URL value:', API_URL);
        
        const token = await AsyncStorage.getItem('access_token');
        console.log('S7P3: Token retrieved:', token ? 'Yes' : 'No');
        
        const url = `${API_URL}/scenarios/73`;
        console.log('S7P3: Fetching from URL:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('S7P3: Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('S7P3: Data received:', data);
        
        if (data && data.scenario) {
          const transformedQuestion = {
            question: data.scenario.question_text,
            options: data.choices.map(choice => choice.choice_text),
            correct: data.choices.find(choice => choice.choice_id === data.scenario.correct_choice_id)?.choice_text,
            wrongExplanation: {}
          };
          
          data.choices.forEach(choice => {
            if (choice.choice_id !== data.scenario.correct_choice_id && choice.explanation) {
              transformedQuestion.wrongExplanation[choice.choice_text] = choice.explanation;
            }
          });
          
          setQuestions([transformedQuestion]);
          console.log('S7P3: ✅ Database questions loaded successfully');
        } else {
          console.log('S7P3: ⚠️ Invalid data structure, using fallback');
          setQuestions(fallbackQuestions);
        }
      } catch (error) {
        console.log('S7P3: ❌ Database error, using fallback questions:', error.message);
        setQuestions(fallbackQuestions);
        setError(error.message);
      }
    };

    fetchScenarioData();
  }, []);

  // Animation for player's car sprite
  useEffect(() => {
    if (!showQuestion && isPlayerCarVisible) {
      const interval = setInterval(() => {
        setPlayerCarFrame((prevFrame) => (prevFrame === 0 ? 1 : 0));
      }, 200);
      return () => clearInterval(interval);
    }
  }, [showQuestion, isPlayerCarVisible]);

  // NPC Car Animation Effect (No Loop - Single Pass)
  useEffect(() => {
    const animateNPCCar = (car, speedMultiplier = 1.4) => {
      const baseSpeed = 400000;
      const totalDistance = height + npcCarHeight * -200;
      
      return Animated.timing(car.yAnim, {
        toValue: totalDistance,
        duration: baseSpeed * speedMultiplier,
        easing: Easing.linear,
        useNativeDriver: true,
      });
    };

    const npcAnimations = [
      animateNPCCar(npcCars[0], 1.0),
      animateNPCCar(npcCars[1], 1.2),
    ];

    npcAnimations.forEach(anim => anim.start());

    return () => {
      npcAnimations.forEach(anim => anim.stop());
    };
  }, []);

  const scrollAnimationRef = useRef(null);
  const npcAnimationsRef = useRef([]);

  // Function to control NPC speed dynamically (No Loop)
  const setNPCSpeed = (speedMultiplier) => {
    npcAnimationsRef.current.forEach(anim => anim.stop());
    npcAnimationsRef.current = [];
    
    npcCars.forEach((car) => {
      const baseSpeed = 4000;
      const totalDistance = height + npcCarHeight * 2;
      
      const anim = Animated.timing(car.yAnim, {
        toValue: totalDistance,
        duration: baseSpeed * speedMultiplier,
        easing: Easing.linear,
        useNativeDriver: true,
      });
      
      anim.start();
      npcAnimationsRef.current.push(anim);
    });
  };

  function startScrollAnimation() {
    scrollY.setValue(0);

    const speedMultiplier = 3;

    scrollAnimationRef.current = Animated.loop(
      Animated.timing(scrollY, {
        toValue: -mapHeight,
        duration: mapHeight * speedMultiplier,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    scrollAnimationRef.current.start();

    const questionDelay = 2500;

    setTimeout(() => {
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }

      setIsPlayerCarVisible(true);
      setPlayerCarFrame(0);

      setShowQuestion(true);
      setTimeout(() => {
        setShowAnswers(true);
      }, 1000);
    }, questionDelay);
  }

  useEffect(() => {
    startScrollAnimation();
    return () => {
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }
    };
  }, []);

  const handleFeedback = (answerGiven) => {
    const currentQuestion = questions[questionIndex];
    const isCorrect = answerGiven === currentQuestion.correct;
    
    updateProgress(answerGiven, isCorrect);
    
    if (isCorrect) {
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

  const animateContinue70KPH = async () => {
    try {
      if (scrollAnimationRef.current) scrollAnimationRef.current.stop();

      setNPCSpeed(2.0); // Normal NPC speed
      setPlayerCarFrame(0);

      await new Promise(resolve => setTimeout(resolve, 500));

      await new Promise(resolve => {
        Animated.timing(scrollY, {
          toValue: scrollY._value - (tileSize * 3),
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(resolve);
      });

    } catch (error) {
      console.error('Error in animateContinue70KPH:', error);
    }
  };

  const animateReduceTo60KPH = async () => {
    try {
      if (scrollAnimationRef.current) scrollAnimationRef.current.stop();

      setNPCSpeed(2.0); // Slow down NPC cars

      setPlayerCarFrame(0);

      await new Promise(resolve => setTimeout(resolve, 800));

      await new Promise(resolve => {
        Animated.timing(scrollY, {
          toValue: scrollY._value - (tileSize * 1.5),
          duration: 3500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start(resolve);
      });

    } catch (error) {
      console.error('Error in animateReduceTo60KPH:', error);
    }
  };

  const animateSpeedUpTo80KPH = async () => {
    try {
      if (scrollAnimationRef.current) scrollAnimationRef.current.stop();

      setNPCSpeed(2.0); // Speed up NPC cars

      setPlayerCarFrame(0);

      await new Promise(resolve => setTimeout(resolve, 400));

      await new Promise(resolve => {
        Animated.timing(scrollY, {
          toValue: scrollY._value - (tileSize * 4),
          duration: 1500,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }).start(resolve);
      });

    } catch (error) {
      console.error('Error in animateSpeedUpTo80KPH:', error);
    }
  };

  const handleAnswer = async (answer) => {
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    setIsPlayerCarVisible(true);

    if (answer === questions[questionIndex].correct) {
      animateReduceTo60KPH();
      handleFeedback(answer);
    } else if (answer === "Continue at 70 KPH since you're following traffic flow") {
      animateContinue70KPH();
      handleFeedback(answer);
    } else if (answer === "Speed up to 80 KPH since there are no speed cameras visible") {
      animateSpeedUpTo80KPH();
      handleFeedback(answer);
    }
  };

  const handleNext = async () => {

    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null);
    setPlayerCarFrame(0);

    playerCarXAnim.setValue(playerCarInitialX);
    setPlayerCarDirection("NORTH");
    setIsPlayerCarVisible(true);

    if (questionIndex < questions.length - 1) {
         setQuestionIndex(questionIndex + 1);
       } else if (currentScenario >= 10) {
         const sessionResults = await completeSession();
         navigation.navigate('/result-page', {
           ...sessionResults,
           userAttempts: JSON.stringify(sessionResults.attempts)
         });
       } else {
      moveToNextScenario();
      router.navigate(`/scenarios/road-markings/phase3/S${currentScenario + 1}P3`);
       }
    };

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! You must always obey posted speed limits regardless of traffic flow or enforcement presence."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong answer!";

  return (
    <View style={{ flex: 1, backgroundColor: "black", overflow: 'hidden' }}>
      <Animated.View
        style={{
          position: "absolute",
          width: width,
          height: mapHeight * 2,
          left: 0,
          transform: [{
            translateY: scrollY.interpolate({
              inputRange: [-mapHeight, 0],
              outputRange: [0, -mapHeight],
              extrapolate: 'clamp',
            })
          }],
          zIndex: 1,
        }}
      >
        {[0, 1].map((multiplier) => (
          mapLayout.map((row, rowIndex) =>
            <React.Fragment key={`${rowIndex}-${multiplier}`}>
              {row.map((tile, colIndex) => (
                <Image
                  key={`${rowIndex}-${colIndex}-${multiplier}`}
                  source={roadTiles[tile]}
                  style={{
                    position: "absolute",
                    width: tileSize,
                    height: tileSize,
                    left: colIndex * tileSize,
                    top: rowIndex * tileSize + (multiplier * mapHeight),
                  }}
                  resizeMode="stretch"
                />
              ))}
            </React.Fragment>
          )
        ))}
      </Animated.View>

      {/* NPC Cars - Fixed with translateY */}
      {npcCars.map((car) => {
        const laneX = car.lane * tileSize + (tileSize / 2 - npcCarWidth / 2);
        return (
          <Animated.Image
            key={car.id}
            source={trafficCarSprites[car.sprite][0]}
            style={{
              width: npcCarWidth,
              height: npcCarHeight,
              position: "absolute",
              bottom: height * 0.4,
              left: laneX,
              zIndex: 4,
              transform: [
                {
                  translateY: car.yAnim.interpolate({
                    inputRange: [0, height + npcCarHeight * 2],
                    outputRange: [0, -(height + npcCarHeight * 2)],
                  })
                }
              ],
            }}
          />
        );
      })}

      {isPlayerCarVisible && (
        <Animated.Image
          source={playerCarSprites[playerCarDirection][playerCarFrame]}
          style={{
            width: playerCarWidth,
            height: playerCarHeight,
            position: "absolute",
            bottom: height * 0.1,
            left: playerCarXAnim,
            zIndex: 5,
          }}
        />
      )}

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

      {(animationType === "correct" || animationType === "wrong") && (
        <Animated.View style={styles.feedbackOverlay}>
          <Image source={require("../../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        </Animated.View>
      )}

      {showNext && (
        <View style={styles.nextButtonContainer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
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
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 18,
    marginTop: 20,
  },
  introContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    padding: width * 0.05,
  },
  introLTOImage: {
    width: width * 0.6,
    height: height * 0.25,
    resizeMode: "contain",
    marginBottom: height * 0.03,
  },
  introTextBox: {
    backgroundColor: "rgba(8, 8, 8, 0.7)",
    padding: width * 0.06,
    borderRadius: 15,
    alignItems: "center",
    maxWidth: width * 0.85,
    minHeight: height * 0.3,
    justifyContent: "center",
  },
  introTitle: {
    color: "white",
    fontSize: Math.min(width * 0.07, 32),
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: height * 0.02,
  },
  introText: {
    color: "white",
    fontSize: Math.min(width * 0.045, 20),
    textAlign: "center",
    marginBottom: height * 0.04,
    lineHeight: Math.min(width * 0.06, 26),
    paddingHorizontal: width * 0.02,
  },
  startButton: {
    backgroundColor: "#007bff",
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.08,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    minWidth: width * 0.4,
    alignItems: "center",
  },
  startButtonText: {
    color: "white",
    fontSize: Math.min(width * 0.055, 24),
    fontWeight: "bold",
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
    fontSize: Math.min(width * 0.045, 21),
    fontWeight: "bold",
    textAlign: "center",
  },
  answersContainer: {
    position: "absolute",
    top: height * 0.15,
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