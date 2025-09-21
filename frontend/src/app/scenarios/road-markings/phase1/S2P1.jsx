// frontend/src/app/scenarios/road-markings/phase1/S2P1.jsx
import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Image,
  Animated,
  Dimensions,
  TouchableOpacity,
  Text,
  StyleSheet,
  Easing,
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';

const { width, height } = Dimensions.get("window");

// Responsive calculations
const playerCarWidth = Math.min(width * 0.25, 280);
const playerCarHeight = playerCarWidth * (350/280);
const jeepWidth = Math.min(width * 0.28, 300);
const jeepHeight = jeepWidth * (350/280);
const overlayTop = height * 0.4;
const overlayHeight = height * 0.35;
const ltoWidth = Math.min(width * 0.3, 240);
const ltoHeight = ltoWidth * (300/240);
const sideMargin = width * 0.05;

// Road tiles
const roadTiles = {
    road17: require("../../../../../assets/road/road17.png"),
    road18: require("../../../../../assets/road/road18.png"),
    road20: require("../../../../../assets/road/road20.png"),
    road66: require("../../../../../assets/road/road66.png"),
    road67: require("../../../../../assets/road/road67.png"),
};

// Map layout
const mapLayout = [
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
  ["road18", "road66", "road67", "road17", "road20"],
];

// Vehicle sprites
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

const jeepneySprites = {
  NORTH: [
    require("../../../../../assets/car/JEEP TOPDOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_000.png"),
    require("../../../../../assets/car/JEEP TOPDOWN/Brown/MOVE/NORTH/SEPARATED/Brown_JEEP_CLEAN_NORTH_001.png"),
  ],
};

// FALLBACK QUESTIONS - ONLY USED IF DATABASE FAILS
const fallbackQuestions = [
  {
    question: "You're driving on a highway and see a single solid yellow lines in the center. Traffic is heavy, and you notice a faster-moving lane to your left.",
    options: ["Overtake by crossing the solid yellow lines to reach the faster lane", "Stay in your current lane", "Honk for a long time to make the cars move faster."],
    correct: "Stay in your current lane",
    wrongExplanation: {
      "Overtake by crossing the solid yellow lines to reach the faster lane": "Violation. Solid yellow lane means overtaking is not allowed. You can only make a left turn to another street or an establishment.",
      "Honk for a long time to make the cars move faster.": "Road rage prone! In a situation where the area is experiencing traffic, honking a lot can only make other drivers mad and wouldn't make the cars move faster."
    }
  },
];

export default function S2P1() {
  const navigation = useNavigation();

  // DATABASE STATE - REPLACES HARDCODED QUESTIONS
  const [questions, setQuestions] = useState(fallbackQuestions);
  const [loading, setLoading] = useState(true);

  // Database functions
  const fetchQuestionsFromDatabase = async () => {
    try {
      setLoading(true);
      console.log('Fetching S2P1 from:', API_URL);
      
      const token = await AsyncStorage.getItem('access_token');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const scenarioResponse = await fetch(`${API_URL}/scenarios/2`, { headers });
      const choicesResponse = await fetch(`${API_URL}/scenario_choices/2`, { headers });
      
      console.log('S2P1 Scenario response:', scenarioResponse.status);
      console.log('S2P1 Choices response:', choicesResponse.status);
      
      if (scenarioResponse.ok && choicesResponse.ok) {
        const scenarioData = await scenarioResponse.json();
        const choicesData = await choicesResponse.json();
        
        console.log('S2P1 Scenario data:', scenarioData);
        console.log('S2P1 Choices data:', choicesData);
        
        const correctChoice = choicesData.find(choice => choice.is_correct);
        
        const dbQuestions = [{
          question: scenarioData.description || scenarioData.title,
          options: choicesData.map(choice => choice.text),
          correct: correctChoice?.text || "",
          correctExplanation: correctChoice?.explanation || "",
          wrongExplanation: choicesData.reduce((acc, choice) => {
            if (!choice.is_correct) {
              acc[choice.text] = choice.explanation;
            }
            return acc;
          }, {})
        }];
        
        setQuestions(dbQuestions);
        console.log('S2P1 Database questions loaded successfully');
      } else {
        console.log('S2P1 Database fetch failed, using fallback questions');
      }
    } catch (error) {
      console.log('S2P1 Database error, using fallback questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordAttempt = async (selectedChoice, isCorrect) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) return;

      const payload = {
        user_id: 1,
        scenario_id: 2,
        selected_option: selectedChoice,
        is_correct: isCorrect,
        attempt_time: new Date().toISOString(),
      };

      console.log('S2P1 Sending to backend:', payload);

      await fetch(`${API_URL}/attempts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      console.log('S2P1 Attempt recorded:', selectedChoice, isCorrect);
    } catch (err) {
      console.log('S2P1 Failed to record attempt:', err);
    }
  };

  const updateProgress = async (isCompleted = false) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) return;

      await fetch(`${API_URL}/progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 1,
          category_id: 2,
          phase_id: 1,
          scenario_id: 2,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        }),
      });
      console.log('S2P1 Progress updated:', isCompleted);
    } catch (err) {
      console.log('S2P1 Failed to update progress:', err);
    }
  };

  // Fetch database questions on component mount
  useEffect(() => {
    fetchQuestionsFromDatabase();
  }, []);

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  const [isPlayerCarVisible, setIsPlayerCarVisible] = useState(true);
  const [isJeepneyVisible, setIsJeepneyVisible] = useState(true);

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
  const [jeepneyFrame, setJeepneyFrame] = useState(0);

  const playerCarXAnim = useRef(new Animated.Value(width / 2 - playerCarWidth / 2)).current;
  const jeepneyInitialX = 2 * tileSize + (tileSize / 2 - jeepWidth / 2);
  const jeepneyYAnim = useRef(new Animated.Value(-jeepHeight)).current;

  const correctAnim = useRef(new Animated.Value(0)).current;
  const wrongAnim = useRef(new Animated.Value(0)).current;

  // Animation for player's car sprite
  useEffect(() => {
    if (!showQuestion && isPlayerCarVisible) {
      const interval = setInterval(() => {
        setPlayerCarFrame((prevFrame) => (prevFrame === 0 ? 1 : 0));
      }, 200);
      return () => clearInterval(interval);
    }
  }, [showQuestion, isPlayerCarVisible]);

  // Animation for jeepney's sprite
  useEffect(() => {
    if (!showQuestion && isJeepneyVisible) {
      const interval = setInterval(() => {
        setJeepneyFrame((prevFrame) => (prevFrame === 0 ? 1 : 0));
      }, 250);
      return () => clearInterval(interval);
    }
  }, [showQuestion, isJeepneyVisible]);

  const scrollAnimationRef = useRef(null);
  const jeepneyAnimationRef = useRef(null);

  function startScrollAnimation() {
    scrollY.setValue(0);
    jeepneyYAnim.setValue(-jeepHeight);

    scrollAnimationRef.current = Animated.loop(
      Animated.timing(scrollY, {
        toValue: -mapHeight,
        duration: mapHeight * 10,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    scrollAnimationRef.current.start();

    jeepneyAnimationRef.current = Animated.timing(jeepneyYAnim, {
      toValue: -height * 0.2,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: true,
    });

    jeepneyAnimationRef.current.start(() => {
      setTimeout(() => {
        if (scrollAnimationRef.current) {
          scrollAnimationRef.current.stop();
        }
        setIsPlayerCarVisible(true);
        setIsJeepneyVisible(true);
        setPlayerCarFrame(0);
        setJeepneyFrame(0);

        setShowQuestion(true);
        setTimeout(() => {
          setShowAnswers(true);
        }, 1000);
      }, 2000);
    });
  }

  useEffect(() => {
    startScrollAnimation();
    return () => {
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }
      if (jeepneyAnimationRef.current) {
        jeepneyAnimationRef.current.stop();
      }
    };
  }, []);

  const handleFeedback = async (answerGiven) => {
    const currentQuestion = questions[questionIndex];
    const isCorrect = answerGiven === currentQuestion.correct;
    
    setIsCorrectAnswer(isCorrect);

    await recordAttempt(answerGiven, isCorrect);
    if (isCorrect) {
      await updateProgress(true);
    }

    if (isCorrect) {
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

  const animateOvertake = async (targetX) => {
    return new Promise(async (resolve) => {
      if (scrollAnimationRef.current) scrollAnimationRef.current.stop();

      setPlayerCarFrame(0);
      setJeepneyFrame(0);

      await new Promise(resolveStep => {
        setPlayerCarDirection("NORTHWEST");
        Animated.parallel([
          Animated.timing(playerCarXAnim, {
            toValue: targetX,
            duration: 300,
            easing: Easing.easeOut,
            useNativeDriver: false,
          }),
          Animated.timing(scrollY, {
            toValue: scrollY._value - (tileSize * 0.5),
            duration: 300,
            easing: Easing.easeOut,
            useNativeDriver: true,
          })
        ]).start(resolveStep);
      });

      await new Promise(resolveStep => {
        setPlayerCarDirection("NORTH");
        Animated.parallel([
          Animated.timing(jeepneyYAnim, {
            toValue: height + jeepHeight,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(scrollY, {
            toValue: scrollY._value - (tileSize * 3),
            duration: 1000,
            easing: Easing.easeOut,
            useNativeDriver: true,
          }),
        ]).start(resolveStep);
      });
      setIsJeepneyVisible(false);

      await new Promise(resolveStep => {
        setPlayerCarDirection("NORTHEAST");
        Animated.parallel([
          Animated.timing(playerCarXAnim, {
            toValue: width / 2 - playerCarWidth / 2,
            duration: 400,
            easing: Easing.easeOut,
            useNativeDriver: false,
          }),
          Animated.timing(scrollY, {
            toValue: scrollY._value - (tileSize * 0.5),
            duration: 400,
            easing: Easing.easeOut,
            useNativeDriver: true,
          })
        ]).start(resolveStep);
      });

      setPlayerCarDirection("NORTH");

      if (scrollAnimationRef.current) scrollAnimationRef.current.start();
      setIsPlayerCarVisible(true);
      setIsJeepneyVisible(false);
      
      resolve();
    });
  };

  const animateHonking = async () => {
    return new Promise(async (resolve) => {
      if (scrollAnimationRef.current) scrollAnimationRef.current.stop();

      setPlayerCarFrame(0);
      setJeepneyFrame(0);

      // Simple animation - just move forward slightly while "honking"
      await new Promise(resolveStep => {
        Animated.timing(scrollY, {
          toValue: scrollY._value - (tileSize * 1),
          duration: 2000,
          easing: Easing.easeOut,
          useNativeDriver: true,
        }).start(resolveStep);
      });

      if (scrollAnimationRef.current) scrollAnimationRef.current.start();
      
      resolve();
    });
  };

  const handleAnswer = (answer) => {
    console.log('S2P1 Answer selected:', answer);
    setSelectedAnswer(answer);
    setShowQuestion(false);
    setShowAnswers(false);

    if (scrollAnimationRef.current) {
      scrollAnimationRef.current.start();
    }
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);

    const currentQuestion = questions[questionIndex];
    const isCorrect = answer === currentQuestion.correct;

    if (isCorrect) {
      handleFeedback(answer);
    } else {
      // Dynamic animation logic based on answer content patterns
      const answerLower = answer.toLowerCase();
      
      if (answerLower.includes('overtake') && answerLower.includes('crossing')) {
        // Animation for overtaking across solid yellow lines
        const targetX = 1 * tileSize + (tileSize / 2 - playerCarWidth / 2);
        animateOvertake(targetX).then(() => {
          handleFeedback(answer);
        });
      } else if (answerLower.includes('honk')) {
        // Animation for honking behavior
        animateHonking().then(() => {
          handleFeedback(answer);
        });
      } else {
        // For other wrong answers, just show feedback immediately
        handleFeedback(answer);
      }
    }
  };

  const handleNext = () => {
    setAnimationType(null);
    setShowNext(false);
    setSelectedAnswer(null);
    setIsCorrectAnswer(null);
    setPlayerCarFrame(0);
    setJeepneyFrame(0);

    const centerX = width / 2 - playerCarWidth / 2;
    playerCarXAnim.setValue(centerX);
    setPlayerCarDirection("NORTH");
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      startScrollAnimation();
    } else {
        console.log('Trying to navigate to S3P1');
      navigation.navigate('S3P1');
      setShowQuestion(false);
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }
      if (jeepneyAnimationRef.current) {
        jeepneyAnimationRef.current.stop();
      }
    }
  };

  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! " + (currentQuestionData.correctExplanation || "Solid yellow lane means you cannot overtake. Stay in your lane to avoid unnecessary accidents.")
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong answer!";

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "black", justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 18 }}>Loading S2P1 scenario...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "black", overflow: 'hidden' }}>
      {/* Map - Looping background */}
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

      {/* Responsive Jeepney */}
      {isJeepneyVisible && (
        <Animated.Image
          source={jeepneySprites.NORTH[jeepneyFrame]}
          style={{
            width: jeepWidth,
            height: jeepHeight,
            position: "absolute",
            left: jeepneyInitialX,
            transform: [{ translateY: jeepneyYAnim }],
            zIndex: 4,
          }}
        />
      )}

      {/* Responsive Player Car */}
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

      {/* Question Overlay - NOW USES DATABASE DATA */}
      {showQuestion && (
        <View style={styles.questionOverlay}>
          <Image
            source={require("../../../../../assets/dialog/LTO.png")}
            style={styles.ltoImage}
          />
          <View style={styles.questionBox}>
            <View style={styles.questionTextContainer}>
              <Text style={styles.questionText}>
                {currentQuestionData.question}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Answer Choices - NOW USES DATABASE DATA */}
      {showAnswers && (
        <View style={styles.answersContainer}>
          {currentQuestionData.options.map((option) => (
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

      {/* Responsive Feedback - Correct/Wrong */}
      {(animationType === "correct" || animationType === "wrong") && (
        <Animated.View style={styles.feedbackOverlay}>
          <Image source={require("../../../../../assets/dialog/LTO.png")} style={styles.ltoImage} />
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        </Animated.View>
      )}

      {/* Responsive Next Button */}
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
  questionOverlay: {
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
  ltoImage: {
    width: ltoWidth,
    height: ltoHeight,
    resizeMode: "contain",
    marginLeft: -width * 0.03,
    marginBottom: -height * 0.09,
  },
  questionBox: {
    flex: 1,
    bottom: height * 0.1,
    alignItems: "center",
    justifyContent: "center",
  },
  questionTextContainer: {
    padding: -height * 0.04,
    maxWidth: width * 0.6,
  },
  questionText: {
    color: "white",
    fontSize: Math.min(width * 0.045, 28),
    fontWeight: "bold",
    textAlign: "center",
  },
  answersContainer: {
    position: "absolute",
    top: height * 0.4,
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
    fontSize: Math.min(width * 0.06, 28),
    fontWeight: "bold",
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