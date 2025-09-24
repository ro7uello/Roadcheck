// S5P1.jsx - COMPLETE FIXED VERSION
import React, { useRef, useEffect, useState } from "react";
import { View, Image, Animated, Dimensions, TouchableOpacity, Text, StyleSheet, Easing } from "react-native";
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
    road6: require("../../../../../assets/road/road6.png"),
    road8: require("../../../../../assets/road/road8.png"),
    road17: require("../../../../../assets/road/road17.png"),
    road18: require("../../../../../assets/road/road18.png"),
    road20: require("../../../../../assets/road/road20.png"),
};

// Map layout
const mapLayout = [
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
  ["road18", "road8", "road6", "road17", "road20"],
];

// Separated sprites for clarity and easier management
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

// Fallback questions
const fallbackQuestions = [
  {
    question: "You encounter double solid yellow lines but traffic on your side has completely stopped. You're tempted to use the opposite lane to bypass the jam.",
    options: ["Move to the opposite lane to bypass the traffic jam.", "Check if the opposite lane is clear and overtake to move further on the road.", "Stay on your lane."],
    correct: "Stay on your lane.",
    wrongExplanation: {
      "Move to the opposite lane to bypass the traffic jam.": "Violation! Double solid yellow lines prohibit crossing regardless of traffic conditions on either side.",
      "Check if the opposite lane is clear and overtake to move further on the road.": "Violation! Even if the opposite lane is clear, double solid yellow lines prohibit overtaking and crossing."
    }
  },
];

export default function DrivingGame() {
  const navigation = useNavigation();

  const numColumns = mapLayout[0].length;
  const tileSize = width / numColumns;
  const mapHeight = mapLayout.length * tileSize;

  // Database integration state
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState(fallbackQuestions);
  const [error, setError] = useState(null);

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

  // Database integration: Fetch scenario data
  useEffect(() => {
    const fetchScenarioData = async () => {
      try {
        console.log('S5P1: Fetching scenario data...');
        console.log('S5P1: API_URL value:', API_URL);

        const token = await AsyncStorage.getItem('access_token');
        console.log('S5P1: Token retrieved:', token ? 'Yes' : 'No');

        const url = `${API_URL}/scenarios/5`;
        console.log('S5P1: Fetching from URL:', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('S5P1: Response status:', response.status);

        if (!response || !response.ok) {
          throw new Error(`HTTP ${response?.status || 'unknown'}: ${response?.statusText || 'No response'}`);
        }

        const data = await response.json();
        console.log('S5P1: Data received:', data);

        if (data && data.success && data.data) {
          const transformedQuestion = {
            question: data.data.question,
            options: data.data.options,
            correct: data.data.correct_answer,
            wrongExplanation: data.data.wrong_explanations || {}
          };

          setQuestions([transformedQuestion]);
          console.log('S5P1: ✅ Database questions loaded successfully');
        } else {
          console.log('S5P1: ⚠️ Invalid data structure, using fallback');
          setQuestions(fallbackQuestions);
        }
      } catch (error) {
        console.log('S5P1: ❌ Database error, using fallback questions:', error.message);
        setQuestions(fallbackQuestions);
        setError(error.message);
      } finally {
        console.log('S5P1: Setting loading to false');
        setLoading(false);
      }
    };

    fetchScenarioData();
  }, []);

  // Animation initialization
  useEffect(() => {
    console.log('S5P1: Animation useEffect triggered. Loading:', loading, 'Questions length:', questions.length);

    if (!loading && questions.length > 0) {
      console.log('S5P1: Starting scroll animation');
      startScrollAnimation();
    }
  }, [loading, questions]);

  // Function to update user progress
  const updateProgress = async (scenarioId, selectedOption, isCorrect) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const userId = await AsyncStorage.getItem('user_id');

      if (!token || !userId) {
        console.log('S5P1: No token or user_id found for progress update');
        return;
      }

      console.log('S5P1: Updating progress:', {
        user_id: parseInt(userId),
        scenario_id: scenarioId,
        selected_option: selectedOption,
        is_correct: isCorrect,
        completed_at: new Date().toISOString()
      });

      const response = await fetch(`${API_URL}/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: parseInt(userId),
          scenario_id: scenarioId,
          selected_option: selectedOption,
          is_correct: isCorrect,
          completed_at: new Date().toISOString()
        })
      });

      if (response.ok) {
        console.log('S5P1: ✅ Progress updated successfully');
      } else {
        console.log('S5P1: ⚠️ Failed to update progress:', response.status);
      }
    } catch (error) {
      console.log('S5P1: ❌ Error updating progress:', error.message);
    }
  };

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
    console.log('S5P1: startScrollAnimation called');
    scrollY.setValue(0);
    jeepneyYAnim.setValue(-jeepHeight);

    playerCarXAnim.setValue(width / 2 - playerCarWidth / 2);
    setPlayerCarDirection("NORTH");
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);

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

        console.log('S5P1: Animation completed, showing question');
        setShowQuestion(true);
        setTimeout(() => {
          setShowAnswers(true);
        }, 1000);
      }, 2000);
    });
  }

  // Updated handleFeedback function from S2P1
  const handleFeedback = (answerGiven) => {
    const currentQuestion = questions[questionIndex];
    const isCorrect = answerGiven === currentQuestion.correct;

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

  // Animation functions
  const animateStayInLane = async () => {
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    if (jeepneyAnimationRef.current) jeepneyAnimationRef.current.stop();

    setPlayerCarDirection("NORTH");
    setPlayerCarFrame(0);
    setJeepneyFrame(0);
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);

    await new Promise(resolve => {
        Animated.timing(scrollY, {
            toValue: scrollY._value - (tileSize * 2),
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true,
        }).start(resolve);
    });

    await new Promise(resolve => setTimeout(resolve, 500));
    handleFeedback(selectedAnswer);
  };

  const animateSuddenOvertake = async () => {
    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    if (jeepneyAnimationRef.current) jeepneyAnimationRef.current.stop();

    setPlayerCarFrame(0);
    setJeepneyFrame(0);
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);

    const targetXLeftLane = 1 * tileSize + (tileSize / 2 - playerCarWidth / 2);

    await new Promise(resolve => {
        setPlayerCarDirection("NORTHWEST");
        Animated.parallel([
            Animated.timing(playerCarXAnim, {
                toValue: targetXLeftLane,
                duration: 400,
                easing: Easing.easeOut,
                useNativeDriver: false,
            }),
            Animated.timing(scrollY, {
                toValue: scrollY._value - (tileSize * 0.8),
                duration: 400,
                easing: Easing.easeOut,
                useNativeDriver: true,
            })
        ]).start(resolve);
    });

    await new Promise(resolve => {
        setPlayerCarDirection("NORTH");
        Animated.parallel([
            Animated.timing(jeepneyYAnim, {
                toValue: height + jeepHeight,
                duration: 800,
                easing: Easing.easeIn,
                useNativeDriver: true,
            }),
            Animated.timing(scrollY, {
                toValue: scrollY._value - (tileSize * 4),
                duration: 800,
                easing: Easing.easeOut,
                useNativeDriver: true,
            }),
        ]).start(resolve);
    });
    setIsJeepneyVisible(false);

    setPlayerCarDirection("NORTH");
    await new Promise(resolve => setTimeout(resolve, 1000));
    handleFeedback(selectedAnswer);
  };

  const handleAnswer = async (option) => {
    setSelectedAnswer(option);
    setShowQuestion(false);
    setShowAnswers(false);

    const isCorrect = option === questions[questionIndex].correct;
    await updateProgress(5, option, isCorrect);

    if (scrollAnimationRef.current) scrollAnimationRef.current.stop();
    if (jeepneyAnimationRef.current) jeepneyAnimationRef.current.stop();
    setIsPlayerCarVisible(true);
    setIsJeepneyVisible(true);
    setPlayerCarFrame(0);
    setJeepneyFrame(0);

    const actualCorrectAnswer = questions[questionIndex].correct;

    if (option === actualCorrectAnswer) {
      if (option === "Stay on your lane.") {
        await animateStayInLane();
      }
    } else {
        if (option === "Move to the opposite lane to bypass the traffic jam.") {
            await animateSuddenOvertake();
        } else if (option === "Check if the opposite lane is clear and overtake to move further on the road.") {
            await animateSuddenOvertake();
        } else {
            await new Promise(resolve => setTimeout(resolve, 1000));
            handleFeedback(option);
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
      navigation.navigate('S6P1');
      setShowQuestion(false);
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }
      if (jeepneyAnimationRef.current) {
          jeepneyAnimationRef.current.stop();
      }
    }
  };

  // Determine the feedback message
  const currentQuestionData = questions[questionIndex];
  const feedbackMessage = isCorrectAnswer
    ? "Correct! Solid yellow double lines means that you cannot overtake or cross. Respecting the road markings will help you avoid violations, accidents, and potential road rage."
    : currentQuestionData.wrongExplanation[selectedAnswer] || "Wrong answer!";

  // Show loading screen while fetching data
  if (loading) {
    console.log('S5P1: Showing loading screen. Loading:', loading, 'Questions length:', questions.length);
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading scenario...</Text>
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

      {/* Responsive Question Overlay */}
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

      {/* Responsive Answers */}
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

      {/* Responsive Feedback */}
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
  loadingContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 20,
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
    fontSize: Math.min(width * 0.045, 24),
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